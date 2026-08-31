# Milestone 1 and 2 Report

## Completed

- Repository structure created.
- Next.js/TypeScript app scaffolded.
- Basic public search page created.
- Company detail page created.
- Internal admin dashboard created.
- Supabase migration and seed files created.
- Direct Postgres migration fallback script created.
- DENUE ingestion job created with fixture and live API modes.
- Raw DENUE preservation and canonical company normalization implemented.
- Provenance links from companies to raw source records implemented.
- README, AGENTS, architecture, data source, and data model docs created.

## Data

- No live DENUE data has been ingested yet because a DENUE API token and running database are required.
- A representative fixture exists at `data/denue-sample.json` with two manufacturing-shaped records for local pipeline testing.

## Tests

- Unit tests cover DENUE normalization and manufacturing candidate detection.
- Full database integration requires a running Supabase/Postgres instance.

## Known Issues

- Admin authentication is not fully implemented. RLS is enabled, and write paths are server-side jobs, but the `/admin` route is not yet protected by Supabase Auth.
- Live DENUE access is unverified until `DENUE_API_TOKEN` is supplied.
- The initial manufacturing classifier uses sector/class prefixes only. Capability extraction is intentionally deferred.
- No full ingestion scale or rate-limit testing has been done yet.

## Decisions

- DENUE is the first official source.
- Sector codes `31`, `32`, and `33` are the initial manufacturing candidate signal.
- Raw source records and canonical company records are separated.
- Ingestion run statistics are first-class records.
- Web enrichment is deferred until raw ingestion is proven reliable.

## Next Recommended Milestone

Milestone 3 should focus on normalization hardening, deduplication candidates, and manufacturer identification quality checks after live DENUE samples are loaded.
