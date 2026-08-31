# Phase 4 Enrichment Plan

## Starting Point

Phase 4 should begin with public-web enrichment, but only after candidate selection is explicit and repeatable.

Run the first enrichment queue planner with:

```bash
npm.cmd run plan:website-enrichment
```

Current local results:

- Total qualified supplier candidates: 410
- Website-qualified supplier candidates: 186
- Industrial website-enrichment pool: 113
- First queue returned by script: 50

The active Phase 4 website-enrichment queue is stricter and requires a website.

## Candidate Rules

Qualified candidates must:

- not be `0 a 5 personas`
- have at least one contact channel: website, normalized phone, or email

Website-enrichment candidates must also:

- have a website

The first Phase 4 website-enrichment pool further prioritizes industrial/procurement-relevant manufacturing classes:

- chemicals and materials
- plastics and rubber
- primary and fabricated metals
- machinery
- electrical/electronic equipment
- transportation, automotive, and aerospace
- furniture and related manufactured goods

This intentionally keeps consumer food chains, water franchises, micro/local storefront patterns, and phone/email-only records out of the first enrichment pass even when they are technically manufacturing-coded in DENUE. Contactable companies without websites can become a later contact-research lane.

## Enrichment Principles

Every enriched fact must be stored as evidence, not overwritten into source facts.

For each captured claim, store:

- source URL
- source name
- capture timestamp
- evidence text or structured excerpt
- extraction method
- confidence

Do not present an enrichment inference as an official company fact. Use confidence and evidence references.

## First Enrichment Targets

The current top queue favors larger industrial manufacturers with websites and procurement-relevant activity codes. Examples from the current local planner include:

- A Schulman de Mexico
- ABB Mexico
- Accudyn
- Acerlan Matrix Metals
- Aceway de Mexico
- ACPS Automotive
- AAM Maquiladora Mexico plants
- Adient Industries Mexico
- Aernnova Aerospace Mexico
- Albea Packaging Mexico

Before crawling at scale, enrich a tiny pilot batch of 5-10 company websites and verify:

- website URL validity
- robots/terms posture where practical
- extraction fields
- evidence storage format
- timeout/retry behavior
- whether contact fields from DENUE are stale or inconsistent

Run the pilot in three steps:

```bash
npm.cmd run enrich:website-pilot -- --limit 5 --select-only
npm.cmd run enrich:website-pilot -- --limit 5
npm.cmd run enrich:website-pilot -- --limit 5 --write
```

The pilot is deterministic and keyword-based. It starts with bilingual English/Spanish patterns for capabilities, materials, industries served, and certifications. It does not use LLM extraction, and the default mode does not write to the database.

Written pilot evidence is reviewable at `/admin/enrichment`.

The first one-company write pilot is summarized in `docs/phase-4-pilot-report.md`.

## Stop Conditions

Stop before scaled enrichment if:

- website access is blocked or terms are unclear
- extraction produces unsupported claims
- company websites are mostly irrelevant holding/company pages
- contact details appear personal rather than business-facing
- enrichment cost or runtime is higher than expected
- the data model needs new evidence fields before continuing
