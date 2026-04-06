import {
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth/web-extension";
import { getAuth } from "firebase/auth/web-extension";
import { app } from "./firebase";

const EXTENSION_GOOGLE_SCOPES = ["openid", "email", "profile"];

function getAuthInstance() {
  return getAuth(app);
}

function getExtensionGoogleClientId() {
  return import.meta.env.VITE_EXTENSION_GOOGLE_CLIENT_ID || "";
}

function parseRedirectFragment(redirectUrl) {
  const hash = redirectUrl.split("#")[1] || "";
  const params = new URLSearchParams(hash);
  return {
    accessToken: params.get("access_token") || "",
    error: params.get("error") || "",
    errorDescription: params.get("error_description") || "",
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

  const redirectUri = chrome.identity.getRedirectURL("firebase");
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "token");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", EXTENSION_GOOGLE_SCOPES.join(" "));
  authUrl.searchParams.set("prompt", "select_account");

  const responseUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl.toString(),
    interactive: true,
  });

  if (!responseUrl) {
    const error = new Error("Google sign-in was cancelled.");
    error.code = "auth/popup-closed-by-user";
    throw error;
  }

  const { accessToken, error, errorDescription } =
    parseRedirectFragment(responseUrl);

  if (error) {
    const authError = new Error(errorDescription || error);
    authError.code = `auth/${error}`;
    throw authError;
  }

  if (!accessToken) {
    const authError = new Error(
      "Google sign-in did not return an access token.",
    );
    authError.code = "auth/internal-error";
    throw authError;
  }

  const credential = GoogleAuthProvider.credential(null, accessToken);
  const result = await signInWithCredential(getAuthInstance(), credential);
  return result.user;
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
