import Link from "next/link";
import { getDataQualityReport, searchCompanies } from "@/lib/db/queries";

function MetricList({ rows }: { rows: Array<{ label?: string; metric?: string; value?: string; count?: string }> }) {
  if (rows.length === 0) {
    return <p className="text-sm text-[var(--muted)]">No database rows available yet.</p>;
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div className="flex justify-between gap-4 text-sm" key={`${row.label ?? row.metric}-${row.value ?? row.count}`}>
          <span>{row.label ?? row.metric}</span>
          <strong>{row.value ?? row.count}</strong>
        </div>
      ))}
    </div>
  );
}

export default async function AdminDataPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; state?: string; city?: string; industry?: string; website?: string; manufacturing?: string; qualified?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const website = params.website === "with" || params.website === "without" ? params.website : undefined;
  const qualifiedOnly = params.qualified === "qualified";
  const [report, rows] = await Promise.all([
    getDataQualityReport(),
    searchCompanies({
      q: params.q ?? "",
      state: params.state ?? "",
      city: params.city ?? "",
      industryCode: params.industry ?? "",
      website,
      manufacturingOnly: params.manufacturing === "1",
      qualifiedOnly,
      limit: 100
    })
  ]);

  return (
    <main className="shell">
      <header className="mb-6 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Sample Data Inspection</h1>
      </header>

      <form className="panel mb-6 grid gap-3 p-4 md:grid-cols-[1fr_150px_150px_150px_150px_160px_auto]">
        <input className="rounded-md border border-[var(--line)] px-3 py-2" name="q" placeholder="Search" defaultValue={params.q ?? ""} />
        <input className="rounded-md border border-[var(--line)] px-3 py-2" name="state" placeholder="State" defaultValue={params.state ?? ""} />
        <input className="rounded-md border border-[var(--line)] px-3 py-2" name="city" placeholder="City" defaultValue={params.city ?? ""} />
        <input className="rounded-md border border-[var(--line)] px-3 py-2" name="industry" placeholder="Class code" defaultValue={params.industry ?? ""} />
        <select className="rounded-md border border-[var(--line)] px-3 py-2" name="website" defaultValue={website ?? ""}>
          <option value="">Any website</option>
          <option value="with">With website</option>
          <option value="without">No website</option>
        </select>
        <select className="rounded-md border border-[var(--line)] px-3 py-2" name="qualified" defaultValue={qualifiedOnly ? "qualified" : "all"}>
          <option value="all">All records</option>
          <option value="qualified">Qualified only</option>
        </select>
        <button className="rounded-md bg-[var(--accent)] px-4 py-2 font-medium text-white" type="submit">
          Filter
        </button>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input name="manufacturing" type="checkbox" value="1" defaultChecked={params.manufacturing === "1"} />
          Manufacturing candidates only
        </label>
      </form>

      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="panel p-4">
          <h2 className="mb-3 text-lg font-semibold">Overall</h2>
          <MetricList rows={report.overall} />
        </div>
        <div className="panel p-4">
          <h2 className="mb-3 text-lg font-semibold">Manufacturing By State</h2>
          <MetricList rows={report.manufacturingByState} />
        </div>
        <div className="panel p-4">
          <h2 className="mb-3 text-lg font-semibold">Employee Size</h2>
          <MetricList rows={report.byEmployeeSize} />
        </div>
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <h2 className="mb-3 text-lg font-semibold">Field Completeness</h2>
          <div className="space-y-2">
            {report.completeness.map((row) => (
              <div className="grid grid-cols-[1fr_auto] gap-4 text-sm" key={row.field}>
                <span>{row.field}</span>
                <strong>{row.percent_populated}%</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-4">
          <h2 className="mb-3 text-lg font-semibold">Duplicate Patterns</h2>
          <MetricList rows={report.duplicates.map((row) => ({ label: `${row.pattern}: ${row.value}`, count: row.count }))} />
        </div>
      </section>

      <section className="panel overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-[#f4f6f2]">
            <tr>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">State</th>
              <th className="px-3 py-2">City</th>
              <th className="px-3 py-2">DENUE Classification</th>
              <th className="px-3 py-2">Employee Size</th>
              <th className="px-3 py-2">Website</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Manufacturing</th>
              <th className="px-3 py-2">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-2">
                  <Link className="font-medium text-[var(--accent-dark)]" href={`/companies/${row.id}`}>
                    {row.trade_name || row.legal_name || "Unknown"}
                  </Link>
                </td>
                <td className="px-3 py-2">{row.state}</td>
                <td className="px-3 py-2">{row.city}</td>
                <td className="px-3 py-2">{[row.industry_code, row.industry_label].filter(Boolean).join(" - ")}</td>
                <td className="px-3 py-2">{row.employee_size_band}</td>
                <td className="px-3 py-2">{row.website}</td>
                <td className="px-3 py-2">{row.phone}</td>
                <td className="px-3 py-2">{row.email}</td>
                <td className="px-3 py-2">{row.is_manufacturing_candidate ? "Yes" : "No"}</td>
                <td className="px-3 py-2">INEGI DENUE</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
