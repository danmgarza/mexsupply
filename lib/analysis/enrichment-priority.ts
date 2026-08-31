import { isGenericEstablishmentName } from "@/lib/analysis/duplicate-clusters";
import { isQualifiedSupplierCandidate } from "@/lib/analysis/qualification";

export type EnrichmentCandidateInput = {
  id: string;
  trade_name: string | null;
  legal_name: string | null;
  normalized_name: string | null;
  employee_size_band: string | null;
  industry_code: string | null;
  industry_label: string | null;
  website: string | null;
  phone: string | null;
  normalized_phone?: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
};

export type EnrichmentCandidate = EnrichmentCandidateInput & {
  score: number;
  reasons: string[];
};

const employeeSizeScores = new Map([
  ["251 y más personas", 50],
  ["101 a 250 personas", 42],
  ["51 a 100 personas", 34],
  ["31 a 50 personas", 26],
  ["11 a 30 personas", 18],
  ["6 a 10 personas", 8]
]);

const procurementRelevantPrefixes = ["325", "326", "331", "332", "333", "334", "335", "336", "337"];

function employeeSizeScore(employeeSizeBand: string | null) {
  return employeeSizeBand ? employeeSizeScores.get(employeeSizeBand) ?? 0 : 0;
}

export function hasProcurementRelevantClass(industryCode: string | null) {
  return procurementRelevantPrefixes.some((prefix) => industryCode?.startsWith(prefix));
}

export function scoreEnrichmentCandidate(candidate: EnrichmentCandidateInput): EnrichmentCandidate {
  const reasons: string[] = [];
  let score = 0;

  if (!isQualifiedSupplierCandidate(candidate)) {
    return { ...candidate, score: 0, reasons: ["does not pass qualified-candidate filter"] };
  }

  const sizeScore = employeeSizeScore(candidate.employee_size_band);
  score += sizeScore;
  if (sizeScore) {
    reasons.push(`employee size ${candidate.employee_size_band}`);
  }

  if (candidate.website) {
    score += 25;
    reasons.push("has website");
  }

  if (candidate.email) {
    score += 12;
    reasons.push("has email");
  }

  if (candidate.normalized_phone || candidate.phone) {
    score += 8;
    reasons.push("has phone");
  }

  if (hasProcurementRelevantClass(candidate.industry_code)) {
    score += 15;
    reasons.push("procurement-relevant manufacturing class");
  }

  if (candidate.normalized_name && isGenericEstablishmentName(candidate.normalized_name)) {
    score -= 25;
    reasons.push("generic establishment name");
  }

  return { ...candidate, score: Math.max(0, score), reasons };
}

export function rankEnrichmentCandidates(candidates: EnrichmentCandidateInput[]) {
  return candidates
    .map(scoreEnrichmentCandidate)
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score || (left.trade_name ?? "").localeCompare(right.trade_name ?? ""));
}
