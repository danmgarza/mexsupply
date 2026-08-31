import { describe, expect, it } from "vitest";
import {
  isWebsiteEnrichmentCandidate,
  rankEnrichmentCandidates,
  rankWebsiteEnrichmentCandidates,
  scoreEnrichmentCandidate,
  type EnrichmentCandidateInput
} from "@/lib/analysis/enrichment-priority";

const baseCandidate: EnrichmentCandidateInput = {
  id: "1",
  trade_name: "ACME",
  legal_name: null,
  normalized_name: "ACME",
  employee_size_band: "251 y más personas",
  industry_code: "332710",
  industry_label: "Maquinado de piezas metálicas",
  website: "https://example.com",
  phone: null,
  normalized_phone: null,
  email: null,
  city: "MONTERREY",
  state: "NUEVO LEÓN"
};

describe("enrichment priority", () => {
  it("prioritizes qualified larger manufacturers with websites", () => {
    const scored = scoreEnrichmentCandidate(baseCandidate);

    expect(scored.score).toBeGreaterThan(80);
    expect(scored.reasons).toContain("has website");
    expect(scored.reasons).toContain("procurement-relevant manufacturing class");
  });

  it("excludes unqualified micro establishments", () => {
    const scored = scoreEnrichmentCandidate({
      ...baseCandidate,
      employee_size_band: "0 a 5 personas"
    });

    expect(scored.score).toBe(0);
  });

  it("down-ranks generic establishment names", () => {
    const scored = scoreEnrichmentCandidate({
      ...baseCandidate,
      normalized_name: "ACERRADERO",
      trade_name: "ACERRADERO"
    });

    expect(scored.score).toBeLessThan(scoreEnrichmentCandidate(baseCandidate).score);
    expect(scored.reasons).toContain("generic establishment name");
  });

  it("ranks higher-scoring candidates first", () => {
    const ranked = rankEnrichmentCandidates([
      { ...baseCandidate, id: "small", employee_size_band: "6 a 10 personas", website: null, email: "sales@example.com" },
      baseCandidate
    ]);

    expect(ranked[0].id).toBe("1");
  });

  it("requires a website for the website enrichment lane", () => {
    const contactOnly = {
      ...baseCandidate,
      id: "contact-only",
      website: null,
      email: "sales@example.com"
    };

    expect(scoreEnrichmentCandidate(contactOnly).score).toBeGreaterThan(0);
    expect(isWebsiteEnrichmentCandidate(contactOnly)).toBe(false);
    expect(rankWebsiteEnrichmentCandidates([contactOnly, baseCandidate]).map((candidate) => candidate.id)).toEqual(["1"]);
  });
});
