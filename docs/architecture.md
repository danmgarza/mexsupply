# Architecture

## Overview

Mexico Supplier Intelligence is organized as a small Next.js application plus repeatable data jobs backed by Supabase/Postgres.

The V1 data flow is:

1. Fetch a source record from an official/public source.
2. Store the unchanged raw payload.
3. Normalize into source-agnostic company fields.
4. Link canonical records back to source records.
5. Expose search, detail, and dashboard views over the canonical and provenance tables.

## Application

- `app/page.tsx`: public supplier search.
- `app/companies/[id]/page.tsx`: company profile with source links.
- `app/admin/page.tsx`: internal data exploration dashboard.
- `app/admin/data/page.tsx`: internal sample-data inspection and data-quality view.
- `lib/db`: direct Postgres query helpers for server-side rendering and jobs.

## Jobs

- `jobs/ingest-denue.ts`: repeatable DENUE ingestion job.
- `scripts/analyze-denue-fixture.ts`: fixture-level data-quality reconnaissance without database writes.
- `scripts/analyze-database-quality.ts`: database-backed quality report over loaded canonical/source rows.
- `scripts/analyze-duplicate-clusters.ts`: duplicate-pattern review without merging records.
- `scripts/plan-enrichment-candidates.ts`: Phase 4 candidate queue planner for public-web enrichment.
- `scripts/run-migrations.ts`: direct Postgres migration fallback when Supabase CLI is not available.

Each ingestion creates an `ingestion_runs` row and records discovered, inserted, updated, skipped, and failed counts.
Sample mode balances API requests across priority manufacturing states and sectors while keeping the record count configurable.

## Database

The schema separates:

- Raw records: `raw_denue`.
- Canonical identity: `companies`.
- Provenance links: `company_sources`.
- Evidence and claims: `company_evidence`.
- Taxonomy: `capabilities`, `industries`, `materials`, `certifications`.
- Derived relationships with confidence: `company_capabilities`, `company_industries`, `company_materials`, `company_certifications`.

## Security

RLS is enabled on public tables. Public read policies currently expose company, source, taxonomy, and evidence records. Raw records and job run internals remain unavailable through the public Data API unless future policies are added.

Ingestion jobs use direct database credentials and should run in trusted server or local environments only.

## Deployment

Use a managed Next.js platform for the app and Supabase for Postgres/Auth. Push schema changes through Supabase migrations.
