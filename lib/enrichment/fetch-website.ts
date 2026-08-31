export type WebsiteFetchResult =
  | {
      ok: true;
      finalUrl: string;
      html: string;
    }
  | {
      ok: false;
      finalUrl?: string;
      reason: string;
    };

type WebsiteFetchFailure = Extract<WebsiteFetchResult, { ok: false }>;

const maxHtmlCharacters = 500_000;

export function normalizeFetchUrl(value: string) {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function fetchUrlVariants(value: string) {
  const variants = new Set<string>();
  const normalized = normalizeFetchUrl(value);
  variants.add(normalized);

  const parsed = new URL(normalized);
  if (parsed.hostname.toLowerCase().startsWith("www.")) {
    const withoutWww = new URL(parsed);
    withoutWww.hostname = parsed.hostname.slice(4);
    variants.add(withoutWww.toString());
  }

  for (const variant of [...variants]) {
    const parsedVariant = new URL(variant);
    if (parsedVariant.protocol === "https:") {
      parsedVariant.protocol = "http:";
      variants.add(parsedVariant.toString());
    }
  }

  return [...variants];
}

function originFor(value: string) {
  return new URL(normalizeFetchUrl(value)).origin;
}

export function disallowsRootForAllAgents(robotsText: string) {
  const lines = robotsText
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*/, "").trim())
    .filter(Boolean);

  let appliesToAllAgents = false;
  for (const line of lines) {
    const [rawKey, ...rawValue] = line.split(":");
    const key = rawKey?.trim().toLowerCase();
    const value = rawValue.join(":").trim().toLowerCase();

    if (key === "user-agent") {
      appliesToAllAgents = value === "*";
      continue;
    }

    if (appliesToAllAgents && key === "disallow" && value === "/") {
      return true;
    }
  }

  return false;
}

async function isFetchAllowedByRobots(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${originFor(url)}/robots.txt`, {
      headers: { "user-agent": "MexicoSupplierIntelligenceBot/0.1" },
      signal: controller.signal
    });
    if (!response.ok) {
      return true;
    }
    const robotsText = await response.text();
    return !disallowsRootForAllAgents(robotsText);
  } catch {
    return true;
  } finally {
    clearTimeout(timeout);
  }
}

function fetchErrorReason(error: unknown) {
  if (!(error instanceof Error)) {
    return "website fetch failed";
  }
  const cause = error.cause;
  if (cause && typeof cause === "object") {
    const code = "code" in cause && typeof cause.code === "string" ? cause.code : undefined;
    const reason = "reason" in cause && typeof cause.reason === "string" ? cause.reason : undefined;
    const message = "message" in cause && typeof cause.message === "string" ? cause.message : undefined;
    return [code, reason || message || error.message].filter(Boolean).join(": ");
  }
  return error.message;
}

async function fetchSingleHomepage(finalUrl: string, timeoutMs: number): Promise<WebsiteFetchResult> {
  const allowed = await isFetchAllowedByRobots(finalUrl, Math.min(timeoutMs, 3_000));
  if (!allowed) {
    return { ok: false, finalUrl, reason: "robots.txt disallows root path for all agents" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(finalUrl, {
      headers: { "user-agent": "MexicoSupplierIntelligenceBot/0.1" },
      redirect: "follow",
      signal: controller.signal
    });

    if (!response.ok) {
      return { ok: false, finalUrl: response.url || finalUrl, reason: `HTTP ${response.status}` };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("text/html")) {
      return { ok: false, finalUrl: response.url || finalUrl, reason: `unsupported content type ${contentType || "unknown"}` };
    }

    const html = (await response.text()).slice(0, maxHtmlCharacters);
    return { ok: true, finalUrl: response.url || finalUrl, html };
  } catch (error) {
    return { ok: false, finalUrl, reason: fetchErrorReason(error) };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchWebsiteHomepage(url: string, timeoutMs = 10_000): Promise<WebsiteFetchResult> {
  const failures: WebsiteFetchFailure[] = [];

  for (const finalUrl of fetchUrlVariants(url)) {
    const result = await fetchSingleHomepage(finalUrl, timeoutMs);
    if (result.ok) {
      return result;
    }
    failures.push(result);
  }

  return {
    ok: false,
    finalUrl: failures[0]?.finalUrl ?? normalizeFetchUrl(url),
    reason: failures.map((failure) => `${failure.finalUrl}: ${failure.reason}`).join("; ")
  };
}
