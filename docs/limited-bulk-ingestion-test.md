# Limited Bulk Ingestion Test

## Status

Limited local ingestion has been run successfully against local Supabase/Postgres.

## Scope

- Source ZIP: `data/denue_00_31-33_csv.zip`
- Source file inside ZIP: `conjunto_de_datos/denue_inegi_31-33_.csv`
- Generated sample fixture: `data/samples/denue-manufacturing-bulk-sample-100.json`
- Sample size: 100 rows
- External API calls: none
- Database writes: completed

## Parser Validation

The 100-row bulk sample was analyzed through the existing DENUE analysis path.

Results:

- Total records: 100
- Manufacturing candidates: 100
- With website: 8
- With email: 33
- With phone: 52
- With coordinates: 100
- State coverage in this first sample: Aguascalientes only

Top classes in the 100-row sample:

- `312112`: 60
- `315223`: 6
- `311812`: 5
- `311110`: 3
- `315229`: 3

Employee-size distribution in the 100-row sample:

- `0 a 5 personas`: 74
- `6 a 10 personas`: 7
- `11 a 30 personas`: 10
- `31 a 50 personas`: 3
- `51 a 100 personas`: 2
- `101 a 250 personas`: 1
- `251 y mas personas`: 3

## Code Changes Supporting This Test

- DENUE normalization now accepts bulk CSV field names such as `id`, `nom_estab`, `raz_social`, `codigo_act`, `nombre_act`, `per_ocu`, `entidad`, `municipio`, `localidad`, `telefono`, `correoelec`, and `www`.
- Manufacturing classification can now infer sector from the first two digits of `codigo_act` when explicit sector fields are absent.
- Tests cover bulk CSV-shaped records.

## Validation Commands Run

```bash
npm.cmd run analyze:denue -- --fixture data\samples\denue-manufacturing-bulk-sample-100.json
npm.cmd run ingest:denue -- --fixture data\samples\denue-manufacturing-bulk-sample-100.json
npm.cmd test
npm.cmd run typecheck
```

All passed.

## Database Result

The 100-row fixture ingestion completed with:

- Records discovered: 100
- Records inserted: 100
- Records updated: 0
- Records skipped: 0
- Records failed: 0

Local Supabase is reachable through:

- Studio: `http://127.0.0.1:54323`
- Database URL: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

## Next Safe Step

Use the 100-row fixture as a parser/database smoke test before live DENUE runs. The follow-on live Phase 3 reconnaissance sample has also been completed separately.
