import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { INDUSTRIES, THEMES } from "@/utils/themes";

// Sync data to Firestore every 6 hours (instead of 24)
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;
const STORAGE_KEY = "navix_data";
const SYNC_META_KEY = "navix_sync_meta";
let firestoreMode = "unknown";
const VALID_THEME_IDS = new Set(THEMES.map((theme) => theme.id));
const VALID_INDUSTRY_IDS = new Set(INDUSTRIES.map((industry) => industry.id));

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
  const defaults = defaultUserDoc(user);
  const normalizedTheme = normalizeId(remoteData.theme);
  const normalizedIndustry = normalizeId(remoteData.industry);

  return {
    ...defaults,
    ...remoteData,
    theme: VALID_THEME_IDS.has(normalizedTheme)
      ? normalizedTheme
      : defaults.theme,
    industry: VALID_INDUSTRY_IDS.has(normalizedIndustry)
      ? normalizedIndustry
      : defaults.industry,
    tier: defaults.tier,
  };
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
  const { _uid, ...payload } = data;
  await setDoc(
    doc(db, "users", uid),
    { ...payload, lastSync: serverTimestamp() },
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
    name: user.displayName || "",
    username: "",
    email: user.email || "",
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
  const current = readLocal() || {};
  const updated = { ...current, ...patch };
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
