import { readFile } from "node:fs/promises";
import { Command } from "commander";
import { buildDenueAreaActivityUrl, fetchDenueAreaActivity, type DenueFetchOptions } from "@/lib/denue/client";
import { env } from "@/lib/config";
import { buildDenueSamplePlan, denueManufacturingSectors, denueStateSamples } from "@/lib/denue/sample-plan";
import { createIngestionRun, finishIngestionRun, upsertDenueRecord } from "@/lib/denue/repository";
import type { DenueRawRecord } from "@/lib/denue/types";
import { logger } from "@/lib/logger";

const program = new Command()
  .option("--fixture <path>", "Load local DENUE-shaped JSON instead of calling the API")
  .option("--state <state>", "Two-digit state code", "19")
  .option("--states <states>", "Comma-separated state codes for sampling")
  .option("--sector <sector>", "Economic sector code; manufacturing is 31, 32, 33", "31")
  .option("--sectors <sectors>", "Comma-separated sector codes for sampling")
  .option("--sample", "Run a balanced sample across configured states and sectors", false)
  .option("--limit <limit>", "Approximate maximum records to request in sample mode", "1000")
  .option("--page-size <pageSize>", "Records per DENUE request in sample mode", "100")
  .option("--from <from>", "Initial record number", "1")
  .option("--to <to>", "Final record number", "100")
  .option("--dry-run", "Parse and report without writing to the database", false);

program.parse();
const options = program.opts<{
  fixture?: string;
  state: string;
  states?: string;
  sector: string;
  sectors?: string;
  sample: boolean;
  limit: string;
  pageSize: string;
  from: string;
  to: string;
  dryRun: boolean;
}>();

type LoadedRecord = {
  record: DenueRawRecord;
  sourceUrl?: string;
};

function redactToken(url: string) {
  const token = env.DENUE_API_TOKEN;
  return token ? url.replace(token, "[REDACTED_DENUE_API_TOKEN]") : url;
}

async function loadRecords(): Promise<LoadedRecord[]> {
  if (options.fixture) {
    const contents = await readFile(options.fixture, "utf8");
    return (JSON.parse(contents) as DenueRawRecord[]).map((record) => ({ record, sourceUrl: "fixture" }));
  }

  if (options.sample) {
    const states = options.states?.split(",").map((state) => state.trim()).filter(Boolean);
    const sectors = options.sectors?.split(",").map((sector) => sector.trim()).filter(Boolean);
    const batches = buildDenueSamplePlan({
      states: states?.length ? states : denueStateSamples.map((state) => state.code),
      sectors: sectors?.length ? sectors : denueManufacturingSectors,
      limit: Number(options.limit),
      pageSize: Number(options.pageSize)
    });
    const loaded: LoadedRecord[] = [];

    for (const batch of batches) {
      const request: DenueFetchOptions = {
        state: batch.state,
        economicSector: batch.sector,
        from: batch.from,
        to: batch.to
      };
      logger.info({ state: batch.state, sector: batch.sector, from: batch.from, to: batch.to }, "fetching DENUE sample batch");
      const sourceUrl = env.DENUE_API_TOKEN ? redactToken(buildDenueAreaActivityUrl(request, env.DENUE_API_TOKEN)) : undefined;
      const records = await fetchDenueAreaActivity(request);
      loaded.push(...records.map((record) => ({ record, sourceUrl })));
    }

    return loaded.slice(0, Number(options.limit));
  }

  const request: DenueFetchOptions = {
    state: options.state,
    economicSector: options.sector,
    from: Number(options.from),
    to: Number(options.to)
  };
  const sourceUrl = env.DENUE_API_TOKEN ? redactToken(buildDenueAreaActivityUrl(request, env.DENUE_API_TOKEN)) : undefined;
  return (await fetchDenueAreaActivity(request)).map((record) => ({ record, sourceUrl }));
}

async function main() {
  const parameters = {
    state: options.state,
    states: options.states ?? null,
    sector: options.sector,
    sectors: options.sectors ?? null,
    sample: options.sample,
    limit: Number(options.limit),
    pageSize: Number(options.pageSize),
    from: Number(options.from),
    to: Number(options.to),
    fixture: options.fixture ?? null,
    dryRun: options.dryRun
  };
  const records = await loadRecords();

  if (options.dryRun) {
    logger.info({ recordsDiscovered: records.length, parameters }, "DENUE dry run completed");
    return;
  }

  const runId = await createIngestionRun("INEGI_DENUE", parameters);
  const stats = {
    recordsDiscovered: records.length,
    recordsInserted: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    recordsFailed: 0
  };

  try {
    for (const { record, sourceUrl } of records) {
      try {
        const result = await upsertDenueRecord(runId, record, sourceUrl);
        if (result.companyInserted) {
          stats.recordsInserted += 1;
        } else {
          stats.recordsUpdated += 1;
        }
      } catch (error) {
        stats.recordsFailed += 1;
        logger.error({ error, recordId: record.Id }, "failed to ingest DENUE record");
      }
    }

    await finishIngestionRun(runId, stats.recordsFailed ? "failed" : "completed", stats);
    logger.info({ runId, ...stats }, "DENUE ingestion finished");
  } catch (error) {
    await finishIngestionRun(runId, "failed", {
      ...stats,
      errorMessage: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

main().catch((error) => {
  logger.error({ error }, "DENUE ingestion failed");
  process.exitCode = 1;
});
