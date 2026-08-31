import { env } from "@/lib/config";
import type { DenueRawRecord } from "@/lib/denue/types";

export type DenueFetchOptions = {
  state: string;
  municipality?: string;
  condition?: string;
  from: number;
  to: number;
  economicSector?: string;
  economicSubsector?: string;
  economicBranch?: string;
  economicClass?: string;
  establishmentCode?: string;
  stratum?: string;
};

export function buildDenueAreaActivityUrl(options: DenueFetchOptions, token: string) {
  const condition = options.condition ?? "0";
  const path = [
    "BuscarAreaActEstr",
    options.state,
    options.municipality ?? "0",
    "0",
    "0",
    "0",
    options.economicSector ?? "31",
    options.economicSubsector ?? "0",
    options.economicBranch ?? "0",
    options.economicClass ?? "0",
    encodeURIComponent(condition),
    String(options.from),
    String(options.to),
    options.establishmentCode ?? "0",
    options.stratum ?? "0",
    token
  ];
  return `${env.DENUE_API_BASE_URL}/${path.join("/")}`;
}

function requireToken(token?: string) {
  const resolved = token ?? env.DENUE_API_TOKEN;
  if (!resolved) {
    throw new Error("DENUE_API_TOKEN is required for live DENUE ingestion.");
  }
  return resolved;
}

export async function fetchDenueAreaActivity(options: DenueFetchOptions, token?: string): Promise<DenueRawRecord[]> {
  const resolvedToken = requireToken(token);
  const url = buildDenueAreaActivityUrl(options, resolvedToken);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`DENUE request failed with ${response.status}: ${await response.text()}`);
  }

  return response.json() as Promise<DenueRawRecord[]>;
}
