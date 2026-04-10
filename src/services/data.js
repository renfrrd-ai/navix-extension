import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { INDUSTRIES, THEMES } from "@/utils/themes";

// Sync data to Firestore every 6 hours (instead of 24)
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;
const STORAGE_KEY = "navix_data";
const SYNC_META_KEY = "navix_sync_meta";
const MAX_SHORTCUTS = 120;
const MAX_SAVED_LINKS = 300;
const MAX_TEXT = 120;
const HELP_HINT_PREFIX = "navix_help_hint_seen:";
const BLOCKED_PERSIST_KEYS = new Set([
  "location",
  "geolocation",
  "geo",
  "lat",
  "lng",
  "latitude",
  "longitude",
  "billing",
  "billingaddress",
  "billing_address",
  "payment",
  "paymentmethod",
  "payment_method",
  "card",
  "cardnumber",
  "card_number",
  "exp",
  "expiry",
  "cvv",
  "cvc",
  "iban",
  "bankaccount",
  "bank_account",
  "secret",
  "token",
]);
let firestoreMode = "unknown";
const VALID_THEME_IDS = new Set(THEMES.map((theme) => theme.id));
const VALID_INDUSTRY_IDS = new Set(INDUSTRIES.map((industry) => industry.id));
const VALID_FONT_IDS = new Set([
  "f-inter",
  "f-space",
  "f-dm",
  "f-syne",
  "f-mono",
]);

function sanitizeText(value, maxLen = MAX_TEXT) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLen);
}

function sanitizeUrl(value) {
  if (typeof value !== "string") return "";

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function sanitizeShortcut(item, index = 0) {
  if (!item || typeof item !== "object") return null;

  const id = sanitizeText(item.id || `c_${index}_${Date.now()}`, 48);
  const prefix = sanitizeText(item.prefix, 12)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
  const baseUrl = sanitizeUrl(item.baseUrl);
  const rawSearchUrl = sanitizeUrl(item.searchUrl);
  const searchUrl = /\{query\}|%s/i.test(rawSearchUrl)
    ? rawSearchUrl.replace(/%s/gi, "{query}")
    : "";
  const defaultUrl = sanitizeUrl(item.defaultUrl);
  const routeType =
    item.routeType === "search" || item.routeType === "open"
      ? item.routeType
      : searchUrl
        ? "search"
        : "open";

  if (!id || !prefix || !baseUrl) {
    return null;
  }

  return {
    id,
    name: sanitizeText(item.name, 64),
    icon: sanitizeText(item.icon, 32),
    prefix,
    bg: sanitizeText(item.bg, 24),
    ...(searchUrl ? { searchUrl } : {}),
    ...(defaultUrl ? { defaultUrl } : {}),
    routeType,
    baseUrl,
    ql: Boolean(item.ql),
    builtin: Boolean(item.builtin),
    emoji: sanitizeText(item.emoji, 8),
    logoUrl: sanitizeUrl(item.logoUrl),
    slugRules:
      item.slugRules && typeof item.slugRules === "object"
        ? {
            lowercase: Boolean(item.slugRules.lowercase),
            space_encoding: item.slugRules.space_encoding === "+" ? "+" : "%20",
          }
        : undefined,
    capabilities:
      item.capabilities && typeof item.capabilities === "object"
        ? item.capabilities
        : undefined,
    examples: Array.isArray(item.examples)
      ? item.examples
          .map((entry) => sanitizeText(entry, 140))
          .filter(Boolean)
          .slice(0, 8)
      : undefined,
  };
}

function sanitizeSavedLink(item) {
  if (!item || typeof item !== "object") return null;

  return {
    id: sanitizeText(item.id, 48),
    title: sanitizeText(item.title, 120),
    url: sanitizeUrl(item.url),
    notes: sanitizeText(item.notes, 300),
    createdAt: sanitizeText(item.createdAt, 40),
  };
}

function sanitizeUserPatch(input = {}) {
  const patch = {};

  const hasBlockedKey = Object.keys(input || {}).some((key) =>
    BLOCKED_PERSIST_KEYS.has(normalizeId(key).replace(/[^a-z0-9_]/g, "")),
  );

  if (hasBlockedKey && import.meta.env.DEV) {
    console.warn(
      "[Navix Privacy] Ignored location/billing/sensitive fields in persisted patch.",
    );
  }

  if (typeof input.name === "string") patch.name = sanitizeText(input.name, 64);
  if (typeof input.username === "string") {
    patch.username = sanitizeText(input.username, 40)
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "");
  }
  if (typeof input.industry === "string") {
    const normalizedIndustry = normalizeId(input.industry);
    if (VALID_INDUSTRY_IDS.has(normalizedIndustry)) {
      patch.industry = normalizedIndustry;
    }
  }
  if (typeof input.theme === "string") {
    const normalizedTheme = normalizeId(input.theme);
    if (VALID_THEME_IDS.has(normalizedTheme)) {
      patch.theme = normalizedTheme;
    }
  }
  if (typeof input.font === "string") {
    const normalizedFont = normalizeId(input.font);
    if (VALID_FONT_IDS.has(normalizedFont)) {
      patch.font = normalizedFont;
    }
  }
  if (typeof input.devMode === "boolean") patch.devMode = input.devMode;

  if (Array.isArray(input.shortcuts)) {
    patch.shortcuts = input.shortcuts
      .slice(0, MAX_SHORTCUTS)
      .map((site, index) => sanitizeShortcut(site, index))
      .filter(Boolean);
  }

  if (Array.isArray(input.savedLinks)) {
    patch.savedLinks = input.savedLinks
      .slice(0, MAX_SAVED_LINKS)
      .map((link) => sanitizeSavedLink(link))
      .filter((link) => link && link.url);
  }

  if (typeof input.createdAt === "string") {
    patch.createdAt = sanitizeText(input.createdAt, 40);
  }

  return patch;
}

function sanitizeUserDoc(input = {}, user = {}) {
  const defaults = defaultUserDoc(user);
  const safePatch = sanitizeUserPatch(input);
  return {
    ...defaults,
    ...safePatch,
    tier: defaults.tier,
    // Keep user email in auth state only; avoid persisting it locally/remotely.
    email: "",
  };
}

function isPermissionDenied(err) {
  return (
    err?.code === "permission-denied" ||
    err?.code === "firestore/permission-denied"
  );
}

function normalizeId(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeUserDoc(user = {}, remoteData = {}) {
  return sanitizeUserDoc(remoteData, user);
}

function mergeWithDirtyLocalData(user, remoteData, localData, hasChanges) {
  if (!hasChanges || !localData) return remoteData;

  const mergedShortcuts = Array.isArray(localData.shortcuts)
    ? localData.shortcuts
    : remoteData.shortcuts;
  const mergedSavedLinks = Array.isArray(localData.savedLinks)
    ? localData.savedLinks
    : remoteData.savedLinks;

  return normalizeUserDoc(user, {
    ...remoteData,
    ...localData,
    shortcuts: mergedShortcuts,
    savedLinks: mergedSavedLinks,
  });
}

function setLocalOnlyMode() {
  firestoreMode = "denied";

  const meta = readSyncMeta();
  writeSyncMeta({ ...meta, hasChanges: false, remoteDisabled: true });
}

async function writeRemoteUserDoc(uid, data) {
  const payload = sanitizeUserDoc(data, {});
  const { email, ...safePayload } = payload;
  await setDoc(
    doc(db, "users", uid),
    { ...safePayload, lastSync: serverTimestamp() },
    { merge: true },
  );
}

// ── Local storage helpers ─────────────────────────────────────────
function readLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocal(data) {
  const sanitized = sanitizeUserDoc(data);
  if (typeof data?._uid === "string") {
    sanitized._uid = sanitizeText(data._uid, 128);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
}

function readSyncMeta() {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    return raw
      ? JSON.parse(raw)
      : { lastSync: 0, hasChanges: false, remoteDisabled: false };
  } catch {
    return { lastSync: 0, hasChanges: false, remoteDisabled: false };
  }
}

function writeSyncMeta(meta) {
  localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
}

// ── Default user document ─────────────────────────────────────────
export function defaultUserDoc(user = {}) {
  return {
    name: sanitizeText(user.displayName || "", 64),
    username: "",
    email: "",
    industry: "general",
    tier: "free",
    shortcuts: [],
    savedLinks: [],
    theme: "t-midnight",
    font: "f-inter",
    devMode: false,
    createdAt: new Date().toISOString(),
  };
}

// ── Load user data (Firestore on first login, local otherwise) ────
export async function loadUserData(user) {
  if (!user) return null;

  const local = readLocal();
  const localForUser = local && local._uid === user.uid ? local : null;
  const syncMeta = readSyncMeta();

  if (localForUser) {
    const normalizedLocal = {
      ...normalizeUserDoc(user, localForUser),
      _uid: user.uid,
    };
    writeLocal(normalizedLocal);
    return normalizedLocal;
  }

  if (firestoreMode === "denied") {
    const fallback = {
      ...defaultUserDoc(user),
      _uid: user.uid,
    };
    writeLocal(fallback);
    writeSyncMeta({
      ...readSyncMeta(),
      hasChanges: false,
      remoteDisabled: true,
    });
    return fallback;
  }

  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    let userData;
    if (!snap.exists()) {
      userData = defaultUserDoc(user);
      await writeRemoteUserDoc(user.uid, userData);
    } else {
      const remoteData = normalizeUserDoc(user, snap.data());
      userData = mergeWithDirtyLocalData(
        user,
        remoteData,
        null,
        syncMeta.hasChanges,
      );
    }

    const merged = { ...userData, _uid: user.uid };
    firestoreMode = "available";
    writeLocal(merged);
    if (!snap.exists()) {
      writeSyncMeta({
        lastSync: Date.now(),
        hasChanges: false,
        remoteDisabled: false,
      });
    } else {
      writeSyncMeta({
        ...syncMeta,
        remoteDisabled: false,
      });
    }
    return merged;
  } catch (err) {
    if (isPermissionDenied(err)) {
      setLocalOnlyMode();
    }

    const fallback = {
      ...defaultUserDoc(user),
      _uid: user.uid,
    };
    writeLocal(fallback);
    writeSyncMeta({ ...readSyncMeta(), hasChanges: false });
    return fallback;
  }
}

// ── Get local data ────────────────────────────────────────────────
export function getUserData() {
  return readLocal();
}

// ── Update local data (and mark dirty for sync) ───────────────────
export function updateLocalData(patch) {
  const current = readLocal() || defaultUserDoc();
  const safePatch = sanitizeUserPatch(patch || {});
  const updated = sanitizeUserDoc({ ...current, ...safePatch });
  if (typeof current?._uid === "string" && current._uid) {
    updated._uid = current._uid;
  }
  writeLocal(updated);
  writeSyncMeta({ ...readSyncMeta(), hasChanges: true });
  return updated;
}

// ── Sync to Firestore (when dirty) ────────────────────────────────
export async function syncToFirestore(uid) {
  if (!uid) return false;

  const meta = readSyncMeta();
  if (firestoreMode === "denied" || meta.remoteDisabled) return false;
  if (!meta.hasChanges) return false;
  if (meta.lastSync && Date.now() - meta.lastSync < SYNC_INTERVAL_MS)
    return false;

  const data = readLocal();
  if (!data) return false;

  try {
    await writeRemoteUserDoc(uid, data);
    firestoreMode = "available";
    writeSyncMeta({
      lastSync: Date.now(),
      hasChanges: false,
      remoteDisabled: false,
    });
    return true;
  } catch (err) {
    if (isPermissionDenied(err)) {
      setLocalOnlyMode();
    }
    return false;
  }
}

// ── Force sync (user-triggered) ───────────────────────────────────
export async function forceSyncToFirestore(uid) {
  if (!uid) return false;
  const meta = readSyncMeta();
  if (firestoreMode === "denied" || meta.remoteDisabled) return false;
  const data = readLocal();
  if (!data) return false;
  try {
    await writeRemoteUserDoc(uid, data);
    firestoreMode = "available";
    writeSyncMeta({
      lastSync: Date.now(),
      hasChanges: false,
      remoteDisabled: false,
    });
    return true;
  } catch (err) {
    if (isPermissionDenied(err)) {
      setLocalOnlyMode();
    }
    return false;
  }
}

// ── Clear local data (on sign out) ───────────────────────────────
export function clearLocalData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SYNC_META_KEY);
}

export function resetPrivacyLocalData() {
  clearLocalData();
  localStorage.removeItem("navix_history");

  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith(HELP_HINT_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
}

export function getPrivacyDiagnostics(activeUid = "") {
  const local = readLocal() || {};
  const syncMeta = readSyncMeta();

  return {
    storage: {
      keys: [
        STORAGE_KEY,
        SYNC_META_KEY,
        "navix_history",
        "navix_help_hint_seen:*",
      ],
      localUserBound: Boolean(local._uid),
      localMatchesActiveUser: Boolean(activeUid) && local._uid === activeUid,
      hasHistory: Boolean(localStorage.getItem("navix_history")),
      helpHintFlags: Array.from({ length: localStorage.length })
        .map((_, index) => localStorage.key(index))
        .filter((key) => key && key.startsWith(HELP_HINT_PREFIX)).length,
    },
    sync: {
      remoteMode: firestoreMode,
      hasChanges: Boolean(syncMeta.hasChanges),
      remoteDisabled: Boolean(syncMeta.remoteDisabled),
      lastSync: syncMeta.lastSync || 0,
    },
    dataShape: {
      name: Boolean(local.name),
      username: Boolean(local.username),
      emailPersisted: Boolean(local.email),
      industry: Boolean(local.industry),
      shortcutsCount: Array.isArray(local.shortcuts)
        ? local.shortcuts.length
        : 0,
      savedLinksCount: Array.isArray(local.savedLinks)
        ? local.savedLinks.length
        : 0,
      theme: Boolean(local.theme),
      font: Boolean(local.font),
      devMode: typeof local.devMode === "boolean",
    },
    policy: {
      locationPersistence: "blocked",
      billingPersistence: "blocked",
      paymentCardPersistence: "blocked",
    },
  };
}
