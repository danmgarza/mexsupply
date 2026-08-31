import Link from "next/link";
import { getRecentEnrichmentEvidence } from "@/lib/db/queries";

function formatConfidence(value: string | null) {
  if (!value) {
    return "n/a";
  }
  return `${Math.round(Number(value) * 100)}%`;
}

export default async function AdminEnrichmentPage() {
  const evidence = await getRecentEnrichmentEvidence(100);

  return (
    <main className="shell">
      <header className="mb-6 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Enrichment Review</h1>
        <p className="max-w-3xl text-sm text-[var(--muted)]">Evidence-backed claims extracted from company websites.</p>
      </header>

      <section className="panel overflow-x-auto">
        <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-[#f4f6f2]">
            <tr>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Claim</th>
              <th className="px-3 py-2">Confidence</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Evidence</th>
              <th className="px-3 py-2">Method</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {evidence.map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-2">
                  <Link className="font-medium text-[var(--accent)]" href={`/companies/${row.company_id}`}>
                    {row.company_name}
                  </Link>
                  <div className="text-xs text-[var(--muted)]">{[row.city, row.state].filter(Boolean).join(", ")}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium">{row.claim_value}</div>
                  <div className="text-xs text-[var(--muted)]">{row.claim_type}</div>
                </td>
                <td className="px-3 py-2">{formatConfidence(row.confidence)}</td>
                <td className="max-w-[180px] truncate px-3 py-2">
                  {row.source_url ? (
                    <a className="text-[var(--accent)]" href={row.source_url} rel="noreferrer" target="_blank">
                      {row.source}
                    </a>
                  ) : (
                    row.source
                  )}
                </td>
                <td className="max-w-[360px] px-3 py-2 text-[var(--muted)]">{row.evidence_text}</td>
                <td className="px-3 py-2 text-xs text-[var(--muted)]">{row.extraction_method}</td>
              </tr>
            ))}
            {evidence.length === 0 ? (
              <tr>
                <td className="px-3 py-8 text-[var(--muted)]" colSpan={6}>
                  No enrichment evidence has been written yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  );
}
