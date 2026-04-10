// Previous Firebase Functions proxy backend (disabled for now per request):
// const NAVIX_PROXY_BASE = (import.meta.env.VITE_NAVIX_PROXY_URL || "")
//   .trim()
//   .replace(/\/+$/, "");

const INTENT_ROUTER_INTERPRET_URL =
  "https://intent-router.abacusai.app/api/interpret";
const REQUEST_TIMEOUT_MS = 12000;

function buildHeaders() {
  return {
    "Content-Type": "application/json",
  };
}

function stringifyApiMessage(value, fallback = "Navix API error") {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }

  if (value && typeof value === "object") {
    if (typeof value.message === "string" && value.message.trim()) {
      return value.message.trim();
    }
    if (typeof value.error === "string" && value.error.trim()) {
      return value.error.trim();
    }

    try {
      const serialized = JSON.stringify(value);
      if (serialized && serialized !== "{}") return serialized;
    } catch {
      // Ignore serialization failures and use fallback.
    }
  }

  return fallback;
}

function makeTimeoutSignal(timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timer),
  };
}

async function intentRouterRequest(body) {
  const headers = buildHeaders();
  const { signal, cleanup } = makeTimeoutSignal();

  let res;
  try {
    res = await fetch(INTENT_ROUTER_INTERPRET_URL, {
      method: "POST",
      headers,
      cache: "no-store",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal,
      body: JSON.stringify(body),
    });
  } catch (err) {
    if (err?.name === "AbortError") {
      const timeoutErr = new Error("Intent router request timed out");
      timeoutErr.code = "REQUEST_TIMEOUT";
      timeoutErr.status = 0;
      throw timeoutErr;
    }

    const networkErr = new Error(err?.message || "Intent router network error");
    networkErr.code = "NETWORK_ERROR";
    networkErr.status = 0;
    throw networkErr;
  } finally {
    cleanup();
  }

  if (!res.ok) {
    let message = `Intent router error: ${res.status}`;
    let errorCode = "INTENT_ROUTER_ERROR";
    let errorRetryAfter;

    try {
      const payload = await res.json();
      message = stringifyApiMessage(payload?.message ?? payload, message);
      if (typeof payload?.code === "string" && payload.code.trim()) {
        errorCode = payload.code;
      }
      if (payload?.retryAfter != null) {
        errorRetryAfter = payload.retryAfter;
      }
    } catch {
      // Ignore non-JSON error bodies and keep status-based message.
    }

    const err = new Error(message);
    err.status = res.status;
    err.code = errorCode;
    err.retryAfter = errorRetryAfter;
    throw err;
  }

  return res.json();
}

function unwrapPayload(data) {
  if (!data || typeof data !== "object") return {};

  if (data.data && typeof data.data === "object") return data.data;
  if (data.result && typeof data.result === "object") return data.result;

  return data;
}

function resolveUrl(data) {
  const candidates = [
    data.fullUrl,
    data.url,
    data.targetUrl,
    data.destinationUrl,
    data.redirectUrl,
    data.link,
    data.full_url,
    data.target_url,
    data.destination_url,
  ];

  return (
    candidates.find((value) => typeof value === "string" && value.trim()) ||
    null
  );
}

function normalizeInterpretResponse(data, rawQuery) {
  const payload = unwrapPayload(data);
  const url = resolveUrl(payload);
  const domain = payload.domain || "";
  const platform =
    payload.siteName ||
    payload.platform ||
    (typeof domain === "string" && domain
      ? domain.replace(/^www\./i, "").split(".")[0]
      : "Web");
  const normalizedQuery =
    payload.searchQuery ||
    payload.normalized_query ||
    payload.query ||
    rawQuery;

  return {
    ...payload,
    url,
    fullUrl: url,
    platform,
    siteName: platform,
    domain,
    reasoning: payload.reasoning || "",
    title: payload.title || "",
    description: payload.description || "",
    relevanceScore: Number.isFinite(payload.relevanceScore)
      ? payload.relevanceScore
      : null,
    searchQuery: normalizedQuery,
    shortcut_used: Boolean(payload.shortcut_used),
  };
}

/**
 * Fast AI route to the best destination URL.
 */
export async function routeQuery(query) {
  const data = await intentRouterRequest({ query });

  return normalizeInterpretResponse(data, query);
}

/**
 * Deep research mode for finding the exact best resource URL.
 */
export async function researchQuery(query) {
  const data = await intentRouterRequest({ query });

  return normalizeInterpretResponse(data, query);
}

/**
 * Analyze a platform and return route definition metadata.
 */
export async function createRouteDefinition(site) {
  return {
    alias: site.alias || "",
    platform: site.name,
    siteName: site.name,
    baseUrl: site.baseUrl,
    template: "",
    routeType: "open",
    defaultUrl: site.baseUrl,
    slugRules: null,
    capabilities: { open: true, search: false },
    examples: [],
    explanation:
      "Route template generation is disabled while direct interpret mode is enabled.",
  };
}

/**
 * Extracts a clean search URL pattern from a fully-resolved URL
 * by replacing the encoded search term with {query}.
 */
export function extractSearchPattern(fullUrl, searchQuery) {
  if (!fullUrl || !searchQuery) return null;
  const encoded = encodeURIComponent(searchQuery.trim());
  if (fullUrl.includes(encoded)) {
    return fullUrl.replace(encoded, "{query}");
  }
  return null;
}
