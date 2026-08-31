import type { DenueRawRecord, NormalizedDenueRecord } from "@/lib/denue/types";

const emptyValues = new Set(["", "na", "n/a", "nd", "no disponible", "sin dato"]);

export function cleanText(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const cleaned = String(value).replace(/\s+/g, " ").trim();
  if (emptyValues.has(cleaned.toLowerCase())) {
    return null;
  }

  return cleaned;
}

export function normalizeName(value: unknown): string | null {
  const cleaned = cleanText(value);
  if (!cleaned) {
    return null;
  }

  return cleaned
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export function normalizeWebsite(value: unknown): string | null {
  const cleaned = cleanText(value);
  if (!cleaned) {
    return null;
  }

  if (/^https?:\/\//i.test(cleaned)) {
    return cleaned;
  }

  return `https://${cleaned}`;
}

export function extractDomain(value: unknown): string | null {
  const website = normalizeWebsite(value);
  if (!website) {
    return null;
  }

  try {
    return new URL(website).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

export function normalizePhone(value: unknown): string | null {
  const cleaned = cleanText(value);
  if (!cleaned) {
    return null;
  }

  const digits = cleaned.replace(/\D/g, "");
  return digits.length >= 7 ? digits : null;
}

export function normalizeEmail(value: unknown): string | null {
  const cleaned = cleanText(value);
  if (!cleaned) {
    return null;
  }

  const email = cleaned.toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function splitLocationParts(value: string) {
  const parts: string[] = [];
  let current = "";
  let parenDepth = 0;

  for (const char of value) {
    if (char === "(") {
      parenDepth += 1;
    } else if (char === ")" && parenDepth > 0) {
      parenDepth -= 1;
    }

    if (char === "," && parenDepth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  parts.push(current.trim());
  return parts.filter(Boolean);
}

export function parseLocation(value: unknown) {
  const cleaned = cleanText(value);
  if (!cleaned) {
    return { city: null, municipality: null, state: null };
  }

  const parts = splitLocationParts(cleaned);
  return {
    city: parts[0] ?? null,
    municipality: parts[1] ?? null,
    state: parts[2] ?? null
  };
}

export function parseNumber(value: unknown): number | null {
  const cleaned = cleanText(value);
  if (!cleaned) {
    return null;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function firstText(...values: unknown[]): string | null {
  for (const value of values) {
    const cleaned = cleanText(value);
    if (cleaned) {
      return cleaned;
    }
  }
  return null;
}

export function denueSectorId(record: DenueRawRecord) {
  return firstText(record.Sector_actividad_id, record.SECTOR_ACTIVIDAD_ID) ?? denueClassId(record)?.slice(0, 2) ?? null;
}

export function denueClassId(record: DenueRawRecord) {
  return firstText(record.Clase_actividad_id, record.CLASE_ACTIVIDAD_ID, record.codigo_act);
}

export function isManufacturingActivity(record: DenueRawRecord) {
  const sector = denueSectorId(record);
  const classCode = denueClassId(record);
  return sector === "31" || sector === "32" || sector === "33" || classCode?.startsWith("31") || classCode?.startsWith("32") || classCode?.startsWith("33") || false;
}

export function normalizeDenueRecord(record: DenueRawRecord): NormalizedDenueRecord {
  const location = parseLocation(record.Ubicacion);
  const tradeName = firstText(record.Nombre, record.nom_estab);
  const legalName = firstText(record.Razon_social, record.raz_social);
  const website = firstText(record.Sitio_internet, record.www);
  const phone = firstText(record.Telefono, record.telefono);
  const streetType = firstText(record.Tipo_vialidad, record.tipo_vial);
  const streetName = firstText(record.Calle, record.nom_vial);
  const streetNumber = firstText(record.Num_Exterior, record.numero_ext);

  return {
    sourceRecordId: firstText(record.Id, record.id, record.CLEE, record.clee) ?? crypto.randomUUID(),
    denueId: firstText(record.Id, record.id),
    legalName,
    tradeName,
    normalizedName: normalizeName(legalName ?? tradeName),
    website: normalizeWebsite(website),
    websiteDomain: extractDomain(website),
    phone,
    normalizedPhone: normalizePhone(phone),
    email: normalizeEmail(firstText(record.Correo_e, record.correoelec)),
    street: [streetType, streetName, streetNumber]
      .filter(Boolean)
      .join(" ") || null,
    city: firstText(location.city, record.localidad),
    municipality: firstText(location.municipality, record.municipio),
    state: firstText(location.state, record.entidad),
    postalCode: firstText(record.CP, record.cod_postal),
    latitude: parseNumber(firstText(record.Latitud, record.latitud)),
    longitude: parseNumber(firstText(record.Longitud, record.longitud)),
    employeeSizeBand: firstText(record.Estrato, record.per_ocu),
    industryCode: denueClassId(record),
    industryLabel: firstText(record.Clase_actividad, record.nombre_act),
    establishmentStatus: firstText(record.Tipo, record.tipoUniEco),
    isManufacturingCandidate: isManufacturingActivity(record)
  };
}
