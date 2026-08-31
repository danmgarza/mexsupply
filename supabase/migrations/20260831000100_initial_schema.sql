create extension if not exists pgcrypto;

create table public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  status text not null check (status in ('running', 'completed', 'failed')),
  parameters jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  records_discovered integer not null default 0,
  records_inserted integer not null default 0,
  records_updated integer not null default 0,
  records_skipped integer not null default 0,
  records_failed integer not null default 0,
  error_message text
);

create table public.enrichment_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  status text not null check (status in ('running', 'completed', 'failed')),
  parameters jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  records_discovered integer not null default 0,
  records_inserted integer not null default 0,
  records_updated integer not null default 0,
  records_skipped integer not null default 0,
  records_failed integer not null default 0,
  error_message text
);

create table public.raw_denue (
  id uuid primary key default gen_random_uuid(),
  source_record_id text not null unique,
  ingestion_run_id uuid not null references public.ingestion_runs(id),
  retrieved_at timestamptz not null,
  source_version text,
  source_url text,
  raw_payload jsonb not null
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  legal_name text,
  trade_name text,
  normalized_name text,
  company_type text,
  denue_id text unique,
  website text,
  phone text,
  email text,
  street text,
  city text,
  municipality text,
  state text,
  postal_code text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  employee_size_band text,
  industry_code text,
  industry_label text,
  establishment_status text,
  is_manufacturing_candidate boolean not null default false,
  needs_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_sources (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  source text not null,
  source_record_id text not null,
  source_url text,
  source_version text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  raw_record_reference uuid references public.raw_denue(id),
  unique (company_id, source, source_record_id)
);

create table public.company_locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  label text,
  street text,
  city text,
  municipality text,
  state text,
  postal_code text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  source_id uuid references public.company_sources(id),
  created_at timestamptz not null default now()
);

create table public.capabilities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  parent_id uuid references public.capabilities(id),
  created_at timestamptz not null default now()
);

create table public.industries (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.company_evidence (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  claim_type text not null,
  claim_value text not null,
  source text not null,
  source_url text,
  source_record_id text,
  evidence_text text,
  captured_at timestamptz not null default now(),
  extracted_at timestamptz,
  extraction_method text not null,
  confidence numeric(4, 3) check (confidence >= 0 and confidence <= 1)
);

create table public.company_capabilities (
  company_id uuid not null references public.companies(id) on delete cascade,
  capability_id uuid not null references public.capabilities(id),
  confidence numeric(4, 3) check (confidence >= 0 and confidence <= 1),
  evidence_source_id uuid references public.company_evidence(id),
  evidence_text text,
  extracted_at timestamptz,
  status text not null default 'observed',
  primary key (company_id, capability_id)
);

create table public.company_industries (
  company_id uuid not null references public.companies(id) on delete cascade,
  industry_id uuid not null references public.industries(id),
  confidence numeric(4, 3) check (confidence >= 0 and confidence <= 1),
  evidence_source_id uuid references public.company_evidence(id),
  evidence_text text,
  extracted_at timestamptz,
  status text not null default 'observed',
  primary key (company_id, industry_id)
);

create table public.company_materials (
  company_id uuid not null references public.companies(id) on delete cascade,
  material_id uuid not null references public.materials(id),
  confidence numeric(4, 3) check (confidence >= 0 and confidence <= 1),
  evidence_source_id uuid references public.company_evidence(id),
  evidence_text text,
  extracted_at timestamptz,
  status text not null default 'observed',
  primary key (company_id, material_id)
);

create table public.company_certifications (
  company_id uuid not null references public.companies(id) on delete cascade,
  certification_id uuid not null references public.certifications(id),
  status text not null default 'claimed',
  source text not null,
  evidence_source_id uuid references public.company_evidence(id),
  evidence_text text,
  confidence numeric(4, 3) check (confidence >= 0 and confidence <= 1),
  expiration_date date,
  primary key (company_id, certification_id, source)
);

create table public.duplicate_candidates (
  id uuid primary key default gen_random_uuid(),
  company_id_a uuid not null references public.companies(id) on delete cascade,
  company_id_b uuid not null references public.companies(id) on delete cascade,
  score numeric(4, 3) check (score >= 0 and score <= 1),
  signals jsonb not null default '{}'::jsonb,
  status text not null default 'possible_duplicate',
  created_at timestamptz not null default now(),
  unique (company_id_a, company_id_b)
);

create index companies_normalized_name_idx on public.companies (normalized_name);
create index companies_state_city_idx on public.companies (state, city);
create index companies_industry_code_idx on public.companies (industry_code);
create index companies_website_idx on public.companies (website);
create index companies_manufacturing_idx on public.companies (is_manufacturing_candidate);
create index company_sources_source_record_idx on public.company_sources (source, source_record_id);
create index raw_denue_ingestion_run_idx on public.raw_denue (ingestion_run_id);
create index company_evidence_company_claim_idx on public.company_evidence (company_id, claim_type);

alter table public.ingestion_runs enable row level security;
alter table public.enrichment_runs enable row level security;
alter table public.raw_denue enable row level security;
alter table public.companies enable row level security;
alter table public.company_sources enable row level security;
alter table public.company_locations enable row level security;
alter table public.capabilities enable row level security;
alter table public.industries enable row level security;
alter table public.materials enable row level security;
alter table public.certifications enable row level security;
alter table public.company_evidence enable row level security;
alter table public.company_capabilities enable row level security;
alter table public.company_industries enable row level security;
alter table public.company_materials enable row level security;
alter table public.company_certifications enable row level security;
alter table public.duplicate_candidates enable row level security;

create policy "public read companies" on public.companies
  for select to anon, authenticated
  using (true);

create policy "public read company sources" on public.company_sources
  for select to anon, authenticated
  using (true);

create policy "public read taxonomy" on public.capabilities
  for select to anon, authenticated
  using (true);

create policy "public read industries" on public.industries
  for select to anon, authenticated
  using (true);

create policy "public read materials" on public.materials
  for select to anon, authenticated
  using (true);

create policy "public read certifications" on public.certifications
  for select to anon, authenticated
  using (true);

create policy "public read evidence" on public.company_evidence
  for select to anon, authenticated
  using (true);
