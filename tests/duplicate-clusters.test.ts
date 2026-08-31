import { describe, expect, it } from "vitest";
import { assessDuplicateCluster, type DuplicateClusterRow } from "@/lib/analysis/duplicate-clusters";

const baseCluster: DuplicateClusterRow = {
  pattern: "normalized_name",
  value: "ACME",
  count: 2,
  states: ["NUEVO LEÓN"],
  cities: ["MONTERREY"],
  postalCodes: ["64000"],
  industryCodes: ["332710"],
  websiteDomains: [],
  employeeSizeBands: ["11 a 30 personas"],
  contactableCount: 2,
  qualifiedCount: 2
};

describe("duplicate cluster assessment", () => {
  it("treats repeated brands across locations as branch or network signals", () => {
    const assessment = assessDuplicateCluster({
      ...baseCluster,
      value: "BIMBO",
      count: 16,
      states: ["BAJA CALIFORNIA", "NUEVO LEÓN"],
      cities: ["MONTERREY", "TIJUANA"],
      websiteDomains: ["bimbo.com.mx"]
    });

    expect(assessment.category).toBe("branch_or_network");
  });

  it("treats generic short names as weak duplicate evidence", () => {
    const assessment = assessDuplicateCluster({
      ...baseCluster,
      value: "ABARROTES",
      count: 3
    });

    expect(assessment.category).toBe("low_priority_noise");
  });

  it("down-ranks clusters with no qualified candidates", () => {
    const assessment = assessDuplicateCluster({
      ...baseCluster,
      value: "ACUA PURA",
      count: 3,
      states: ["BAJA CALIFORNIA", "COAHUILA DE ZARAGOZA"],
      qualifiedCount: 0
    });

    expect(assessment.category).toBe("low_priority_noise");
  });

  it("keeps small same-location clusters for manual review", () => {
    const assessment = assessDuplicateCluster(baseCluster);

    expect(assessment.category).toBe("possible_duplicate_review");
  });
});
