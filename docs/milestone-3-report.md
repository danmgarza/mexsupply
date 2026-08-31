# Milestone 3 Report

## Implementation Summary

- Added DENUE sample planning across priority manufacturing states and sectors.
- Added configurable ingestion options: `--sample`, `--states`, `--sectors`, `--limit`, and `--page-size`.
- Corrected the DENUE `BuscarAreaActEstr` URL parameter order to match INEGI's current API documentation.
- Added redacted source URL and source version recording for raw DENUE rows.
- Added normalized phone, email, and website domain handling.
- Added data-quality analysis helpers for completeness, geography, classification, employee size, and duplicate patterns.
- Added duplicate candidate helper using normalized name, phone, website domain, and address signals.
- Added `/admin/data` for internal sample-data inspection.
- Extended search filters for city, class code, website availability, employee size support in query helpers, and manufacturing-only filtering.
- Fixed admin dashboard ingestion-run metric fields.

## Live Data

Live DENUE ingestion was validated locally after Podman/Supabase became available.

Validation runs:

- A tiny live DENUE pull for Nuevo Leon, sector `31`, records `1..3`, completed with 3 discovered, 3 inserted, and 0 failed.
- A 1,000-record balanced reconnaissance sample across the default state/sector plan completed with 1,000 discovered, 997 inserted, 3 updated, and 0 failed.
- After a parser fix for commas inside parenthesized DENUE locality names, the same 1,000-record sample was rerun and completed with 1,000 discovered, 0 inserted, 1,000 updated, and 0 failed.

## Sample Composition

The configured default sample plan covers Nuevo Leon, Coahuila, Tamaulipas, Chihuahua, Baja California, Guanajuato, Queretaro, Jalisco, San Luis Potosi, and Estado de Mexico.

The default manufacturing sectors are `31`, `32`, and `33`.

## Database Data-Quality Metrics

The local database now contains 1,100 raw DENUE records and 1,100 canonical company rows:

- Manufacturing candidates: 1,100
- Qualified supplier candidates: 410
- With websites: 234 (21.3%)
- With emails: 468 (42.5%)
- With phones: 496 (45.1%)
- With coordinates: 1,100 (100.0%)

The 1,100 rows include the 100-row local bulk fixture plus the 1,000-record live reconnaissance sample. The bulk fixture covers Aguascalientes only, so aggregate counts should not be treated as a statistically representative market read.

The current qualified-candidate rule excludes rows with employee size `0 a 5 personas` and rows with no website, normalized phone, or email. This is a search/product filter only; raw and canonical source data remains preserved.

State coverage after live reconnaissance:

- Baja California: 102
- Chihuahua: 102
- Coahuila de Zaragoza: 102
- Guanajuato: 102
- Jalisco: 102
- Nuevo Leon: 102
- Queretaro: 102
- San Luis Potosi: 102
- Tamaulipas: 102
- Aguascalientes: 100
- Estado de Mexico: 82

## Manufacturer-Classification Assessment

The current `31/32/33` approach remains a candidate filter. It now validates against both bulk-shaped fixture data and live DENUE API records. All 1,100 locally loaded rows are manufacturing candidates because the test inputs intentionally target manufacturing sectors only.

Top live/database classifications in the current local sample:

- `312112` - Purificacion y embotellado de agua: 174
- `323119` - Impresion de formas continuas y otros impresos: 77
- `311830` - Elaboracion de tortillas de maiz y molienda de nixtamal: 35
- `332710` - Maquinado de piezas metalicas para maquinaria y equipo en general: 35
- `332320` - Fabricacion de productos de herreria: 34

## Deduplication Findings

Live duplicate analysis is now available at the pattern level. The helper flags suspicious duplicate patterns without merging records.

Top duplicate patterns in the current local database include repeated normalized names and website domains:

- `AGUA INMACULADA` appears 20 times by normalized name.
- `BIMBO` appears 16 times by normalized name.
- `bimbo.com.mx` appears 11 times by website domain.
- `BARCEL` appears 8 times by normalized name.
- `AAM MAQUILADORA MEXICO` appears 5 times by normalized name.
- `4M COMERCIALIZADORA` appears 5 times by normalized name.
- `barcel.com.mx`, `aguainmaculada.com`, `grupoalen.com`, and `aam.com` also recur by website domain.

These are only possible duplicate signals. Many may represent separate branches, establishments, franchises, or plants, so no automated merges should happen yet.

## Search Validation

Search and `/admin/data` now run against local Postgres with loaded DENUE data.

Supported filters now include keyword, state, city, DENUE class code prefix, website availability, manufacturing-candidate only, and qualified-candidate only. Public search defaults to qualified candidates. Admin data inspection defaults to all records and allows switching into qualified-only view.

## Important Discoveries

- The original dashboard queried a non-existent `records_succeeded` column; it now uses inserted/updated/failed counts.
- The first DENUE URL builder did not match the documented `BuscarAreaActEstr` parameter order; it has been corrected before live ingestion.
- Local Supabase can run successfully on Podman after initializing and starting a Podman machine.
- Supabase CLI applied the migrations during `npx.cmd supabase start`; the custom `npm.cmd run db:migrate` path should not be run afterward against the same fresh database because the initial migration is not idempotent.
- One live DENUE `Ubicacion` value contained a comma inside parentheses, which broke naive comma-splitting. The parser now splits only on commas outside parentheses.

## Phase 3 Checkpoint

Phase 3 operational hardening now has a committed duplicate-review checkpoint. The next milestone can move into a small Phase 4 website-enrichment pilot:

- Use `npm.cmd run analyze:duplicates` and `/admin/duplicates` for duplicate-cluster review.
- Treat Bimbo, Barcel, AAM, Alen, and similar repeated brands as branch/network patterns unless stronger same-location duplicate evidence appears.
- Down-rank generic or unqualified clusters such as Abarrotes, Acerradero, Alfareria, and Acua Pura for enrichment.
- Keep micro-establishments and no-contact rows in source/canonical data, but exclude them from default supplier search and Phase 4 website enrichment.
- Require websites for the first Phase 4 enrichment lane. Phone/email-only qualified rows should wait for a later contact-research lane.
- Use `npm.cmd run analyze:db` to regenerate database-quality metrics after future ingestion runs.
