export type DuplicateClusterRow = {
  pattern: "normalized_name" | "normalized_phone" | "website_domain";
  value: string;
  count: number;
  states: string[];
  cities: string[];
  postalCodes: string[];
  industryCodes: string[];
  websiteDomains: string[];
  employeeSizeBands: string[];
  contactableCount: number;
  qualifiedCount: number;
};

export type DuplicateClusterCategory = "branch_or_network" | "low_priority_noise" | "possible_duplicate_review";

export type DuplicateClusterAssessment = DuplicateClusterRow & {
  category: DuplicateClusterCategory;
  rationale: string;
};

const genericNameTerms = new Set([
  "ABARROTES",
  "ACERRADERO",
  "ASERRADERO",
  "ALFARERIA",
  "BODEGA",
  "BODEGAS",
  "CARPINTERIA",
  "HERRERIA",
  "LAVANDERIA",
  "MOLINO",
  "PANADERIA",
  "PURIFICADORA",
  "TALLER",
  "TORTILLERIA"
]);

function tokenCount(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

function hasMultipleLocations(cluster: DuplicateClusterRow) {
  return cluster.states.length > 1 || cluster.cities.length > 1 || cluster.postalCodes.length > 1;
}

export function isGenericEstablishmentName(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  return tokenCount(normalized) <= 2 && [...genericNameTerms].some((term) => normalized.includes(term));
}

export function assessDuplicateCluster(cluster: DuplicateClusterRow): DuplicateClusterAssessment {
  if (cluster.pattern === "normalized_name" && isGenericEstablishmentName(cluster.value)) {
    return {
      ...cluster,
      category: "low_priority_noise",
      rationale: "Generic establishment name; repeated values are weak duplicate evidence and should be down-ranked for enrichment."
    };
  }

  if (cluster.qualifiedCount === 0) {
    return {
      ...cluster,
      category: "low_priority_noise",
      rationale: "Cluster has no rows that pass the qualified-candidate rule, so it should stay out of the enrichment queue."
    };
  }

  if (cluster.pattern === "website_domain" && hasMultipleLocations(cluster)) {
    return {
      ...cluster,
      category: "branch_or_network",
      rationale: "Shared domain across multiple locations is more consistent with branches, plants, or a company network than duplicate rows."
    };
  }

  if (cluster.pattern === "normalized_name" && cluster.count >= 3 && hasMultipleLocations(cluster)) {
    return {
      ...cluster,
      category: "branch_or_network",
      rationale: "Repeated official establishment name across distinct locations should be treated as separate establishments until stronger duplicate evidence exists."
    };
  }

  return {
    ...cluster,
    category: "possible_duplicate_review",
    rationale: "Cluster has repeated identity/contact signals and should be reviewed before any merge or suppression logic."
  };
}

export function assessDuplicateClusters(clusters: DuplicateClusterRow[]) {
  return clusters.map(assessDuplicateCluster);
}
