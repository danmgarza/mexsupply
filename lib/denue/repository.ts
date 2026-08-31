import { query } from "@/lib/db/pool";
import { env } from "@/lib/config";
import { normalizeDenueRecord } from "@/lib/denue/normalize";
import type { DenueRawRecord } from "@/lib/denue/types";

export async function createIngestionRun(source: string, parameters: Record<string, unknown>) {
  const result = await query<{ id: string }>(
    `insert into ingestion_runs (source, status, parameters, started_at)
     values ($1, 'running', $2, now())
     returning id`,
    [source, parameters]
  );
  return result.rows[0].id;
}

export async function finishIngestionRun(
  id: string,
  status: "completed" | "failed",
  stats: {
    recordsDiscovered: number;
    recordsInserted: number;
    recordsUpdated: number;
    recordsSkipped: number;
    recordsFailed: number;
    errorMessage?: string;
  }
) {
  await query(
    `update ingestion_runs
     set status = $2,
         completed_at = now(),
         records_discovered = $3,
         records_inserted = $4,
         records_updated = $5,
         records_skipped = $6,
         records_failed = $7,
         error_message = $8
     where id = $1`,
    [
      id,
      status,
      stats.recordsDiscovered,
      stats.recordsInserted,
      stats.recordsUpdated,
      stats.recordsSkipped,
      stats.recordsFailed,
      stats.errorMessage ?? null
    ]
  );
}

export async function upsertDenueRecord(runId: string, record: DenueRawRecord, sourceUrl?: string) {
  const normalized = normalizeDenueRecord(record);

  const raw = await query<{ id: string; inserted: boolean }>(
    `insert into raw_denue (source_record_id, ingestion_run_id, retrieved_at, source_version, source_url, raw_payload)
     values ($1, $2, now(), $3, $4, $5)
     on conflict (source_record_id) do update
       set ingestion_run_id = excluded.ingestion_run_id,
           retrieved_at = excluded.retrieved_at,
           source_version = excluded.source_version,
           source_url = excluded.source_url,
           raw_payload = excluded.raw_payload
     returning id, (xmax = 0) as inserted`,
    [normalized.sourceRecordId, runId, env.DENUE_SOURCE_VERSION, sourceUrl ?? null, record]
  );

  const company = await query<{ id: string; inserted: boolean }>(
    `insert into companies (
       denue_id, legal_name, trade_name, normalized_name, website, website_domain, phone, normalized_phone, email,
       street, city, municipality, state, postal_code, latitude, longitude,
       employee_size_band, industry_code, industry_label, establishment_status,
       is_manufacturing_candidate
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
     on conflict (denue_id) do update
       set legal_name = excluded.legal_name,
           trade_name = excluded.trade_name,
           normalized_name = excluded.normalized_name,
           website = excluded.website,
           website_domain = excluded.website_domain,
           phone = excluded.phone,
           normalized_phone = excluded.normalized_phone,
           email = excluded.email,
           street = excluded.street,
           city = excluded.city,
           municipality = excluded.municipality,
           state = excluded.state,
           postal_code = excluded.postal_code,
           latitude = excluded.latitude,
           longitude = excluded.longitude,
           employee_size_band = excluded.employee_size_band,
           industry_code = excluded.industry_code,
           industry_label = excluded.industry_label,
           establishment_status = excluded.establishment_status,
           is_manufacturing_candidate = excluded.is_manufacturing_candidate,
           updated_at = now()
     returning id, (xmax = 0) as inserted`,
    [
      normalized.denueId,
      normalized.legalName,
      normalized.tradeName,
      normalized.normalizedName,
      normalized.website,
      normalized.websiteDomain,
      normalized.phone,
      normalized.normalizedPhone,
      normalized.email,
      normalized.street,
      normalized.city,
      normalized.municipality,
      normalized.state,
      normalized.postalCode,
      normalized.latitude,
      normalized.longitude,
      normalized.employeeSizeBand,
      normalized.industryCode,
      normalized.industryLabel,
      normalized.establishmentStatus,
      normalized.isManufacturingCandidate
    ]
  );

  await query(
    `insert into company_sources (
       company_id, source, source_record_id, source_url, source_version,
       first_seen_at, last_seen_at, raw_record_reference
     )
     values ($1, 'INEGI_DENUE', $2, $3, null, now(), now(), $4)
     on conflict (company_id, source, source_record_id) do update
       set last_seen_at = now(),
           raw_record_reference = excluded.raw_record_reference`,
    [
      company.rows[0].id,
      normalized.sourceRecordId,
      `https://www.inegi.org.mx/app/mapa/denue/default.aspx?idee=${normalized.sourceRecordId}`,
      raw.rows[0].id
    ]
  );

  return {
    rawInserted: raw.rows[0].inserted,
    companyInserted: company.rows[0].inserted
  };
}
