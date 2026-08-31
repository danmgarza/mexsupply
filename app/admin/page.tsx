import { getAdminMetrics } from "@/lib/db/queries";

export default async function AdminPage() {
  const metrics = await getAdminMetrics();

  return (
    <main className="shell">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent-dark)]">Admin</p>
        <h1 className="text-3xl font-semibold">Data Exploration Dashboard</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {metrics.cards.map((card) => (
          <div className="panel p-4" key={card.label}>
            <div className="text-sm text-[var(--muted)]">{card.label}</div>
            <div className="mt-2 text-3xl font-semibold">{card.value}</div>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="panel p-4">
          <h2 className="mb-3 text-lg font-semibold">Companies By State</h2>
          <div className="space-y-2">
            {metrics.byState.map((row) => (
              <div className="flex justify-between gap-3 text-sm" key={row.state}>
                <span>{row.state || "Unknown"}</span>
                <strong>{row.count}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-4">
          <h2 className="mb-3 text-lg font-semibold">Latest Ingestion Runs</h2>
          <div className="space-y-2">
            {metrics.latestRuns.map((run) => (
              <div className="text-sm" key={run.id}>
                <div className="flex justify-between gap-3">
                  <span>{run.source}</span>
                  <strong>{run.status}</strong>
                </div>
                <div className="text-[var(--muted)]">
                  {run.records_inserted} inserted, {run.records_updated} updated, {run.records_failed} failed
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
