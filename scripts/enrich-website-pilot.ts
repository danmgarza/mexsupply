import { Command } from "commander";
import { rankWebsiteEnrichmentCandidates, type EnrichmentCandidateInput } from "@/lib/analysis/enrichment-priority";
import { qualifiedSupplierSql } from "@/lib/analysis/qualification";
import { query } from "@/lib/db/pool";
import { extractWebsiteClaims } from "@/lib/enrichment/extract";
import { fetchWebsiteHomepage } from "@/lib/enrichment/fetch-website";
import { saveWebsiteClaims } from "@/lib/enrichment/repository";

const program = new Command()
  .option("--limit <limit>", "Number of website candidates to process", "5")
  .option("--offset <offset>", "Number of ranked website candidates to skip", "0")
  .option("--timeout <milliseconds>", "Homepage fetch timeout per company", "10000")
  .option("--select-only", "Only print the ranked queue without fetching websites", false)
  .option("--write", "Persist extracted claims to company_evidence and taxonomy link tables", false);

program.parse();
const options = program.opts<{
  limit: string;
  offset: string;
  timeout: string;
  selectOnly: boolean;
  write: boolean;
}>();

type PilotResult = {
  id: string;
  name: string;
  website: string | null;
  state: string | null;
  city: string | null;
  score: number;
  status: "selected" | "fetched" | "no_claims" | "failed";
  finalUrl?: string;
  reason?: string;
  claims?: Array<{
    claimType: string;
    claimValue: string;
    confidence: number;
    evidenceText: string;
    evidenceId?: string;
  }>;
};

function evidenceIdFor(claim: unknown) {
  if (!claim || typeof claim !== "object" || !("evidenceId" in claim)) {
    return undefined;
  }
  return typeof claim.evidenceId === "string" ? claim.evidenceId : undefined;
}

const qualifiedSql = qualifiedSupplierSql("");
const candidateResult = await query<EnrichmentCandidateInput>(
  `select id, trade_name, legal_name, normalized_name, employee_size_band, industry_code,
          industry_label, website, phone, normalized_phone, email, city, state
   from companies
   where ${qualifiedSql}
     and nullif(website, '') is not null
   order by trade_name nulls last, legal_name nulls last`
);

const limit = Number(options.limit);
const offset = Number(options.offset);
const queue = rankWebsiteEnrichmentCandidates(candidateResult.rows);
const candidates = queue.slice(offset, offset + limit);
const results: PilotResult[] = [];

for (const candidate of candidates) {
  const name = candidate.trade_name || candidate.legal_name || candidate.normalized_name || candidate.id;
  const baseResult = {
    id: candidate.id,
    name,
    website: candidate.website,
    state: candidate.state,
    city: candidate.city,
    score: candidate.score
  };

  if (options.selectOnly) {
    results.push({ ...baseResult, status: "selected" });
    continue;
  }

  if (!candidate.website) {
    results.push({ ...baseResult, status: "failed", reason: "missing website" });
    continue;
  }

  const fetchResult = await fetchWebsiteHomepage(candidate.website, Number(options.timeout));
  if (!fetchResult.ok) {
    results.push({ ...baseResult, status: "failed", finalUrl: fetchResult.finalUrl, reason: fetchResult.reason });
    continue;
  }

  const claims = extractWebsiteClaims(fetchResult.html);
  if (!claims.length) {
    results.push({ ...baseResult, status: "no_claims", finalUrl: fetchResult.finalUrl, claims: [] });
    continue;
  }

  const savedClaims = options.write ? await saveWebsiteClaims(candidate.id, fetchResult.finalUrl, claims) : claims;
  results.push({
    ...baseResult,
    status: "fetched",
    finalUrl: fetchResult.finalUrl,
    claims: savedClaims.map((claim) => ({
      claimType: claim.claimType,
      claimValue: claim.claimValue,
      confidence: claim.confidence,
      evidenceText: claim.evidenceText,
      evidenceId: evidenceIdFor(claim)
    }))
  });
}

console.log(
  JSON.stringify(
    {
      mode: options.selectOnly ? "select-only" : options.write ? "write" : "dry-run",
      availableWebsiteCandidates: queue.length,
      offset,
      processed: results.length,
      results
    },
    null,
    2
  )
);
