import { query } from "@/lib/db/pool";

export type CompanySearchRow = {
  id: string;
  legal_name: string | null;
  trade_name: string | null;
  city: string | null;
  state: string | null;
  industry_label: string | null;
  industry_code?: string | null;
  employee_size_band?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  is_manufacturing_candidate?: boolean;
};

export async function searchCompanies({
  q,
  state,
  city,
  industryCode,
  employeeSize,
  website,
  manufacturingOnly,
  qualifiedOnly,
  limit
}: {
  q?: string;
  state?: string;
  city?: string;
  industryCode?: string;
  employeeSize?: string;
  website?: "with" | "without";
  manufacturingOnly?: boolean;
  qualifiedOnly?: boolean;
  limit: number;
}): Promise<CompanySearchRow[]> {
  try {
    const clauses: string[] = [];
    const params: unknown[] = [];

    if (q) {
      params.push(`%${q}%`);
      clauses.push(
        `(trade_name ilike $${params.length} or legal_name ilike $${params.length} or industry_label ilike $${params.length} or city ilike $${params.length})`
      );
    }

    if (state) {
      params.push(state);
      clauses.push(`state ilike $${params.length}`);
    }

    if (city) {
      params.push(city);
      clauses.push(`city ilike $${params.length}`);
    }

    if (industryCode) {
      params.push(`${industryCode}%`);
      clauses.push(`industry_code like $${params.length}`);
    }

    if (employeeSize) {
      params.push(employeeSize);
      clauses.push(`employee_size_band = $${params.length}`);
    }

    if (website === "with") {
      clauses.push(`nullif(website, '') is not null`);
    }

    if (website === "without") {
      clauses.push(`nullif(website, '') is null`);
    }

    if (manufacturingOnly) {
      clauses.push(`is_manufacturing_candidate`);
    }

    if (qualifiedOnly) {
      clauses.push(`employee_size_band is distinct from '0 a 5 personas'`);
      clauses.push(`(nullif(website, '') is not null or nullif(normalized_phone, '') is not null or nullif(email, '') is not null)`);
    }

    params.push(limit);
    const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
    const result = await query<CompanySearchRow>(
      `select id, legal_name, trade_name, city, state, industry_code, industry_label,
              employee_size_band, website, phone, email, is_manufacturing_candidate
       from companies
       ${where}
       order by trade_name nulls last, legal_name nulls last
       limit $${params.length}`,
      params
    );
    return result.rows;
  } catch {
    return [];
  }
}

export type CompanyProfile = CompanySearchRow & {
  municipality: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  employee_size_band: string | null;
  sources: Array<{
    source: string;
    source_record_id: string;
    source_url: string | null;
  }>;
};

export async function getCompanyProfile(id: string): Promise<CompanyProfile | null> {
  try {
    const company = await query<Omit<CompanyProfile, "sources">>(
      `select id, legal_name, trade_name, city, municipality, state, industry_label,
              website, phone, email, employee_size_band
       from companies
       where id = $1`,
      [id]
    );

    if (company.rowCount === 0) {
      return null;
    }

    const sources = await query<CompanyProfile["sources"][number]>(
      `select source, source_record_id, source_url
       from company_sources
       where company_id = $1
       order by source`,
      [id]
    );

    return {
      ...company.rows[0],
      sources: sources.rows
    };
  } catch {
    return null;
  }
}

export async function getAdminMetrics() {
  try {
    const [cardsResult, stateResult, runResult] = await Promise.all([
      query<{ label: string; value: string }>(
        `select 'Total companies' as label, count(*)::text as value from companies
         union all
         select 'Manufacturing candidates', count(*)::text from companies where is_manufacturing_candidate
         union all
         select 'Qualified candidates', count(*)::text from companies
          where employee_size_band is distinct from '0 a 5 personas'
            and (nullif(website, '') is not null or nullif(normalized_phone, '') is not null or nullif(email, '') is not null)
         union all
         select 'With websites', count(*)::text from companies where nullif(website, '') is not null
         union all
         select 'With phone', count(*)::text from companies where nullif(phone, '') is not null
         union all
         select 'With email', count(*)::text from companies where nullif(email, '') is not null`
      ),
      query<{ state: string | null; count: string }>(
        `select state, count(*)::text
         from companies
         group by state
         order by count(*) desc
         limit 10`
      ),
      query<{
        id: string;
        source: string;
        status: string;
        records_inserted: number;
        records_updated: number;
        records_failed: number;
      }>(
        `select id, source, status, records_inserted, records_updated, records_failed
         from ingestion_runs
         order by started_at desc
         limit 8`
      )
    ]);

    return {
      cards: cardsResult.rows,
      byState: stateResult.rows,
      latestRuns: runResult.rows
    };
  } catch {
    return {
      cards: [
        { label: "Total companies", value: "0" },
        { label: "Manufacturing candidates", value: "0" },
        { label: "With websites", value: "0" }
      ],
      byState: [],
      latestRuns: []
    };
  }
}

export type DataCompletenessRow = {
  field: string;
  populated: number;
  missing: number;
  percent_populated: string;
};

export async function getDataQualityReport() {
  try {
    const [
      overall,
      byState,
      manufacturingByState,
      topCities,
      byClassification,
      manufacturingByClassification,
      byEmployeeSize,
      completeness,
      duplicates
    ] = await Promise.all([
      query<{ metric: string; value: string }>(
        `select 'Total records ingested' as metric, count(*)::text as value from raw_denue
         union all select 'Canonical companies', count(*)::text from companies
         union all select 'Manufacturing candidates', count(*)::text from companies where is_manufacturing_candidate
         union all select 'Qualified candidates', count(*)::text from companies
          where employee_size_band is distinct from '0 a 5 personas'
            and (nullif(website, '') is not null or nullif(normalized_phone, '') is not null or nullif(email, '') is not null)
         union all select 'With websites', count(*)::text from companies where nullif(website, '') is not null
         union all select 'With email', count(*)::text from companies where nullif(email, '') is not null
         union all select 'With phone', count(*)::text from companies where nullif(normalized_phone, '') is not null
         union all select 'With coordinates', count(*)::text from companies where latitude is not null and longitude is not null`
      ),
      query<{ label: string; count: string }>(
        `select coalesce(state, 'Unknown') as label, count(*)::text
         from companies group by state order by count(*) desc limit 20`
      ),
      query<{ label: string; count: string }>(
        `select coalesce(state, 'Unknown') as label, count(*)::text
         from companies where is_manufacturing_candidate group by state order by count(*) desc limit 20`
      ),
      query<{ label: string; count: string }>(
        `select coalesce(city || ', ' || state, 'Unknown') as label, count(*)::text
         from companies group by city, state order by count(*) desc limit 20`
      ),
      query<{ label: string; count: string }>(
        `select coalesce(industry_code || ' - ' || industry_label, industry_label, industry_code, 'Unknown') as label, count(*)::text
         from companies group by industry_code, industry_label order by count(*) desc limit 25`
      ),
      query<{ label: string; count: string }>(
        `select coalesce(industry_code || ' - ' || industry_label, industry_label, industry_code, 'Unknown') as label, count(*)::text
         from companies where is_manufacturing_candidate group by industry_code, industry_label order by count(*) desc limit 25`
      ),
      query<{ label: string; count: string }>(
        `select coalesce(employee_size_band, 'Unknown') as label, count(*)::text
         from companies group by employee_size_band order by count(*) desc`
      ),
      query<DataCompletenessRow>(
        `with fields as (
          select 'name' as field, count(*) filter (where nullif(coalesce(trade_name, legal_name), '') is not null) as populated, count(*) as total from companies
          union all select 'address', count(*) filter (where nullif(street, '') is not null), count(*) from companies
          union all select 'phone', count(*) filter (where nullif(normalized_phone, '') is not null), count(*) from companies
          union all select 'email', count(*) filter (where nullif(email, '') is not null), count(*) from companies
          union all select 'website', count(*) filter (where nullif(website, '') is not null), count(*) from companies
          union all select 'employee_size', count(*) filter (where nullif(employee_size_band, '') is not null), count(*) from companies
          union all select 'classification', count(*) filter (where nullif(industry_code, '') is not null or nullif(industry_label, '') is not null), count(*) from companies
          union all select 'coordinates', count(*) filter (where latitude is not null and longitude is not null), count(*) from companies
        )
        select field,
               populated::int,
               (total - populated)::int as missing,
               case when total = 0 then '0.0' else round((populated::numeric / total::numeric) * 100, 1)::text end as percent_populated
        from fields`
      ),
      query<{ pattern: string; value: string; count: string }>(
        `select pattern, value, duplicate_count::text as count
         from (
           select 'normalized_name' as pattern, normalized_name as value, count(*)::int as duplicate_count
         from companies where normalized_name is not null group by normalized_name having count(*) > 1
         union all
           select 'normalized_phone', normalized_phone, count(*)::int
         from companies where normalized_phone is not null group by normalized_phone having count(*) > 1
         union all
           select 'website_domain', website_domain, count(*)::int
         from companies where website_domain is not null group by website_domain having count(*) > 1
         ) duplicate_patterns
         order by duplicate_count desc, pattern, value
         limit 25`
      )
    ]);

    return {
      overall: overall.rows,
      byState: byState.rows,
      manufacturingByState: manufacturingByState.rows,
      topCities: topCities.rows,
      byClassification: byClassification.rows,
      manufacturingByClassification: manufacturingByClassification.rows,
      byEmployeeSize: byEmployeeSize.rows,
      completeness: completeness.rows,
      duplicates: duplicates.rows
    };
  } catch {
    return {
      overall: [],
      byState: [],
      manufacturingByState: [],
      topCities: [],
      byClassification: [],
      manufacturingByClassification: [],
      byEmployeeSize: [],
      completeness: [],
      duplicates: []
    };
  }
}
