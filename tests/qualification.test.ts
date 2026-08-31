import { describe, expect, it } from "vitest";
import { hasContactChannel, isQualifiedSupplierCandidate } from "@/lib/analysis/qualification";

describe("supplier qualification", () => {
  it("excludes micro establishments even when contactable", () => {
    expect(
      isQualifiedSupplierCandidate({
        employee_size_band: "0 a 5 personas",
        website: "https://example.com",
        normalized_phone: null,
        phone: null,
        email: null
      })
    ).toBe(false);
  });

  it("requires at least one contact channel", () => {
    expect(
      isQualifiedSupplierCandidate({
        employee_size_band: "11 a 30 personas",
        website: null,
        normalized_phone: null,
        phone: null,
        email: null
      })
    ).toBe(false);

    expect(
      isQualifiedSupplierCandidate({
        employee_size_band: "11 a 30 personas",
        website: null,
        normalized_phone: "8180000000",
        phone: null,
        email: null
      })
    ).toBe(true);
  });

  it("treats any contact channel as contactable", () => {
    expect(hasContactChannel({ website: null, normalized_phone: null, phone: null, email: "sales@example.com" })).toBe(true);
  });
});
