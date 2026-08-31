# DENUE Bulk Download vs API Report

## Decision

Use the official DENUE 05/2026 bulk dataset as the initial full manufacturer baseline. Use the DENUE API afterward for small validation pulls, spot checks, and future refresh logic.

This is a source strategy decision, not a business-model decision. The goal is to establish a complete, reproducible raw data asset before enrichment or niche selection.

## Official Sources Checked

- DENUE API documentation: `https://www.inegi.org.mx/servicios/api_denue.html`
- DENUE mass-download page: `https://www.inegi.org.mx/app/descarga/?ti=6`
- DENUE FAQ: `https://inegi.org.mx/APP/MAPA/DENUE/PreguntasF/PreguntasF.aspx`
- DENUE 05/2026 bulk metadata ficha: `https://www.inegi.org.mx/app/descarga/ficha.html?ag=17&f=csv&tit=3615697`
- INEGI terms: `https://www.inegi.org.mx/inegi/terminos.html`

## Bulk Dataset Findings

INEGI publishes a DENUE 05/2026 bulk-download record titled `Directorio Estadistico Nacional de Unidades Economicas (DENUE) 05_2026` with identifier `MEX-INEGI.EEC2.05-DENUE-2026`.

The metadata says the original bulk file was published on 2026-05-20. It was later corrected on 2026-05-29 for `Nombre de la unidad economica` and `Razon social` values in 12 records, and corrected again on 2026-07-01 for one `Razon social` omission. The currently available ficha says the available version replaces the originally published file and points users to a technical correction note inside the compressed file.

INEGI's mass-download page describes DENUE as available for local download. The FAQ says the full DENUE can be downloaded through `Descarga masiva`, which provides a ZIP containing `DescargaMasivaApp.exe`, `DescargaMasivaOD.xml`, and `Leeme.txt`.

The rendered mass-download page also exposes direct ZIP links. The direct 05/2026 CSV file for manufacturing sectors is:

`https://www.inegi.org.mx/contenidos/masiva/denue/denue_00_31-33_csv.zip`

## Local Bulk File Inspection

The downloaded file is present locally at:

`C:\Users\Stylo\OneDrive\My Docs\ChatGPT\Mexico Supplier Intelligence\data\denue_00_31-33_csv.zip`

File profile:

- ZIP size: 57,607,659 bytes.
- SHA-256: `5EC504D9C761778E94A8CDB4401B9F4F91EF478EE656086C7AC2973CA37890CD`.
- Main CSV inside ZIP: `conjunto_de_datos/denue_inegi_31-33_.csv`.
- Main CSV uncompressed size: 345,398,090 bytes.
- Dictionary: `diccionario_de_datos/denue_diccionario_de_datos.csv`.
- Metadata: `metadatos/metadatos_denue.txt`.
- Encoding: Windows-1252/Latin-1 style encoding, not UTF-8.
- Header row plus 656,617 data rows.

CSV headers:

`id`, `clee`, `nom_estab`, `raz_social`, `codigo_act`, `nombre_act`, `per_ocu`, `tipo_vial`, `nom_vial`, `tipo_v_e_1`, `nom_v_e_1`, `tipo_v_e_2`, `nom_v_e_2`, `tipo_v_e_3`, `nom_v_e_3`, `numero_ext`, `letra_ext`, `edificio`, `edificio_e`, `numero_int`, `letra_int`, `tipo_asent`, `nomb_asent`, `tipoCenCom`, `nom_CenCom`, `num_local`, `cod_postal`, `cve_ent`, `entidad`, `cve_mun`, `municipio`, `cve_loc`, `localidad`, `ageb`, `manzana`, `telefono`, `correoelec`, `www`, `tipoUniEco`, `latitud`, `longitud`, `fecha_alta`.

First-pass completeness:

- With phone: 271,020 / 656,617.
- With email: 72,998 / 656,617.
- With website: 25,038 / 656,617.

Sector distribution:

- `31`: 392,130 rows.
- `32`: 119,472 rows.
- `33`: 145,015 rows.

Top states by row count:

- Mexico: 75,916.
- Puebla: 60,624.
- Oaxaca: 58,159.
- Michoacan de Ocampo: 40,571.
- Jalisco: 37,706.
- Guanajuato: 34,867.
- Guerrero: 33,393.
- Veracruz de Ignacio de la Llave: 32,916.
- Ciudad de Mexico: 32,316.
- Yucatan: 29,020.

Employee-size bands:

- `0 a 5 personas`: 577,235.
- `6 a 10 personas`: 39,592.
- `11 a 30 personas`: 20,602.
- `31 a 50 personas`: 4,827.
- `51 a 100 personas`: 4,836.
- `101 a 250 personas`: 4,432.
- `251 y mas personas`: 5,093.

Commercial implication: the full manufacturing-sector baseline is dominated by micro establishments. For supplier intelligence, the first interrogation should segment by size band, geography, contact availability, and activity class before enrichment. A useful first commercial slice may be much narrower than "all Mexican manufacturers."

## API Findings

The DENUE API is token-gated and supports methods including `BuscarAreaActEstr`, which can filter by geography, activity codes, name, establishment ID, and employee-size stratum.

A tiny live dry run against Nuevo Leon, manufacturing sector `31`, records `1..3`, succeeded with the local token and returned 3 records. The live response uses uppercase classification field names such as `CLASE_ACTIVIDAD_ID` and `SECTOR_ACTIVIDAD_ID`, so normalization now accepts both fixture-style and live API casing.

## Comparison

| Dimension | Bulk 05/2026 | API |
| --- | --- | --- |
| Completeness | Best fit for a first full baseline because it is designed for whole-dataset local download. | Complete in theory, but full extraction requires many paginated calls across states, sectors, and ranges. |
| Rate limits | Best fit. Download once, ingest locally, retry local parsing without hitting INEGI repeatedly. | Token-gated. The docs do not clearly publish operational limits, so large pulls create avoidable throttling and failure risk. |
| Reproducibility | Strong. A named 05/2026 release can be archived with raw ZIP/CSV files, correction notes, retrieval timestamp, and checksums. | Weaker for baselining because API results reflect the current service unless every response is snapshotted. |
| Data freshness | Fixed point-in-time release: May 2026, with corrections through July 1, 2026. | Better for current checks and future refreshes. |
| Engineering practicality | Best first path if we can extract the CSV/DBF files from the official download flow and stream them into Postgres. | Already integrated for small pulls, but not ideal as the first full-load mechanism. |
| Auditability | Strong. File-level provenance and checksums are natural. | Requires request-level provenance for every page. |

## Recommended Initial Dataset Plan

1. Download the official DENUE 05/2026 bulk files.
2. Preserve the untouched ZIP/application output under `data/raw/denue/05_2026/`. This path is gitignored.
3. Store retrieval timestamp, source URL, source identifier, source version, file names, file sizes, and checksums.
4. Inspect the CSV/DBF headers before loading. Stop if the fields differ materially from the API or data dictionary.
5. Build a streaming local importer for downloaded CSV/DBF files.
6. Filter manufacturer candidates using sectors `31`, `32`, and `33`, while preserving all raw facts separately from normalized facts.
7. Generate a real data-quality report from the full local baseline.
8. Use the API only for validation samples and later freshness/update checks.

## Stop Conditions

- The official mass-download application cannot retrieve the 05/2026 files.
- The ZIP contents or correction note contradict the metadata ficha.
- CSV/DBF columns materially differ from the API/data dictionary.
- Terms, attribution, or redistribution requirements are unclear.
- File volume is too large for simple local processing on the current machine.

## Local Verification Completed

- `.env.local` is loaded by scripts.
- `.env.example` no longer contains a live token value.
- DENUE API route dry run succeeded for 3 records.
- Official 05/2026 manufacturing CSV ZIP was located and stream-profiled locally.
- A 100-row local bulk sample was generated at `data/samples/denue-manufacturing-bulk-sample-100.json` and validated through the analysis path.
- Tests pass.
- Typecheck passes.
