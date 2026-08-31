import type { NormalizedDenueRecord } from "@/lib/denue/types";

export type DuplicateSignal = "normalized_name" | "normalized_phone" | "website_domain" | "address";

export type DuplicateCandidate = {
  left: string;
  right: string;
  signals: DuplicateSignal[];
  score: number;
};

function addPairs(
  groups: Map<string, NormalizedDenueRecord[]>,
  signal: DuplicateSignal,
  candidates: Map<string, DuplicateCandidate>
) {
  for (const records of groups.values()) {
    if (records.length < 2) {
      continue;
    }

    for (let i = 0; i < records.length; i += 1) {
      for (let j = i + 1; j < records.length; j += 1) {
        const left = records[i].sourceRecordId;
        const right = records[j].sourceRecordId;
        const key = [left, right].sort().join("|");
        const candidate = candidates.get(key) ?? { left, right, signals: [], score: 0 };
        if (!candidate.signals.includes(signal)) {
          candidate.signals.push(signal);
        }
        candidates.set(key, candidate);
      }
    }
  }
}

function groupBy(records: NormalizedDenueRecord[], keyFn: (record: NormalizedDenueRecord) => string | null) {
  const groups = new Map<string, NormalizedDenueRecord[]>();
  for (const record of records) {
    const key = keyFn(record);
    if (!key) {
      continue;
    }
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }
  return groups;
}

export function findDuplicateCandidates(records: NormalizedDenueRecord[]): DuplicateCandidate[] {
  const candidates = new Map<string, DuplicateCandidate>();
  addPairs(groupBy(records, (record) => record.normalizedName), "normalized_name", candidates);
  addPairs(groupBy(records, (record) => record.normalizedPhone), "normalized_phone", candidates);
  addPairs(groupBy(records, (record) => record.websiteDomain), "website_domain", candidates);
  addPairs(
    groupBy(records, (record) =>
      [record.normalizedName, record.street, record.postalCode].filter(Boolean).join("|").toUpperCase() || null
    ),
    "address",
    candidates
  );

  return [...candidates.values()]
    .map((candidate) => ({
      ...candidate,
      score: Math.min(1, candidate.signals.length / 4)
    }))
    .sort((a, b) => b.score - a.score);
}
