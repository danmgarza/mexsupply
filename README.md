# Mexico Supplier Intelligence

Mexico Supplier Intelligence is a data-platform exploration project for discovering and evaluating Mexican manufacturers and suppliers.

V1 is not a marketplace. It is a provenance-first data asset with a small search interface, an internal dashboard, and repeatable ingestion jobs.

## Stack

- Next.js, React, TypeScript
- Tailwind CSS
- Supabase/Postgres
- SQL migrations in `supabase/migrations`
- TypeScript jobs in `jobs`

## Local Setup

```bash
npm install
cp .env.example .env.local
npx supabase start
npx supabase db reset
npm run dev
```

Open `http://localhost:3000` for search and `http://localhost:3000/admin` for the exploration dashboard.
Use `http://localhost:3000/admin/data` for sample record inspection and data-quality metrics.

If you are using an existing Postgres database instead of the Supabase local stack, set `DATABASE_URL` and run:

```bash
npm run db:migrate
```

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL for browser/server clients.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key.
- `SUPABASE_SERVICE_ROLE_KEY`: Server-only key for privileged future jobs. Never expose this in the browser.
- `DATABASE_URL`: Direct Postgres connection string for scripts and jobs.
- `DENUE_API_TOKEN`: INEGI DENUE API token.
- `DENUE_API_BASE_URL`: Defaults to the official DENUE API base URL.
- `DENUE_SOURCE_VERSION`: Human-readable source version label stored with raw DENUE records.
- `LOG_LEVEL`: Pino log level.

## DENUE Ingestion

DENUE is the first official source. The job supports a fixture mode for local testing and a live mode using the API.

Fixture dry run:

```bash
npm run ingest:denue -- --fixture data/denue-sample.json --dry-run
```

Fixture database load:

```bash
npm run ingest:denue -- --fixture data/denue-sample.json
```

Live sample load:

```bash
npm run ingest:denue -- --state 19 --sector 31 --from 1 --to 100
```

Balanced reconnaissance sample across priority manufacturing states and sectors:

```bash
npm run ingest:denue -- --sample --limit 1000 --page-size 100
```

Custom sample:

```bash
npm run ingest:denue -- --sample --states 19,05,11 --sectors 31,32,33 --limit 300 --page-size 50
```

Analyze a DENUE-shaped fixture without writing to the database:

```bash
npm run analyze:denue -- --fixture data/denue-sample.json
```

Analyze the current local database quality metrics:

```bash
npm run analyze:db
```

Analyze repeated identity/contact patterns without merging records:

```bash
npm run analyze:duplicates
```

Plan the first public-web enrichment queue from qualified candidates:

```bash
npm run plan:enrichment
```

Manufacturing candidates are initially identified by DENUE economic sector codes `31`, `32`, and `33`, plus class codes beginning with those prefixes.
Live DENUE ingestion requires `DENUE_API_TOKEN`. Request URLs stored in raw records redact the token.

## Enrichment

Web enrichment is intentionally deferred until the DENUE raw ingestion pipeline is proven reliable. Future enrichment must store evidence in `company_evidence` and attach provenance and confidence to derived claims.

## Candidate Qualification

The default search view filters to qualified supplier candidates. A row qualifies when:

- `employee_size_band` is not `0 a 5 personas`
- at least one contact channel is present: website, normalized phone, or email

This is only a product/search lens. Raw DENUE records and canonical company rows are preserved.

## Tests

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Deployment

The preferred deployment path is a managed Next.js host plus Supabase managed Postgres. Apply migrations with the Supabase CLI:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Set environment variables in the deployment platform. Do not commit secrets.

## Architecture Decisions

- Raw source data is never overwritten by normalized data.
- DENUE records land in `raw_denue` before canonical company upserts.
- `companies` remains source-agnostic even though DENUE is the first source.
- Provenance is represented through `company_sources` and `company_evidence`.
- Public pages can read company and evidence data; write operations are handled by server jobs with direct database credentials.
- Search uses Postgres filters first. Dedicated search infrastructure can wait until quality or scale requires it.
