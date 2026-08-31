import { describe, expect, it } from "vitest";
import { extractWebsiteClaims, htmlToSearchableText } from "@/lib/enrichment/extract";

describe("website claim extraction", () => {
  it("extracts bilingual capability, material, industry, and certification claims", () => {
    const claims = extractWebsiteClaims(`
      <html>
        <head><style>.hidden { display: none; }</style></head>
        <body>
          <script>window.analytics = true;</script>
          Fabricamos autopartes mediante inyección de plástico y troquelados.
          Trabajamos acero inoxidable y aluminio para la industria automotriz.
          Sistema de calidad certificado ISO 9001 e IATF 16949.
        </body>
      </html>
    `);

    expect(claims.map((claim) => claim.claimValue)).toEqual(
      expect.arrayContaining(["Injection molding", "Stamping", "Stainless steel", "Aluminum", "Automotive", "ISO 9001", "IATF 16949"])
    );
  });

  it("removes scripts, styles, tags, and common entities before matching", () => {
    const text = htmlToSearchableText("<style>steel</style><script>aluminum</script><p>CNC &amp; maquinado</p>");

    expect(text).toBe("CNC & maquinado");
  });
});
