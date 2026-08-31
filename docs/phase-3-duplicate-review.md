# Phase 3 Duplicate Review

## Summary

The current 1,100-row local database shows repeated identity/contact patterns, but the highest-count clusters should not be auto-merged.

Run the repeatable report with:

```bash
npm.cmd run analyze:duplicates
```

Current top-40 cluster assessment:

- Branch or network signals: 14
- Low-priority noise: 9
- Possible duplicate review: 17

## Working Logic

Repeated DENUE rows are establishments, not necessarily companies. The app should preserve each official establishment row unless multiple strong signals indicate an actual duplicate.

Use these categories:

- `branch_or_network`: same brand/domain across distinct cities, states, postal codes, plants, or branches. Keep separate. Good examples: `BIMBO`, `BARCEL`, `AAM MAQUILADORA MEXICO`, `ALEN DEL NORTE`.
- `low_priority_noise`: generic establishment names, typo-like names, or clusters with no qualified candidates. Down-rank for enrichment. Good examples: `ABARROTES`, `ACERRADERO`, `ALFARERIA`, `ACUA PURA`.
- `possible_duplicate_review`: repeated phone/domain/name signals in the same city or postal code. Review manually before any merge behavior.

## Specific Observations

`BIMBO` and `BARCEL` look like multi-location company networks. Their records span multiple cities/states and should remain separate establishments.

`ABARROTES` is a generic name pattern and all current rows fail the qualified-candidate filter. It should not enter enrichment.

`ACERRADERO` is likely a misspelling or generic shorthand for sawmill-related activity. It has weak identity value and should be down-ranked unless a specific contactable, non-micro record matters later.

`ACUA PURA` looks typo-like and all current rows are `0 a 5 personas`, so it stays out of the qualified/enrichment queue.

Clusters such as `ACCUDYN DE MEXICO`, repeated phone `6145123935`, and repeated domain `accudyn.com` are better manual-review examples because they share strong contact/location signals.

## Decision

Do not merge automatically in Phase 3.

Use duplicate clusters as:

- review signals for data-quality workflows
- down-ranking signals for low-quality enrichment candidates
- branch/network signals that preserve establishment-level rows

Future merge logic should require multiple aligned signals, such as same normalized name plus same postal code/address/contact, and should still preserve the underlying `raw_denue` and `company_sources` records.
