export type ExtractedClaimType = "capability" | "material" | "industry_served" | "certification";

export type ExtractedClaim = {
  claimType: ExtractedClaimType;
  claimValue: string;
  taxonomySlug?: string;
  evidenceText: string;
  confidence: number;
};

type ClaimRule = {
  claimType: ExtractedClaimType;
  claimValue: string;
  taxonomySlug?: string;
  pattern: RegExp;
  confidence: number;
};

const claimRules: ClaimRule[] = [
  { claimType: "capability", claimValue: "CNC machining", taxonomySlug: "cnc-machining", pattern: /\bcnc\b|\bmachining\b|\bmaquinado\b|\bmaquinados\b|mecanizado/i, confidence: 0.68 },
  { claimType: "capability", claimValue: "Injection molding", taxonomySlug: "injection-molding", pattern: /injection molding|moldeo por inyecci[oó]n|inyecci[oó]n de pl[aá]stico/i, confidence: 0.72 },
  { claimType: "capability", claimValue: "Die casting", taxonomySlug: "die-casting", pattern: /die casting|fundici[oó]n a presi[oó]n|fundici[oó]n/i, confidence: 0.7 },
  { claimType: "capability", claimValue: "Stamping", taxonomySlug: "stamping", pattern: /\bstamping\b|estampado|estampaci[oó]n|troquelado|troquelados/i, confidence: 0.68 },
  { claimType: "capability", claimValue: "Sheet metal", taxonomySlug: "sheet-metal", pattern: /sheet metal|l[aá]mina met[aá]lica|paileri?a|caldereri?a/i, confidence: 0.66 },
  { claimType: "capability", claimValue: "Welding", taxonomySlug: "welding", pattern: /\bwelding\b|soldadura|soldado/i, confidence: 0.66 },
  { claimType: "material", claimValue: "Aluminum", taxonomySlug: "aluminum", pattern: /aluminum|aluminium|aluminio/i, confidence: 0.65 },
  { claimType: "material", claimValue: "Steel", taxonomySlug: "steel", pattern: /\bsteel\b|acero/i, confidence: 0.65 },
  { claimType: "material", claimValue: "Stainless steel", taxonomySlug: "stainless-steel", pattern: /stainless steel|acero inoxidable/i, confidence: 0.68 },
  { claimType: "material", claimValue: "Copper", taxonomySlug: "copper", pattern: /\bcopper\b|cobre/i, confidence: 0.65 },
  { claimType: "material", claimValue: "Plastics", taxonomySlug: "plastics", pattern: /\bplastics?\b|pl[aá]sticos?/i, confidence: 0.65 },
  { claimType: "industry_served", claimValue: "Automotive", taxonomySlug: "automotive", pattern: /automotive|automotriz|autom[oó]viles|autopartes/i, confidence: 0.66 },
  { claimType: "industry_served", claimValue: "Aerospace", taxonomySlug: "aerospace", pattern: /aerospace|aeroespacial/i, confidence: 0.68 },
  { claimType: "industry_served", claimValue: "Electronics", taxonomySlug: "electronics", pattern: /electronics industry|electronics market|industria electr[oó]nica|sector electr[oó]nico/i, confidence: 0.64 },
  { claimType: "industry_served", claimValue: "Medical", taxonomySlug: "medical", pattern: /medical devices?|medical industry|medical market|dispositivos m[eé]dicos|industria m[eé]dica|sector m[eé]dico/i, confidence: 0.64 },
  { claimType: "industry_served", claimValue: "Industrial", taxonomySlug: "industrial", pattern: /industrial applications?|industrial markets?|industrial equipment|aplicaciones industriales|equipo industrial|sector industrial/i, confidence: 0.6 },
  { claimType: "certification", claimValue: "ISO 9001", taxonomySlug: "iso-9001", pattern: /iso\s*9001/i, confidence: 0.82 },
  { claimType: "certification", claimValue: "IATF 16949", taxonomySlug: "iatf-16949", pattern: /iatf\s*16949/i, confidence: 0.84 },
  { claimType: "certification", claimValue: "AS9100", taxonomySlug: "as9100", pattern: /as\s*9100/i, confidence: 0.84 }
];

export function htmlToSearchableText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#0*38;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function evidenceSnippet(text: string, pattern: RegExp) {
  const match = pattern.exec(text);
  if (match?.index == null) {
    return text.slice(0, 220);
  }
  const start = Math.max(0, match.index - 100);
  const end = Math.min(text.length, match.index + match[0].length + 120);
  return text.slice(start, end).trim();
}

export function extractWebsiteClaims(html: string) {
  const text = htmlToSearchableText(html);
  const claims = new Map<string, ExtractedClaim>();

  for (const rule of claimRules) {
    if (!rule.pattern.test(text)) {
      continue;
    }
    const key = `${rule.claimType}:${rule.claimValue}`;
    claims.set(key, {
      claimType: rule.claimType,
      claimValue: rule.claimValue,
      taxonomySlug: rule.taxonomySlug,
      evidenceText: evidenceSnippet(text, rule.pattern),
      confidence: rule.confidence
    });
  }

  return [...claims.values()];
}
