# Data Model

## Raw Layer

`raw_denue` stores the original DENUE payload, keyed by source record ID and linked to an ingestion run. Raw records are never treated as mutable canonical facts.

## Canonical Company Layer

`companies` is the source-agnostic identity table. DENUE is represented through `denue_id`, but the table is designed to accept future sources.

Important fields include:

- `legal_name`, `trade_name`, `normalized_name`
- `website`, `phone`, `email`
- `street`, `city`, `municipality`, `state`, `postal_code`
- `latitude`, `longitude`
- `employee_size_band`
- `industry_code`, `industry_label`
- `is_manufacturing_candidate`

## Provenance

`company_sources` links a canonical company to a source record and raw payload.

`company_evidence` stores arbitrary claims with:

- claim type and value
- source and source URL
- source record ID
- evidence text
- captured/extracted timestamps
- extraction method
- confidence

Derived joins such as `company_capabilities` and `company_certifications` reference evidence rows.

## Taxonomy

Taxonomy tables are intentionally extensible:

- `capabilities`
- `industries`
- `materials`
- `certifications`

These are procurement-oriented concepts, not direct mirrors of government classification systems.

## Deduplication

`duplicate_candidates` stores possible duplicates with score, signals, and status. Automated merging is intentionally not implemented in Milestone 2.

Phase 3 duplicate review treats repeated DENUE establishment names as evidence patterns, not merge instructions. Branch or network patterns should preserve separate establishments. Generic or unqualified clusters should be down-ranked for enrichment. Only strong same-location/contact clusters should advance to manual duplicate review.
