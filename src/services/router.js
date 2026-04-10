import { getAuth } from "firebase/auth";
import { app } from "./firebase";

const NAVIX_PROXY_BASE = (import.meta.env.VITE_NAVIX_PROXY_URL || "").trim();

if (!NAVIX_PROXY_BASE) {
  console.warn(
    "[Navix Router] Missing VITE_NAVIX_PROXY_URL - AI routing will not work.",
  );
}

function isAllowedProxyUrl(value) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "https:") return true;
    return (
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

async function getAuthToken() {
  try {
    const auth = getAuth(app);
    const user = auth.currentUser;

    if (user) {
      return await user.getIdToken();
    }
  } catch (err) {
    console.warn("[Auth Token Error]", err.message);
  }

  return null;
}

function buildHeaders(token) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

async function navixRequest(path, body) {
  if (!NAVIX_PROXY_BASE) {
    throw new Error("Missing VITE_NAVIX_PROXY_URL for Navix API proxy.");
  }

  if (!isAllowedProxyUrl(NAVIX_PROXY_BASE)) {
    throw new Error(
      "Invalid VITE_NAVIX_PROXY_URL. Use HTTPS (or localhost for dev).",
    );
  }

  const token = await getAuthToken();
  const headers = buildHeaders(token);

  const res = await fetch(`${NAVIX_PROXY_BASE}${path}`, {
    method: "POST",
    headers,
    cache: "no-store",
    credentials: "omit",
    referrerPolicy: "no-referrer",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // Handle rate limit error specifically
    if (res.status === 429) {
      const data = await res.json();
      const err = new Error(data.message || "Rate limit exceeded");
      err.code = data.code || "RATE_LIMIT_EXCEEDED";
      err.status = 429;
      err.retryAfter = data.retryAfter;
      throw err;
    }

    let message = `Navix API error: ${res.status}`;
    try {
      const payload = await res.json();
      if (typeof payload?.message === "string" && payload.message.trim()) {
        message = payload.message;
      }
    } catch {
      // Ignore non-JSON error bodies and keep status-based message.
    }

    throw new Error(message);
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
  const data = await navixRequest("/route", { query });

  return normalizeInterpretResponse(data, query);
}

/**
 * Deep research mode for finding the exact best resource URL.
 */
export async function researchQuery(query) {
  const data = await navixRequest("/research", { query });

  return normalizeInterpretResponse(data, query);
}

/**
 * Analyze a platform and return route definition metadata.
 */
export async function createRouteDefinition(site) {
  const data = await navixRequest("/create-route", {
    name: site.name,
    baseUrl: site.baseUrl,
  });

  const template =
    data.template ||
    data.searchUrl ||
    data.search_url ||
    data.queryTemplate ||
    "";
  const slugRules = data.slugRules || data.slug_rules || null;
  const routeType =
    data.routeType || data.route_type || (template ? "search" : "open");

  return {
    ...data,
    alias: data.prefix || site.alias || "",
    platform: data.siteName || site.name,
    baseUrl: data.baseUrl || site.baseUrl,
    template,
    routeType,
    defaultUrl: data.defaultUrl || data.baseUrl || site.baseUrl,
    slugRules,
    capabilities: data.capabilities || {},
    examples: Array.isArray(data.examples) ? data.examples : [],
    explanation: data.explanation || "",
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
