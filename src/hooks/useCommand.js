import { useState, useRef, useCallback } from "react";
import { routeQuery } from "@/services/router";
import {
  buildSiteTargetUrl,
  findMentionedSite,
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

  const getErrorMessage = useCallback((err) => {
    if (err instanceof Error && typeof err.message === "string") {
      const message = err.message.trim();
      if (message) return message;
    }

    if (typeof err?.message === "string") {
      const message = err.message.trim();
      if (message) return message;
    }

    if (err?.message && typeof err.message === "object") {
      try {
        const serialized = JSON.stringify(err.message);
        if (serialized && serialized !== "{}") return serialized;
      } catch {
        // Ignore serialization failures.
      }
    }

    if (typeof err?.error === "string" && err.error.trim()) {
      return err.error.trim();
    }

    if (typeof err === "string") {
      return err;
    }

    if (err && typeof err === "object") {
      try {
        const serialized = JSON.stringify(err);
        if (serialized && serialized !== "{}") return serialized;
      } catch {
        // Ignore serialization failures.
      }
    }

    try {
      return JSON.stringify(err);
    } catch {
      return "unknown error";
    }
  }, []);

  // ── Badge state ───────────────────────────────────────────
  const raw = value;
  const trimmed = raw.trim();
  const firstWord = trimmed.split(" ")[0].toLowerCase();
  const matchSite = findExactPrefix(sites, firstWord);
  const isNatural = !matchSite && trimmed.length > 0;
  const badgeLabel = trimmed ? (matchSite ? matchSite.name : "Google") : null;

  // ── Autocomplete suggestions ──────────────────────────────
  const updateSuggestions = useCallback(
    (input) => {
      const q = input.trim();
      if (!q || q.includes(" ") || q.length < 1) {
        setSugg([]);
        return;
      }
      const queryPrefix = q.toLowerCase();
      const matches = sites.filter((s) => {
        const sitePrefix = String(s?.prefix || "").toLowerCase();
        return (
          sitePrefix &&
          sitePrefix.startsWith(queryPrefix) &&
          sitePrefix !== queryPrefix
        );
      });
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
      let aiError = null;
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
        aiError = err;
        const errorMessage = getErrorMessage(err);
        console.error("[Navix AI Routing Error]", errorMessage, {
          message: errorMessage,
          code: err?.code,
          status: err?.status,
          rawError: err,
          timestamp: new Date().toISOString(),
        });
      } finally {
        setAi(false);
      }

      const mentionedSite = findMentionedSite(sites, q);
      if (mentionedSite) {
        const openIntent = /^(open|go|goto|visit|launch)\b/i.test(q);
        const localTargetUrl = openIntent
          ? mentionedSite.baseUrl
          : buildSiteTargetUrl(mentionedSite, q);

        if (localTargetUrl) {
          showToast(
            aiError
              ? `AI unavailable, used local route -> ${mentionedSite.name}`
              : `Route: local match -> ${mentionedSite.name}`,
            aiError ? "error" : "info",
          );
          addHistory({
            raw: q,
            query: q,
            name: mentionedSite.name,
            icon: mentionedSite.icon,
            emoji: mentionedSite.emoji,
            logoUrl: mentionedSite.logoUrl,
            ai: false,
          });
          window.open(localTargetUrl, "_self");
          return;
        }
      }

      if (aiError) {
        const errorMessage = getErrorMessage(aiError);
        if (
          aiError?.status === 429 ||
          aiError?.code === "RATE_LIMIT_EXCEEDED"
        ) {
          showToast(
            "Rate limit reached. Please wait a minute before trying again.",
            "error",
          );
        } else {
          showToast(`AI routing failed: ${errorMessage}`, "error");
        }
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
    [sites, aiThinking, addHistory, showToast, resolveAiSite, getErrorMessage],
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
