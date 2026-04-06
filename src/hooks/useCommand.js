import { useState, useRef, useCallback } from "react";
import { routeQuery } from "@/services/router";
import { buildSearchUrl, findExactPrefix } from "@/utils/sites";
import useAppStore from "./useAppStore";

const MAX_ROUTABLE_QUERY_LENGTH = 320;

function containsSensitiveInput(text = "") {
  const value = String(text);
  const lower = value.toLowerCase();

  return (
    /\b(password|passcode|api[_-]?key|secret|private[_-]?key|bearer|jwt|token|otp|2fa)\b/.test(
      lower,
    ) ||
    /-----begin [a-z ]*private key-----/i.test(value) ||
    /(?:^|\s)(?:sk|ghp|xoxb|xoxp|eyj)[a-z0-9._-]{16,}/i.test(value)
  );
}

export function useCommand() {
  const { sites, addHistory, showToast } = useAppStore();
  const [value, setValue] = useState("");
  const [aiThinking, setAi] = useState(false);
  const [suggestions, setSugg] = useState([]);
  const inputRef = useRef(null);
  const histIdxRef = useRef(-1);
  const platformAliasesRef = useRef({
    "google maps": "maps",
    google_maps: "maps",
    maps: "maps",
    youtube: "yt",
    "you tube": "yt",
    chatgpt: "gpt",
    "chat gpt": "gpt",
    wikipedia: "wiki",
    wiki: "wiki",
    amazon: "amz",
    github: "gh",
    "stack overflow": "so",
    stackoverflow: "so",
    linkedin: "li",
    instagram: "ig",
    tiktok: "tt",
    "twitter x": "tw",
    twitter: "tw",
    x: "tw",
  });

  const normalizePlatform = (value = "") =>
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const findSiteByPlatform = useCallback(
    (platformName) => {
      if (!platformName) return null;
      const needle = normalizePlatform(platformName);
      const aliasedPrefix = platformAliasesRef.current[needle];

      if (aliasedPrefix) {
        const directAliasMatch = sites.find(
          (site) => normalizePlatform(site.prefix) === aliasedPrefix,
        );
        if (directAliasMatch) return directAliasMatch;
      }

      return (
        sites.find((site) => {
          const name = normalizePlatform(site.name);
          const prefix = normalizePlatform(site.prefix);
          return (
            name === needle ||
            prefix === needle ||
            name.includes(needle) ||
            needle.includes(name)
          );
        }) || null
      );
    },
    [sites],
  );

  const resolveAiSite = useCallback(
    (data) => {
      const candidates = [
        data.platform,
        data.siteName,
        data.platform_detection?.platform_name,
        data.route?.destination,
      ].filter(Boolean);

      for (const candidate of candidates) {
        const matched = findSiteByPlatform(candidate);
        if (matched) return matched;
      }

      return null;
    },
    [findSiteByPlatform],
  );

  // ── Badge state ───────────────────────────────────────────
  const raw = value;
  const firstWord = raw.trim().split(" ")[0].toLowerCase();
  const matchSite = findExactPrefix(sites, firstWord);
  const hasSpace = raw.includes(" ");
  const isNatural = !matchSite && hasSpace && raw.trim().length > 0;
  const badgeLabel = raw.trim()
    ? matchSite
      ? matchSite.name
      : "Google"
    : null;

  // ── Autocomplete suggestions ──────────────────────────────
  const updateSuggestions = useCallback(
    (input) => {
      const q = input.trim();
      if (!q || q.includes(" ") || q.length < 1) {
        setSugg([]);
        return;
      }
      const matches = sites.filter(
        (s) =>
          s.prefix &&
          s.prefix.startsWith(q.toLowerCase()) &&
          s.prefix !== q.toLowerCase(),
      );
      setSugg(matches.slice(0, 5));
    },
    [sites],
  );

  const handleChange = (e) => {
    const v = e.target.value;
    setValue(v);
    histIdxRef.current = -1;
    updateSuggestions(v);
  };

  const handleKeyDown = (e, history) => {
    if (e.key === "Escape") {
      setValue("");
      setSugg([]);
      return;
    }
    if (e.key === "Enter") {
      setSugg([]);
      execute(value);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const idx = Math.min(histIdxRef.current + 1, history.length - 1);
      histIdxRef.current = idx;
      setValue(history[idx].raw);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const idx = Math.max(histIdxRef.current - 1, -1);
      histIdxRef.current = idx;
      setValue(idx < 0 ? "" : history[idx].raw);
    }
  };

  const pickSuggestion = (prefix) => {
    setValue(prefix + " ");
    setSugg([]);
    inputRef.current?.focus();
  };

  // ── Execute ───────────────────────────────────────────────
  const execute = useCallback(
    async (raw) => {
      const q = raw.trim();
      if (!q || aiThinking) return;

      const parts = q.split(" ");
      const first = parts[0].toLowerCase();
      const rest = parts.slice(1).join(" ").trim();

      // 1. Exact prefix
      const exactSite = findExactPrefix(sites, first);
      if (exactSite && rest) {
        showToast(`Route: exact prefix -> ${exactSite.name}`);
        addHistory({
          raw: q,
          query: rest,
          name: exactSite.name,
          icon: exactSite.icon,
          emoji: exactSite.emoji,
          ai: false,
        });
        window.open(buildSearchUrl(exactSite, rest), "_self");
        return;
      }

      // 3. Natural language → AI router
      if (q.includes(" ")) {
        if (containsSensitiveInput(q)) {
          showToast(
            "Sensitive input detected. Query not sent to AI router.",
            "error",
          );
          return;
        }

        if (q.length > MAX_ROUTABLE_QUERY_LENGTH) {
          showToast("Query is too long for AI routing.", "error");
          return;
        }

        setAi(true);
        try {
          const data = await routeQuery(q);
          const matchedSite = resolveAiSite(data);
          // New API v1.0 provides pre-cleaned searchQuery
          let resolvedQuery = data.searchQuery || q;

          const url = data.fullUrl;

          if (url) {
            showToast(`Route: AI -> ${data.siteName || "Web"}`);
            addHistory({
              raw: q,
              query: resolvedQuery,
              name: data.siteName || "Web",
              icon: matchedSite?.icon,
              emoji: matchedSite?.emoji,
              logoUrl: matchedSite?.logoUrl,
              ai: true,
            });
            window.open(url, "_self");
            return;
          }
        } catch (err) {
          console.error("[Navix AI Routing Error]", {
            message: err instanceof Error ? err.message : String(err),
            code: err?.code,
            status: err?.status,
            timestamp: new Date().toISOString(),
          });

          // Handle rate limit error specifically
          if (err?.status === 429 || err?.code === "RATE_LIMIT_EXCEEDED") {
            showToast(
              "Rate limit reached. Please wait a minute before trying again.",
              "error",
            );
          } else {
            showToast("AI routing failed, falling back to Google", "error");
          }
        } finally {
          setAi(false);
        }
      }

      // 4. Fallback — Google
      showToast("Route: Google fallback", "error");
      addHistory({
        raw: q,
        query: q,
        name: "Google",
        icon: "google",
        ai: false,
      });
      window.open(
        `https://www.google.com/search?q=${encodeURIComponent(q)}`,
        "_self",
      );
    },
    [sites, aiThinking, addHistory, showToast, resolveAiSite],
  );

  return {
    value,
    setValue,
    aiThinking,
    suggestions,
    setSugg,
    badgeLabel,
    isNatural,
    inputRef,
    handleChange,
    handleKeyDown,
    pickSuggestion,
    execute,
  };
}
