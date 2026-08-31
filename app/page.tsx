import Link from "next/link";
import { searchCompanies } from "@/lib/db/queries";

export default async function Home({
  searchParams
}: {
  searchParams?: Promise<{
    q?: string;
    state?: string;
    city?: string;
    industry?: string;
    size?: string;
    website?: string;
    manufacturing?: string;
    qualified?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const q = params.q ?? "";
  const state = params.state ?? "";
  const city = params.city ?? "";
  const industryCode = params.industry ?? "";
  const employeeSize = params.size ?? "";
  const website = params.website === "with" || params.website === "without" ? params.website : undefined;
  const manufacturingOnly = params.manufacturing === "1";
  const qualifiedOnly = params.qualified !== "all";
  const companies = await searchCompanies({
    q,
    state,
    city,
    industryCode,
    employeeSize,
    website,
    manufacturingOnly,
    qualifiedOnly,
    limit: 25
  });

  return (
    <main className="shell">
      <header className="mb-8 flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent-dark)]">
          Mexico Supplier Intelligence
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight">
          Search a provenance-first Mexican manufacturing dataset.
        </h1>
      </header>

      <form className="panel mb-6 grid gap-3 p-4 md:grid-cols-[1fr_160px_160px_160px_170px_auto]">
        <input
          className="rounded-md border border-[var(--line)] px-3 py-2"
          name="q"
          placeholder="Company, activity, city, capability"
          defaultValue={q}
        />
        <input
          className="rounded-md border border-[var(--line)] px-3 py-2"
          name="state"
          placeholder="State"
          defaultValue={state}
        />
        <input
          className="rounded-md border border-[var(--line)] px-3 py-2"
          name="city"
          placeholder="City"
          defaultValue={city}
        />
        <input
          className="rounded-md border border-[var(--line)] px-3 py-2"
          name="industry"
          placeholder="Class code"
          defaultValue={industryCode}
        />
        <select className="rounded-md border border-[var(--line)] px-3 py-2" name="website" defaultValue={website ?? ""}>
          <option value="">Any website</option>
          <option value="with">With website</option>
          <option value="without">No website</option>
        </select>
        <select className="rounded-md border border-[var(--line)] px-3 py-2" name="qualified" defaultValue={qualifiedOnly ? "qualified" : "all"}>
          <option value="qualified">Qualified only</option>
          <option value="all">All records</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input name="manufacturing" type="checkbox" value="1" defaultChecked={manufacturingOnly} />
          Manufacturing
        </label>
        <button className="rounded-md bg-[var(--accent)] px-4 py-2 font-medium text-white" type="submit">
          Search
        </button>
      </form>

      <section className="panel overflow-hidden">
        <div className="border-b border-[var(--line)] px-4 py-3 text-sm text-[var(--muted)]">
          {companies.length} result{companies.length === 1 ? "" : "s"}
        </div>
        <div className="divide-y divide-[var(--line)]">
          {companies.map((company) => (
            <Link className="block px-4 py-4 hover:bg-[#f4f6f2]" href={`/companies/${company.id}`} key={company.id}>
              <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
                <h2 className="text-lg font-semibold">{company.trade_name || company.legal_name}</h2>
                <span className="text-sm text-[var(--muted)]">
                  {[company.city, company.state].filter(Boolean).join(", ")}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">{company.industry_label || "Unclassified"}</p>
            </Link>
          ))}
          {companies.length === 0 ? (
            <div className="px-4 py-8 text-sm text-[var(--muted)]">
              No companies yet. Run the DENUE ingestion job with a token or fixture data.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
