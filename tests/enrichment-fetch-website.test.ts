import { describe, expect, it } from "vitest";
import { disallowsRootForAllAgents, fetchUrlVariants, normalizeFetchUrl } from "@/lib/enrichment/fetch-website";

describe("website fetch helpers", () => {
  it("normalizes bare domains to https URLs", () => {
    expect(normalizeFetchUrl("www.example.com")).toBe("https://www.example.com");
    expect(normalizeFetchUrl("http://example.com")).toBe("http://example.com");
  });

  it("builds conservative URL variants for stale www or https records", () => {
    expect(fetchUrlVariants("https://www.example.com")).toEqual([
      "https://www.example.com",
      "https://example.com/",
      "http://www.example.com/",
      "http://example.com/"
    ]);
  });

  it("detects broad robots root disallow rules", () => {
    expect(
      disallowsRootForAllAgents(`
        User-agent: *
        Disallow: /
      `)
    ).toBe(true);

    expect(
      disallowsRootForAllAgents(`
        User-agent: ExampleBot
        Disallow: /
        User-agent: *
        Disallow:
      `)
    ).toBe(false);
  });
});
