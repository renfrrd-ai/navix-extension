import {
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth/web-extension";
import { getAuth } from "firebase/auth/web-extension";
import { app } from "./firebase";

const EXTENSION_GOOGLE_SCOPES = ["openid", "email", "profile"];
let storedState = null;
let storedCodeVerifier = null;

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

function generateRandomState() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode.apply(null, new Uint8Array(hashBuffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function getAuthInstance() {
  return getAuth(app);
}

function getExtensionGoogleClientId() {
  return import.meta.env.VITE_EXTENSION_GOOGLE_CLIENT_ID || "";
}

function parseRedirectFragment(redirectUrl) {
  const hash = redirectUrl.split("#")[1] || "";
  const query = redirectUrl.split("?")[1] || "";
  const allParams = new URLSearchParams(hash || query);
  return {
    code: allParams.get("code") || "",
    state: allParams.get("state") || "",
    error: allParams.get("error") || "",
    errorDescription: allParams.get("error_description") || "",
  };
}

async function signInWithChromeIdentity() {
  const clientId = getExtensionGoogleClientId();

  if (!clientId) {
    const error = new Error(
      "Missing VITE_EXTENSION_GOOGLE_CLIENT_ID for Chrome extension Google sign-in.",
    );
    error.code = "auth/missing-client-id";
    throw error;
  }

  if (!globalThis.chrome?.identity?.launchWebAuthFlow) {
    const error = new Error(
      "Chrome identity API is unavailable in this environment.",
    );
    error.code = "auth/operation-not-supported-in-this-environment";
    throw error;
  }

  // Generate state and PKCE parameters
  storedState = generateRandomState();
  storedCodeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(storedCodeVerifier);

  const redirectUri = chrome.identity.getRedirectURL("firebase");
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", EXTENSION_GOOGLE_SCOPES.join(" "));
  authUrl.searchParams.set("state", storedState);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("prompt", "select_account");

  const responseUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl.toString(),
    interactive: true,
  });

  if (!responseUrl) {
    storedState = null;
    storedCodeVerifier = null;
    const error = new Error("Google sign-in was cancelled.");
    error.code = "auth/popup-closed-by-user";
    throw error;
  }

  const { code, state, error, errorDescription } =
    parseRedirectFragment(responseUrl);

  // Verify state parameter for CSRF protection
  if (!state || state !== storedState) {
    storedState = null;
    storedCodeVerifier = null;
    const csrfError = new Error(
      "State parameter mismatch - possible CSRF attack detected.",
    );
    csrfError.code = "auth/csrf-token-mismatch";
    throw csrfError;
  }

  if (error) {
    storedState = null;
    storedCodeVerifier = null;
    const authError = new Error(errorDescription || error);
    authError.code = `auth/${error}`;
    throw authError;
  }

  if (!code) {
    storedState = null;
    storedCodeVerifier = null;
    const authError = new Error(
      "Google sign-in did not return an authorization code.",
    );
    authError.code = "auth/internal-error";
    throw authError;
  }

  // Exchange authorization code for access token via backend
  try {
    const tokenResponse = await exchangeCodeForToken(
      code,
      storedCodeVerifier,
      redirectUri,
    );
    storedState = null;
    storedCodeVerifier = null;

    if (!tokenResponse.accessToken) {
      throw new Error("No access token received from backend");
    }

    const credential = GoogleAuthProvider.credential(
      null,
      tokenResponse.accessToken,
    );
    const result = await signInWithCredential(getAuthInstance(), credential);
    return result.user;
  } catch (err) {
    storedState = null;
    storedCodeVerifier = null;
    console.error("[Token Exchange Error]", err.message);
    throw err;
  }
}

async function exchangeCodeForToken(code, codeVerifier, redirectUri) {
  const baseUrl = import.meta.env.VITE_NAVIX_PROXY_URL || "";

  if (!baseUrl) {
    throw new Error("Missing token exchange endpoint configuration");
  }

  if (!isAllowedProxyUrl(baseUrl)) {
    throw new Error(
      "Invalid token exchange endpoint. Use HTTPS (or localhost for dev).",
    );
  }

  const tokenExchangeUrl = `${baseUrl.replace(/\/$/, "")}/exchangeAuthCode`;

  const response = await fetch(tokenExchangeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    credentials: "omit",
    referrerPolicy: "no-referrer",
    body: JSON.stringify({
      code,
      codeVerifier,
      redirectUri,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Token exchange failed: ${response.statusText}`,
    );
  }

  return response.json();
}

export async function signInWithGoogle() {
  return signInWithChromeIdentity();
}

export async function signOut() {
  await getAuthInstance().signOut();
}

export function onAuthChange(callback) {
  return getAuthInstance().onAuthStateChanged(callback);
}
