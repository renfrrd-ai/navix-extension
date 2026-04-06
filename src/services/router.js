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

    throw new Error(`Navix API error: ${res.status}`);
  }

  return res.json();
}

function normalizeInterpretResponse(data, rawQuery) {
  // Handle new API format (v1.0)
  const url = data.fullUrl || data.url || null;
  const platform = data.siteName || data.platform || "Web";
  const normalizedQuery =
    data.searchQuery || data.normalized_query || data.query || rawQuery;

  return {
    ...data,
    url,
    fullUrl: url,
    platform,
    siteName: platform,
    searchQuery: normalizedQuery,
    shortcut_used: Boolean(data.shortcut_used),
  };
}

/**
 * Calls the Navix interpret backend and normalizes the response for the app.
 */
export async function routeQuery(query) {
  const data = await navixRequest("/interpret", { query });

  return normalizeInterpretResponse(data, query);
}

/**
 * Creates or updates a backend shortcut config and returns the normalized result.
 */
export async function createShortcut(site) {
  const data = await navixRequest("/create-shortcut", {
    siteName: site.siteName,
    baseUrl: site.baseUrl,
  });

  const template =
    data.routing?.template ||
    data.template ||
    data.searchUrl ||
    data.shortcut?.template ||
    null;

  return {
    ...data,
    alias: data.shortcut?.alias || site.alias,
    platform: data.siteName || site.siteName,
    baseUrl: data.baseUrl || site.baseUrl,
    template,
    space_encoding: data.space_encoding || "+",
    slug_rules: data.slug_rules || data.slugRules || null,
    capabilities: data.capabilities || null,
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
