import { describe, expect, it } from "vitest";
import {
  extractDomain,
  isManufacturingActivity,
  normalizeDenueRecord,
  normalizeEmail,
  normalizeName,
  normalizePhone,
  normalizeWebsite,
  parseLocation
} from "@/lib/denue/normalize";

describe("DENUE normalization", () => {
  it("normalizes names for matching", () => {
    expect(normalizeName(" Maquinados del Norte, S.A. de C.V. ")).toBe("MAQUINADOS DEL NORTE S A DE C V");
  });

  it("parses DENUE location strings", () => {
    expect(parseLocation("Apodaca, Apodaca, Nuevo Leon")).toEqual({
      city: "Apodaca",
      municipality: "Apodaca",
      state: "Nuevo Leon"
    });
  });

  it("preserves commas inside parenthesized DENUE locality names", () => {
    expect(parseLocation("EL SAUZ (SAUZ ALTO, SAUZ BAJO), Pedro Escobedo, QUERÉTARO")).toEqual({
      city: "EL SAUZ (SAUZ ALTO, SAUZ BAJO)",
      municipality: "Pedro Escobedo",
      state: "QUERÉTARO"
    });
  });

  it("normalizes websites without schemes", () => {
    expect(normalizeWebsite("www.example.com")).toBe("https://www.example.com");
    expect(extractDomain("https://www.example.com/path")).toBe("example.com");
  });

  it("normalizes contact fields conservatively", () => {
    expect(normalizePhone("+52 (81) 8000-0000")).toBe("528180000000");
    expect(normalizeEmail(" VENTAS@EXAMPLE.COM ")).toBe("ventas@example.com");
    expect(normalizeEmail("not an email")).toBeNull();
  });

  it("detects manufacturing candidates from DENUE sector codes", () => {
    expect(isManufacturingActivity({ Sector_actividad_id: "33" })).toBe(true);
    expect(isManufacturingActivity({ SECTOR_ACTIVIDAD_ID: "33" })).toBe(true);
    expect(isManufacturingActivity({ codigo_act: "332710" })).toBe(true);
    expect(isManufacturingActivity({ Sector_actividad_id: "46" })).toBe(false);
  });

  it("maps raw DENUE records into canonical company fields", () => {
    const normalized = normalizeDenueRecord({
      Id: "123",
      Nombre: "MAQUINADOS DEL NORTE",
      Razon_social: "MAQUINADOS DEL NORTE SA DE CV",
      Clase_actividad: "Fabricacion de productos metalicos",
      Estrato: "11 a 30 personas",
      Ubicacion: "Apodaca, Apodaca, Nuevo Leon",
      Sitio_internet: "example.com",
      Longitud: "-100.1",
      Latitud: "25.7",
      Clase_actividad_id: "332710",
      Sector_actividad_id: "33"
    });

    expect(normalized).toMatchObject({
      sourceRecordId: "123",
      denueId: "123",
      tradeName: "MAQUINADOS DEL NORTE",
      legalName: "MAQUINADOS DEL NORTE SA DE CV",
      state: "Nuevo Leon",
      website: "https://example.com",
      websiteDomain: "example.com",
      isManufacturingCandidate: true
    });
  });

  it("maps bulk CSV-shaped DENUE records into canonical company fields", () => {
    const normalized = normalizeDenueRecord({
      id: "6979868",
      clee: "01001722519007241110000000U6",
      nom_estab: "21 DAYS DECORACION DE EVENTOS",
      codigo_act: "311812",
      nombre_act: "Panificación tradicional",
      per_ocu: "0 a 5 personas",
      tipo_vial: "CALLE",
      nom_vial: "NICOLAS BRAVO",
      numero_ext: "102",
      cod_postal: "20059",
      entidad: "Aguascalientes",
      municipio: "Aguascalientes",
      localidad: "Aguascalientes",
      telefono: "4493495674",
      correoelec: "",
      www: "",
      latitud: "21.8822425",
      longitud: "-102.30170644",
      tipoUniEco: "Fijo"
    });

    expect(normalized).toMatchObject({
      sourceRecordId: "6979868",
      denueId: "6979868",
      tradeName: "21 DAYS DECORACION DE EVENTOS",
      state: "Aguascalientes",
      industryCode: "311812",
      industryLabel: "Panificación tradicional",
      isManufacturingCandidate: true
    });
  });
});
