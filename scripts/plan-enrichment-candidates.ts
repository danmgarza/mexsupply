import { rankWebsiteEnrichmentCandidates, type EnrichmentCandidateInput } from "@/lib/analysis/enrichment-priority";
import { qualifiedSupplierSql } from "@/lib/analysis/qualification";
import { query } from "@/lib/db/pool";

const qualifiedSql = qualifiedSupplierSql("");

const totalQualified = await query<{ count: string }>(`select count(*)::text as count from companies where ${qualifiedSql}`);

const result = await query<EnrichmentCandidateInput>(
  `select id, trade_name, legal_name, normalized_name, employee_size_band, industry_code,
          industry_label, website, phone, normalized_phone, email, city, state
   from companies
   where ${qualifiedSql}
     and nullif(website, '') is not null
   order by trade_name nulls last, legal_name nulls last`
);

const ranked = rankWebsiteEnrichmentCandidates(result.rows);

const candidates = ranked.slice(0, 50).map((candidate) => ({
  name: candidate.trade_name || candidate.legal_name,
  state: candidate.state,
  city: candidate.city,
  employeeSize: candidate.employee_size_band,
  industry: [candidate.industry_code, candidate.industry_label].filter(Boolean).join(" - "),
  website: candidate.website,
  email: candidate.email,
  phone: candidate.phone,
  score: candidate.score,
  reasons: candidate.reasons
}));

console.log(
  JSON.stringify(
    {
      totalQualified: Number(totalQualified.rows[0]?.count ?? 0),
      websiteQualified: result.rowCount,
      websiteEnrichmentPool: ranked.length,
      returned: candidates.length,
      candidates
    },
    null,
    2
  )
);
