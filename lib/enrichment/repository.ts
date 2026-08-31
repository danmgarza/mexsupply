import type { ExtractedClaim } from "@/lib/enrichment/extract";
import { query } from "@/lib/db/pool";

type EvidenceRow = {
  id: string;
};

type TaxonomyRow = {
  id: string;
};

export type SavedClaim = ExtractedClaim & {
  evidenceId: string;
};

async function findExistingEvidence(companyId: string, claim: ExtractedClaim, sourceUrl: string) {
  const result = await query<EvidenceRow>(
    `select id
     from company_evidence
     where company_id = $1
       and claim_type = $2
       and claim_value = $3
       and source_url = $4
     limit 1`,
    [companyId, claim.claimType, claim.claimValue, sourceUrl]
  );
  return result.rows[0]?.id;
}

async function insertEvidence(companyId: string, claim: ExtractedClaim, sourceUrl: string, sourceName: string) {
  const result = await query<EvidenceRow>(
    `insert into company_evidence (
       company_id, claim_type, claim_value, source, source_url, evidence_text,
       extracted_at, extraction_method, confidence
     )
     values ($1, $2, $3, $4, $5, $6, now(), $7, $8)
     returning id`,
    [companyId, claim.claimType, claim.claimValue, sourceName, sourceUrl, claim.evidenceText, "website-homepage-keyword-v1", claim.confidence]
  );
  return result.rows[0].id;
}

async function taxonomyId(table: "capabilities" | "industries" | "materials" | "certifications", slug: string) {
  const result = await query<TaxonomyRow>(`select id from ${table} where slug = $1 limit 1`, [slug]);
  return result.rows[0]?.id;
}

async function linkClaim(companyId: string, claim: ExtractedClaim, evidenceId: string, sourceName: string) {
  if (!claim.taxonomySlug) {
    return;
  }

  if (claim.claimType === "capability") {
    const id = await taxonomyId("capabilities", claim.taxonomySlug);
    if (!id) return;
    await query(
      `insert into company_capabilities (company_id, capability_id, confidence, evidence_source_id, evidence_text, extracted_at)
       values ($1, $2, $3, $4, $5, now())
       on conflict (company_id, capability_id) do update set
         confidence = greatest(company_capabilities.confidence, excluded.confidence),
         evidence_source_id = excluded.evidence_source_id,
         evidence_text = excluded.evidence_text,
         extracted_at = excluded.extracted_at`,
      [companyId, id, claim.confidence, evidenceId, claim.evidenceText]
    );
    return;
  }

  if (claim.claimType === "industry_served") {
    const id = await taxonomyId("industries", claim.taxonomySlug);
    if (!id) return;
    await query(
      `insert into company_industries (company_id, industry_id, confidence, evidence_source_id, evidence_text, extracted_at)
       values ($1, $2, $3, $4, $5, now())
       on conflict (company_id, industry_id) do update set
         confidence = greatest(company_industries.confidence, excluded.confidence),
         evidence_source_id = excluded.evidence_source_id,
         evidence_text = excluded.evidence_text,
         extracted_at = excluded.extracted_at`,
      [companyId, id, claim.confidence, evidenceId, claim.evidenceText]
    );
    return;
  }

  if (claim.claimType === "material") {
    const id = await taxonomyId("materials", claim.taxonomySlug);
    if (!id) return;
    await query(
      `insert into company_materials (company_id, material_id, confidence, evidence_source_id, evidence_text, extracted_at)
       values ($1, $2, $3, $4, $5, now())
       on conflict (company_id, material_id) do update set
         confidence = greatest(company_materials.confidence, excluded.confidence),
         evidence_source_id = excluded.evidence_source_id,
         evidence_text = excluded.evidence_text,
         extracted_at = excluded.extracted_at`,
      [companyId, id, claim.confidence, evidenceId, claim.evidenceText]
    );
    return;
  }

  if (claim.claimType === "certification") {
    const id = await taxonomyId("certifications", claim.taxonomySlug);
    if (!id) return;
    await query(
      `insert into company_certifications (
         company_id, certification_id, status, source, evidence_source_id, evidence_text, confidence
       )
       values ($1, $2, 'claimed', $3, $4, $5, $6)
       on conflict (company_id, certification_id, source) do update set
         evidence_source_id = excluded.evidence_source_id,
         evidence_text = excluded.evidence_text,
         confidence = greatest(company_certifications.confidence, excluded.confidence)`,
      [companyId, id, sourceName, evidenceId, claim.evidenceText, claim.confidence]
    );
  }
}

export async function saveWebsiteClaims(companyId: string, sourceUrl: string, claims: ExtractedClaim[]) {
  const sourceName = "Company website";
  const saved: SavedClaim[] = [];

  for (const claim of claims) {
    const evidenceId = (await findExistingEvidence(companyId, claim, sourceUrl)) ?? (await insertEvidence(companyId, claim, sourceUrl, sourceName));
    await linkClaim(companyId, claim, evidenceId, sourceName);
    saved.push({ ...claim, evidenceId });
  }

  return saved;
}
