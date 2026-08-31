import type { CompanySearchRow } from "@/lib/db/queries";
import type { NormalizedDenueRecord } from "@/lib/denue/types";

const microEmployeeBand = "0 a 5 personas";

export function hasContactChannel(record: Pick<CompanySearchRow, "website" | "phone" | "email"> & { normalized_phone?: string | null }) {
  return Boolean(record.website || record.normalized_phone || record.phone || record.email);
}

export function isQualifiedSupplierCandidate(
  record: Pick<CompanySearchRow, "employee_size_band" | "website" | "phone" | "email"> & { normalized_phone?: string | null }
) {
  return record.employee_size_band !== microEmployeeBand && hasContactChannel(record);
}

export function isQualifiedNormalizedSupplierCandidate(record: NormalizedDenueRecord) {
  return record.employeeSizeBand !== microEmployeeBand && Boolean(record.website || record.normalizedPhone || record.email);
}

export function qualifiedSupplierSql(alias = "companies") {
  const table = alias ? `${alias}.` : "";
  return `${table}employee_size_band is distinct from '0 a 5 personas'
    and (nullif(${table}website, '') is not null or nullif(${table}normalized_phone, '') is not null or nullif(${table}email, '') is not null)`;
}
