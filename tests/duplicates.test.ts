import { describe, expect, it } from "vitest";
import { findDuplicateCandidates } from "@/lib/analysis/duplicates";
import type { NormalizedDenueRecord } from "@/lib/denue/types";

const baseRecord: NormalizedDenueRecord = {
  sourceRecordId: "1",
  denueId: "1",
  legalName: "A",
  tradeName: "A",
  normalizedName: "A",
  website: null,
  websiteDomain: null,
  phone: null,
  normalizedPhone: null,
  email: null,
  street: null,
  city: null,
  municipality: null,
  state: null,
  postalCode: null,
  latitude: null,
  longitude: null,
  employeeSizeBand: null,
  industryCode: null,
  industryLabel: null,
  establishmentStatus: null,
  isManufacturingCandidate: true
};

describe("duplicate analysis", () => {
  it("flags exact normalized-name and domain duplicates without merging them", () => {
    const candidates = findDuplicateCandidates([
      { ...baseRecord, sourceRecordId: "1", normalizedName: "ACME", websiteDomain: "acme.mx" },
      { ...baseRecord, sourceRecordId: "2", normalizedName: "ACME", websiteDomain: "acme.mx" },
      { ...baseRecord, sourceRecordId: "3", normalizedName: "OTHER" }
    ]);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].signals).toEqual(["normalized_name", "website_domain", "address"]);
  });
});
