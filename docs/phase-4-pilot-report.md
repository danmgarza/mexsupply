# Phase 4 Website Enrichment Pilot

## Pilot Run

The first write pilot was intentionally limited to one known-good homepage result.

Commands used:

```bash
npm.cmd run enrich:website-pilot -- --limit 6 --timeout 8000
npm.cmd run enrich:website-pilot -- --offset 4 --limit 1 --timeout 8000 --write
```

The six-record dry run showed:

- three stale or unreachable DENUE website values
- one reachable website with no supported claims found
- two reachable websites with extractable claims

Only `ACCUDYN` was written to local Supabase in the first pilot.

## Written Evidence

The Accudyn homepage produced three evidence-backed claims:

- capability: `Injection molding`
- material: `Plastics`
- industry served: `Automotive`

These were written to `company_evidence` and linked into the relevant taxonomy relationship tables.

## Website Quality Finding

DENUE website fields should be treated as candidate URLs, not verified URLs. Early examples included:

- refused HTTPS connection
- unresolved domain
- certificate name mismatch
- reachable homepage without supported claims

The enrichment pipeline should continue to preserve the DENUE website value while storing fetched final URLs and failure reasons separately in run output or future enrichment-run tracking.

## Next Refinement

Before scaling beyond small batches:

- add persistent enrichment run tracking for successes, failures, final URLs, and failure reasons
- continue dry-running batches before writing
- prefer company/product/facility pages over broad holding-company pages when homepage evidence is too generic
- keep keyword extraction conservative and review evidence snippets before trusting new claim patterns
