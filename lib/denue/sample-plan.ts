export const denueStateSamples = [
  { code: "19", name: "Nuevo Leon" },
  { code: "05", name: "Coahuila" },
  { code: "28", name: "Tamaulipas" },
  { code: "08", name: "Chihuahua" },
  { code: "02", name: "Baja California" },
  { code: "11", name: "Guanajuato" },
  { code: "22", name: "Queretaro" },
  { code: "14", name: "Jalisco" },
  { code: "24", name: "San Luis Potosi" },
  { code: "15", name: "Estado de Mexico" }
];

export const denueManufacturingSectors = ["31", "32", "33"];

export type DenueSampleRequest = {
  states?: string[];
  sectors?: string[];
  limit: number;
  pageSize: number;
};

export type DenueSampleBatch = {
  state: string;
  sector: string;
  from: number;
  to: number;
};

export function buildDenueSamplePlan({
  states = denueStateSamples.map((state) => state.code),
  sectors = denueManufacturingSectors,
  limit,
  pageSize
}: DenueSampleRequest): DenueSampleBatch[] {
  if (limit < 1) {
    throw new Error("Sample limit must be at least 1.");
  }
  if (pageSize < 1) {
    throw new Error("Page size must be at least 1.");
  }

  const pairCount = states.length * sectors.length;
  const recordsPerPair = Math.max(1, Math.ceil(limit / pairCount));
  const batches: DenueSampleBatch[] = [];

  for (const state of states) {
    for (const sector of sectors) {
      for (let from = 1; from <= recordsPerPair; from += pageSize) {
        const to = Math.min(from + pageSize - 1, recordsPerPair);
        batches.push({ state, sector, from, to });
      }
    }
  }

  return batches;
}
