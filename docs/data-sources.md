# Data Sources

## INEGI DENUE

- Source: Instituto Nacional de Estadistica y Geografia, Directorio Estadistico Nacional de Unidades Economicas.
- URL: `https://www.inegi.org.mx/servicios/api_denue.html`
- API base: `https://www.inegi.org.mx/app/api/denue/v1/consulta`
- Bulk download: `https://www.inegi.org.mx/app/descarga/?ti=6`
- Purpose: Official Mexican establishment directory with identity, activity, location, size, and contact fields.
- Access method: Official bulk download for point-in-time baselines; token-gated HTTP API for validation, small samples, and future refreshes.
- V1 status: API smoke test succeeded for a 3-record live pull. Initial full-load strategy should pivot to the official DENUE 05/2026 bulk dataset before large API ingestion.
- Refresh cadence: Use the 05/2026 bulk release as the initial baseline, then evaluate API-based refreshes after the baseline is profiled.

## Available DENUE Fields Used In V1

- CLEE
- Establishment ID
- Establishment name
- Legal name
- Economic activity class
- Employee size stratum
- Street type, street, exterior/interior number, neighborhood, postal code
- Locality, municipality, state
- Phone
- Email
- Website
- Establishment type
- Longitude and latitude
- Economic activity class, sector, subsector, branch, and subbranch IDs where returned by `BuscarAreaActEstr`

## Manufacturing Identification

DENUE uses economic activity classification fields. Initial manufacturing candidate selection uses sectors `31`, `32`, and `33`, which correspond to manufacturing activity in the North American/Mexican classification structure.

This is only a candidate filter. Product capabilities such as CNC machining, injection molding, and stamping are a separate procurement-oriented taxonomy and should be supported by evidence before being asserted.

## Usage Considerations

- Prefer official DENUE API or downloadable official data where available.
- Prefer the official 05/2026 bulk dataset for the initial full manufacturer baseline.
- Respect INEGI token requirements and limits.
- Do not bypass access controls.
- Preserve raw payloads.
- Attribute DENUE as the source on imported records.
- Redact API tokens from stored request URLs and logs.
- If usage rights or rate limits are unclear for a planned bulk import, pause for human review.

## Future Sources To Evaluate

- Secretaria de Economia public resources.
- SIAVI and tariff/trade-related public resources.
- SAT/open government datasets where legitimately public and appropriate.
- State economic-development directories.
- Industry associations and export directories.
- Public company websites for careful, limited enrichment.
