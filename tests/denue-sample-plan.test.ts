import { describe, expect, it } from "vitest";
import { buildDenueSamplePlan } from "@/lib/denue/sample-plan";

describe("DENUE sample plan", () => {
  it("balances requests across states and sectors", () => {
    const plan = buildDenueSamplePlan({
      states: ["19", "11"],
      sectors: ["31", "32", "33"],
      limit: 60,
      pageSize: 10
    });

    expect(plan).toHaveLength(6);
    expect(plan.map((batch) => `${batch.state}-${batch.sector}`)).toEqual([
      "19-31",
      "19-32",
      "19-33",
      "11-31",
      "11-32",
      "11-33"
    ]);
    expect(plan[0]).toMatchObject({ from: 1, to: 10 });
  });
});
