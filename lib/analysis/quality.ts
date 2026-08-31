import { findDuplicateCandidates } from "@/lib/analysis/duplicates";
import { normalizeDenueRecord } from "@/lib/denue/normalize";
import type { DenueRawRecord, NormalizedDenueRecord } from "@/lib/denue/types";

export type FieldCompleteness = {
  field: string;
  populated: number;
  missing: number;
  percentPopulated: number;
};

export function fieldCompleteness(records: NormalizedDenueRecord[], fields: Array<keyof NormalizedDenueRecord>) {
  return fields.map<FieldCompleteness>((field) => {
    const populated = records.filter((record) => {
      const value = record[field];
      return value !== null && value !== "";
    }).length;
    const missing = records.length - populated;
    return {
      field: String(field),
      populated,
      missing,
      percentPopulated: records.length ? Number(((populated / records.length) * 100).toFixed(1)) : 0
    };
  });
}

export function countBy<T>(records: T[], keyFn: (record: T) => string | null | undefined) {
  const counts = new Map<string, number>();
  for (const record of records) {
    const key = keyFn(record) || "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function analyzeDenueRecords(rawRecords: DenueRawRecord[]) {
  const records = rawRecords.map(normalizeDenueRecord);
  const manufacturingCandidates = records.filter((record) => record.isManufacturingCandidate);

  return {
    totalRecords: records.length,
    manufacturingCandidates: manufacturingCandidates.length,
    withWebsite: records.filter((record) => record.website).length,
    withEmail: records.filter((record) => record.email).length,
    withPhone: records.filter((record) => record.normalizedPhone).length,
    withCoordinates: records.filter((record) => record.latitude !== null && record.longitude !== null).length,
    byState: countBy(records, (record) => record.state),
    manufacturingByState: countBy(manufacturingCandidates, (record) => record.state),
    byClassification: countBy(records, (record) => record.industryCode ?? record.industryLabel),
    byEmployeeSize: countBy(records, (record) => record.employeeSizeBand),
    completeness: fieldCompleteness(records, [
      "tradeName",
      "street",
      "phone",
      "email",
      "website",
      "employeeSizeBand",
      "industryCode",
      "latitude"
    ]),
    duplicateCandidates: findDuplicateCandidates(records).slice(0, 25)
  };
}
