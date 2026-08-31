import { getDuplicateClusterReport } from "@/lib/db/queries";

const categoryLabels = {
  branch_or_network: "Branch or network",
  low_priority_noise: "Low priority",
  possible_duplicate_review: "Review"
};

function compactList(values: string[], limit = 3) {
  if (values.length <= limit) {
    return values.join(", ");
  }

  return `${values.slice(0, limit).join(", ")} +${values.length - limit}`;
}

export default async function AdminDuplicatesPage() {
  const report = await getDuplicateClusterReport();

  return (
    <main className="shell">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent-dark)]">Admin</p>
        <h1 className="text-3xl font-semibold">Duplicate Cluster Review</h1>
      </header>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        {Object.entries(categoryLabels).map(([key, label]) => (
          <div className="panel p-4" key={key}>
            <div className="text-sm text-[var(--muted)]">{label}</div>
            <div className="mt-2 text-3xl font-semibold">{report.summary[key] ?? 0}</div>
          </div>
        ))}
      </section>

      <section className="panel overflow-x-auto">
        <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-[#f4f6f2]">
            <tr>
              <th className="px-3 py-2">Cluster</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Rows</th>
              <th className="px-3 py-2">Qualified</th>
              <th className="px-3 py-2">States</th>
              <th className="px-3 py-2">Classes</th>
              <th className="px-3 py-2">Domains</th>
              <th className="px-3 py-2">Rationale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {report.clusters.map((cluster) => (
              <tr key={`${cluster.pattern}-${cluster.value}`}>
                <td className="px-3 py-2">
                  <div className="font-medium">{cluster.value}</div>
                  <div className="text-xs text-[var(--muted)]">{cluster.pattern}</div>
                </td>
                <td className="px-3 py-2">{categoryLabels[cluster.category]}</td>
                <td className="px-3 py-2">{cluster.count}</td>
                <td className="px-3 py-2">{cluster.qualifiedCount}</td>
                <td className="px-3 py-2">{compactList(cluster.states)}</td>
                <td className="px-3 py-2">{compactList(cluster.industryCodes, 4)}</td>
                <td className="px-3 py-2">{compactList(cluster.websiteDomains)}</td>
                <td className="max-w-[340px] px-3 py-2 text-[var(--muted)]">{cluster.rationale}</td>
              </tr>
            ))}
            {report.clusters.length === 0 ? (
              <tr>
                <td className="px-3 py-8 text-[var(--muted)]" colSpan={8}>
                  No duplicate clusters available.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  );
}
