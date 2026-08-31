# Engineering Rules

This project builds a structured, evidence-backed intelligence layer on top of the Mexican manufacturing ecosystem.

## Product Discipline

- Build the data asset first; productize second.
- Do not assume the final business model.
- Do not build marketplace, CRM, billing, messaging, supplier onboarding, reviews, or other speculative features unless explicitly requested.
- Prefer implementation choices that improve data acquisition, understanding, search, verification, and future flexibility.

## Data Rules

- Never destroy raw source data.
- Preserve source name, source record ID, retrieval timestamp, source version/date, source URL where available, raw payload, and ingestion run ID.
- Never overwrite source facts with normalized or model-generated values.
- Distinguish authoritative source facts, extracted facts, AI classifications, heuristic inferences, user-submitted information, and physically verified information.
- Never present an LLM inference as an official company fact.

## Source Rules

- Prefer official and authoritative sources.
- Start with INEGI DENUE.
- Document access method, fields, usage restrictions, refresh cadence, and ingestion status before integrating a source.
- Respect terms of service, robots.txt, rate limits, and technical access controls.
- Do not scrape behind logins or collect unnecessary personal information.
- Flag unclear source rights for human review.

## Database Rules

- Keep canonical company records source-agnostic.
- Track source links in `company_sources`.
- Track arbitrary claims in `company_evidence`.
- Attach evidence and confidence to derived capabilities, industries, materials, certifications, and export signals.
- Prefer `possible_duplicate` over unsafe automated merges.

## Implementation Rules

- Use Next.js, TypeScript, Supabase/Postgres, and lightweight styling unless there is a clear reason to add more.
- Keep infrastructure simple enough for one developer and one founder.
- Build repeatable jobs with progress, completion/failure status, stats, and logs.
- Add tests for normalization, deduplication, classification mapping, confidence scoring, parser logic, database writes, ingestion, enrichment, and search as those areas are implemented.

## Stop Conditions

Stop and report if an official source is unavailable, licensing is unclear, API access differs from expectations, fields materially differ from documentation, enrichment cost is unexpectedly high, source quality is poor, deduplication is unsafe, or the database design needs reconsideration.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
