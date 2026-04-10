import { create } from "zustand";
import { updateLocalData, clearLocalData } from "@/services/data";
import { buildSitesForIndustry } from "@/utils/sites";

const HISTORY_KEY = "navix_history";
const HISTORY_LIMIT = 30;

function clampText(value, maxLen = 220) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLen);
}

function looksSensitive(text = "") {
  const value = String(text).toLowerCase();
  return (
    /\b(password|passcode|api[_-]?key|secret|private[_-]?key|bearer|jwt|token|otp|2fa)\b/.test(
      value,
    ) ||
    /-----begin [a-z ]*private key-----/i.test(text) ||
    /(?:^|\s)(?:sk|ghp|xoxb|xoxp|eyj)[a-z0-9._-]{16,}/i.test(text)
  );
}

function sanitizeHistoryEntry(entry = {}) {
  const raw = clampText(entry.raw, 240);
  if (!raw || looksSensitive(raw)) return null;

  return {
    raw,
    query: clampText(entry.query || raw, 220),
    name: clampText(entry.name || "Web", 40),
    icon: clampText(entry.icon, 40),
    emoji: clampText(entry.emoji, 8),
    logoUrl: clampText(entry.logoUrl, 280),
    ai: Boolean(entry.ai),
  };
}

const useAppStore = create((set, get) => ({
  // ── Auth ──────────────────────────────────────────────────
  user: null,
  userData: null,
  authReady: false,

  setUser: (user) => set({ user }),
  setUserData: (userData) => set({ userData }),
  setAuthReady: (ready) => set({ authReady: ready }),

  // ── Sites ─────────────────────────────────────────────────
  sites: [],

  setSites: (sites) => {
    set({ sites });
    updateLocalData({ shortcuts: sites });
  },

  addSite: (site) => {
    const sites = [...get().sites, site];
    set({ sites });
    updateLocalData({ shortcuts: sites });
  },

  updateSite: (id, patch) => {
    const sites = get().sites.map((s) =>
      s.id === id ? { ...s, ...patch } : s,
    );
    set({ sites });
    updateLocalData({ shortcuts: sites });
  },

  removeSite: (id) => {
    const sites = get().sites.filter((s) => s.id !== id);
    set({ sites });
    updateLocalData({ shortcuts: sites });
  },

  toggleQL: (id) => {
    const sites = get().sites.map((s) =>
      s.id === id ? { ...s, ql: !s.ql } : s,
    );
    set({ sites });
    updateLocalData({ shortcuts: sites });
  },

  reorderSites: (ordered) => {
    set({ sites: ordered });
    updateLocalData({ shortcuts: ordered });
  },

  initSites: (userData) => {
    if (userData.shortcuts && userData.shortcuts.length > 0) {
      // Merge builtins (preserving ql state) with custom sites
      const base = buildSitesForIndustry(userData.industry || "general");
      const custom = userData.shortcuts.filter((s) => !s.builtin);
      const merged = base.map((b) => {
        const saved = userData.shortcuts.find((s) => s.id === b.id);
        return saved ? { ...b, ql: saved.ql } : b;
      });
      set({ sites: [...merged, ...custom] });
    } else {
      set({ sites: buildSitesForIndustry(userData.industry || "general") });
    }
  },

  // ── History ───────────────────────────────────────────────
  history: [],

  addHistory: (entry) => {
    const safeEntry = sanitizeHistoryEntry(entry);
    if (!safeEntry) return;

    const history = [
      safeEntry,
      ...get().history.filter((h) => h.raw !== safeEntry.raw),
    ].slice(0, HISTORY_LIMIT);
    set({ history });
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {}
  },

  clearHistory: () => {
    set({ history: [] });
    localStorage.removeItem(HISTORY_KEY);
  },

  loadHistory: () => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const safeHistory = Array.isArray(parsed)
          ? parsed
              .map(sanitizeHistoryEntry)
              .filter(Boolean)
              .slice(0, HISTORY_LIMIT)
          : [];
        set({ history: safeHistory });
      }
    } catch {}
  },

  // ── Preferences ───────────────────────────────────────────
  theme: "t-midnight",
  font: "f-inter",
  uiScale: "m",
  textScale: "m",
  backgroundFx: "bgx-ocean",
  timeFormat: "digital",
  devMode: false,

  setTheme: (theme) => {
    set({ theme });
    updateLocalData({ theme });
  },

  setFont: (font) => {
    set({ font });
    updateLocalData({ font });
  },

  setUiScale: (uiScale) => {
    set({ uiScale });
    updateLocalData({ uiScale });
  },

  setTextScale: (textScale) => {
    set({ textScale });
    updateLocalData({ textScale });
  },

  setBackgroundFx: (backgroundFx) => {
    set({ backgroundFx });
    updateLocalData({ backgroundFx });
  },

  setTimeFormat: (timeFormat) => {
    set({ timeFormat });
    updateLocalData({ timeFormat });
  },

  setDevMode: (devMode) => {
    set({ devMode });
    updateLocalData({ devMode });
  },

  // ── Toast ─────────────────────────────────────────────────
  toast: null,
  showToast: (message, type = "info") => {
    set({ toast: { message, type, id: Date.now() } });
    setTimeout(() => set({ toast: null }), 2600);
  },

  // ── Sign out ──────────────────────────────────────────────
  resetAll: () => {
    clearLocalData();
    localStorage.removeItem(HISTORY_KEY);
    set({
      user: null,
      userData: null,
      sites: [],
      history: [],
      theme: "t-midnight",
      font: "f-inter",
      uiScale: "m",
      textScale: "m",
      backgroundFx: "bgx-ocean",
      timeFormat: "digital",
      devMode: false,
    });
  },
}));

export default useAppStore;
