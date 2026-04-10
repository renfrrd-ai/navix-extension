import { useState, useRef, useCallback } from "react";
import { researchQuery, routeQuery } from "@/services/router";
import {
  buildSiteTargetUrl,
  findExactPrefix,
  getDomainParts,
  siteSupportsSearch,
} from "@/utils/sites";
import useAppStore from "./useAppStore";

export function useCommand() {
  const { sites, addHistory, showToast } = useAppStore();
  const [value, setValue] = useState("");
  const [aiThinking, setAi] = useState(false);
  const [suggestions, setSugg] = useState([]);
  const inputRef = useRef(null);
  const histIdxRef = useRef(-1);

  const resolveAiSite = useCallback(
    (data) => {
      const normalizedSite = String(data.siteName || data.platform || "")
        .toLowerCase()
        .trim();
      const normalizedDomain = String(data.domain || "")
        .toLowerCase()
        .replace(/^www\./, "")
        .trim();

      if (!normalizedSite && !normalizedDomain) return null;

      return (
        sites.find((site) => {
          const name = String(site.name || "")
            .toLowerCase()
            .trim();
          const prefix = String(site.prefix || "")
            .toLowerCase()
            .trim();
          const rootDomain = getDomainParts(site.baseUrl).root;
          return (
            (normalizedSite &&
              (name === normalizedSite || prefix === normalizedSite)) ||
            (normalizedDomain && rootDomain === normalizedDomain)
          );
        }) || null
      );
    },
    [sites],
  );

  // ── Badge state ───────────────────────────────────────────
  const raw = value;
  const trimmed = raw.trim();
  const isDeepResearchInput = trimmed.startsWith("@");
  const firstWord = trimmed.split(" ")[0].toLowerCase();
  const matchSite = findExactPrefix(sites, firstWord);
  const isNatural = !isDeepResearchInput && !matchSite && trimmed.length > 0;
  const badgeLabel = trimmed
    ? isDeepResearchInput
      ? "Research"
      : matchSite
        ? matchSite.name
        : "Google"
    : null;

  // ── Autocomplete suggestions ──────────────────────────────
  const updateSuggestions = useCallback(
    (input) => {
      const q = input.trim();
      if (!q || q.includes(" ") || q.startsWith("@") || q.length < 1) {
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

      let fallbackQuery = q;

      if (q.startsWith("@")) {
        const researchInput = q.slice(1).trim();
        if (!researchInput) {
          showToast("Add a query after @ to run deep research.", "error");
          return;
        }
        fallbackQuery = researchInput;

        setAi(true);
        try {
          const data = await researchQuery(researchInput);
          const matchedSite = resolveAiSite(data);
          const url = data.fullUrl;

          if (url) {
            showToast(
              `Route: Research -> ${data.domain || data.siteName || "Web"}`,
            );
            addHistory({
              raw: q,
              query: data.searchQuery || researchInput,
              name: data.siteName || data.domain || "Web",
              icon: matchedSite?.icon,
              emoji: matchedSite?.emoji,
              logoUrl: matchedSite?.logoUrl,
              ai: true,
            });
            window.open(url, "_self");
            return;
          }
        } catch (err) {
          console.error("[Navix Research Routing Error]", {
            message: err instanceof Error ? err.message : String(err),
            code: err?.code,
            status: err?.status,
            timestamp: new Date().toISOString(),
          });

          if (err?.status === 429 || err?.code === "RATE_LIMIT_EXCEEDED") {
            showToast(
              "Rate limit reached. Please wait a minute before trying again.",
              "error",
            );
          } else {
            showToast(
              "Research routing failed, falling back to Google",
              "error",
            );
          }
        } finally {
          setAi(false);
        }

        showToast("Route: Google fallback", "error");
        addHistory({
          raw: q,
          query: fallbackQuery,
          name: "Google",
          icon: "google",
          ai: false,
        });
        window.open(
          `https://www.google.com/search?q=${encodeURIComponent(fallbackQuery)}`,
          "_self",
        );
        return;
      }

      const parts = q.split(" ");
      const first = parts[0].toLowerCase();
      const rest = parts.slice(1).join(" ").trim();

      // 1. Exact prefix
      const exactSite = findExactPrefix(sites, first);
      if (exactSite) {
        const targetUrl = buildSiteTargetUrl(exactSite, rest);
        if (!targetUrl) {
          showToast("This shortcut has no valid destination URL.", "error");
          return;
        }

        const routeType =
          rest && siteSupportsSearch(exactSite) ? "search" : "open";
        showToast(`Route: exact prefix (${routeType}) -> ${exactSite.name}`);
        addHistory({
          raw: q,
          query: rest || exactSite.baseUrl || exactSite.name,
          name: exactSite.name,
          icon: exactSite.icon,
          emoji: exactSite.emoji,
          logoUrl: exactSite.logoUrl,
          ai: false,
        });
        window.open(targetUrl, "_self");
        return;
      }

      // 3. Non-prefix input -> AI router (send raw query)
      setAi(true);
      try {
        const data = await routeQuery(q);
        const matchedSite = resolveAiSite(data);
        const resolvedQuery = data.searchQuery || q;
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

      // 4. Fallback — Google
      showToast("Route: Google fallback", "error");
      addHistory({
        raw: q,
        query: fallbackQuery,
        name: "Google",
        icon: "google",
        ai: false,
      });
      window.open(
        `https://www.google.com/search?q=${encodeURIComponent(fallbackQuery)}`,
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
    isDeepResearchInput,
    inputRef,
    handleChange,
    handleKeyDown,
    pickSuggestion,
    execute,
  };
}
