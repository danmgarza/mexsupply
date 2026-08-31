import { getCompanyProfile } from "@/lib/db/queries";

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCompanyProfile(id);

  if (!profile) {
    return (
      <main className="shell">
        <h1 className="text-3xl font-semibold">Company not found</h1>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="mb-6">
        <h1 className="text-4xl font-semibold">{profile.trade_name || profile.legal_name}</h1>
        <p className="mt-2 text-[var(--muted)]">
          {[profile.city, profile.municipality, profile.state].filter(Boolean).join(", ")}
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="panel p-5">
          <h2 className="text-lg font-semibold">Identity</h2>
          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="text-[var(--muted)]">Legal name</dt>
              <dd>{profile.legal_name || "Unknown"}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Industry</dt>
              <dd>{profile.industry_label || "Unknown"}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Employee size</dt>
              <dd>{profile.employee_size_band || "Unknown"}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Website</dt>
              <dd>{profile.website || "None in source"}</dd>
            </div>
          </dl>
        </div>
        <div className="panel p-5">
          <h2 className="text-lg font-semibold">Sources</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {profile.sources.map((source) => (
              <li key={`${source.source}-${source.source_record_id}`}>
                <strong>{source.source}</strong>
                <div className="text-[var(--muted)]">{source.source_record_id}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
