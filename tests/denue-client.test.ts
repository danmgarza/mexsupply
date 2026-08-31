import { describe, expect, it } from "vitest";
import { buildDenueAreaActivityUrl } from "@/lib/denue/client";

describe("DENUE client", () => {
  it("builds BuscarAreaActEstr URLs in documented parameter order", () => {
    const url = buildDenueAreaActivityUrl(
      {
        state: "19",
        economicSector: "33",
        economicSubsector: "336",
        economicBranch: "3363",
        economicClass: "336370",
        from: 1,
        to: 10,
        stratum: "0"
      },
      "TOKEN"
    );

    expect(url).toContain("/BuscarAreaActEstr/19/0/0/0/0/33/336/3363/336370/0/1/10/0/0/TOKEN");
  });
});
