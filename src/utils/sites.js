// ── Industry preset sites ─────────────────────────────────────────
const BASE_SITES = [
  {
    id: "g",
    name: "Google",
    icon: "google",
    prefix: "g",
    bg: "#ffffff",
    searchUrl: "https://www.google.com/search?q={query}",
    baseUrl: "https://google.com",
    ql: true,
    builtin: true,
  },
  {
    id: "gpt",
    name: "ChatGPT",
    icon: "chatgpt",
    prefix: "gpt",
    bg: "#10a37f",
    searchUrl: "https://chatgpt.com/?q={query}",
    baseUrl: "https://chatgpt.com",
    ql: true,
    builtin: true,
  },
  {
    id: "yt",
    name: "YouTube",
    icon: "youtube",
    prefix: "yt",
    bg: "#FF0000",
    searchUrl: "https://www.youtube.com/results?search_query={query}",
    baseUrl: "https://youtube.com",
    ql: true,
    builtin: true,
  },
  {
    id: "amz",
    name: "Amazon",
    icon: "amazon",
    prefix: "amz",
    bg: "#232F3E",
    searchUrl: "https://www.amazon.com/s?k={query}",
    baseUrl: "https://amazon.com",
    ql: true,
    builtin: true,
  },
  {
    id: "maps",
    name: "Maps",
    icon: "maps",
    prefix: "maps",
    bg: "#4285F4",
    searchUrl: "https://www.google.com/maps/search/{query}",
    baseUrl: "https://maps.google.com",
    ql: true,
    builtin: true,
  },
  {
    id: "wiki",
    name: "Wikipedia",
    icon: "wikipedia",
    prefix: "wiki",
    bg: "#555555",
    searchUrl: "https://en.wikipedia.org/wiki/Special:Search?search={query}",
    baseUrl: "https://wikipedia.org",
    ql: true,
    builtin: true,
  },
];

const INDUSTRY_EXTRAS = {
  tech: [
    {
      id: "gh",
      name: "GitHub",
      icon: "github",
      prefix: "gh",
      bg: "#24292e",
      searchUrl: "https://github.com/search?q={query}",
      baseUrl: "https://github.com",
      ql: true,
      builtin: true,
    },
    {
      id: "so",
      name: "Stack Overflow",
      icon: "stackoverflow",
      prefix: "so",
      bg: "#F48024",
      searchUrl: "https://stackoverflow.com/search?q={query}",
      baseUrl: "https://stackoverflow.com",
      ql: true,
      builtin: true,
    },
    {
      id: "npm",
      name: "npm",
      icon: "npm",
      prefix: "npm",
      bg: "#CB3837",
      searchUrl: "https://www.npmjs.com/search?q={query}",
      baseUrl: "https://npmjs.com",
      ql: false,
      builtin: true,
    },
    {
      id: "tw",
      name: "Twitter/X",
      icon: "twitter",
      prefix: "tw",
      bg: "#000000",
      searchUrl: "https://twitter.com/search?q={query}",
      baseUrl: "https://twitter.com",
      ql: false,
      builtin: true,
    },
  ],
  design: [
    {
      id: "fig",
      name: "Figma",
      icon: "figma",
      prefix: "fig",
      bg: "#1E1E1E",
      searchUrl: "https://www.figma.com/search?q={query}",
      baseUrl: "https://figma.com",
      ql: true,
      builtin: true,
    },
    {
      id: "pin",
      name: "Pinterest",
      emoji: "📌",
      prefix: "pin",
      bg: "#E60023",
      searchUrl: "https://www.pinterest.com/search/pins/?q={query}",
      baseUrl: "https://pinterest.com",
      ql: true,
      builtin: true,
    },
    {
      id: "tw",
      name: "Twitter/X",
      icon: "twitter",
      prefix: "tw",
      bg: "#000000",
      searchUrl: "https://twitter.com/search?q={query}",
      baseUrl: "https://twitter.com",
      ql: false,
      builtin: true,
    },
    {
      id: "amz",
      name: "Amazon",
      icon: "amazon",
      prefix: "amz",
      bg: "#232F3E",
      searchUrl: "https://www.amazon.com/s?k={query}",
      baseUrl: "https://amazon.com",
      ql: false,
      builtin: true,
    },
  ],
  business: [
    {
      id: "li",
      name: "LinkedIn",
      icon: "linkedin",
      prefix: "li",
      bg: "#0A66C2",
      searchUrl:
        "https://www.linkedin.com/search/results/all/?keywords={query}",
      baseUrl: "https://linkedin.com",
      ql: true,
      builtin: true,
    },
    {
      id: "tw",
      name: "Twitter/X",
      icon: "twitter",
      prefix: "tw",
      bg: "#000000",
      searchUrl: "https://twitter.com/search?q={query}",
      baseUrl: "https://twitter.com",
      ql: true,
      builtin: true,
    },
    {
      id: "amz",
      name: "Amazon",
      icon: "amazon",
      prefix: "amz",
      bg: "#232F3E",
      searchUrl: "https://www.amazon.com/s?k={query}",
      baseUrl: "https://amazon.com",
      ql: false,
      builtin: true,
    },
    {
      id: "ig",
      name: "Instagram",
      icon: "instagram",
      prefix: "ig",
      bg: "#c13584",
      searchUrl: "https://www.instagram.com/explore/tags/{query}",
      baseUrl: "https://instagram.com",
      ql: true,
      builtin: true,
    },
  ],
  student: [
    {
      id: "gh",
      name: "GitHub",
      icon: "github",
      prefix: "gh",
      bg: "#24292e",
      searchUrl: "https://github.com/search?q={query}",
      baseUrl: "https://github.com",
      ql: true,
      builtin: true,
    },
    {
      id: "tw",
      name: "Twitter/X",
      icon: "twitter",
      prefix: "tw",
      bg: "#000000",
      searchUrl: "https://twitter.com/search?q={query}",
      baseUrl: "https://twitter.com",
      ql: false,
      builtin: true,
    },
    {
      id: "ig",
      name: "Instagram",
      icon: "instagram",
      prefix: "ig",
      bg: "#c13584",
      searchUrl: "https://www.instagram.com/explore/tags/{query}",
      baseUrl: "https://instagram.com",
      ql: true,
      builtin: true,
    },
    {
      id: "amz",
      name: "Amazon",
      icon: "amazon",
      prefix: "amz",
      bg: "#232F3E",
      searchUrl: "https://www.amazon.com/s?k={query}",
      baseUrl: "https://amazon.com",
      ql: false,
      builtin: true,
    },
  ],
  content: [
    {
      id: "tw",
      name: "Twitter/X",
      icon: "twitter",
      prefix: "tw",
      bg: "#000000",
      searchUrl: "https://twitter.com/search?q={query}",
      baseUrl: "https://twitter.com",
      ql: true,
      builtin: true,
    },
    {
      id: "ig",
      name: "Instagram",
      icon: "instagram",
      prefix: "ig",
      bg: "#c13584",
      searchUrl: "https://www.instagram.com/explore/tags/{query}",
      baseUrl: "https://instagram.com",
      ql: true,
      builtin: true,
    },

    {
      id: "tt",
      name: "TikTok",
      icon: "tiktok",
      prefix: "tt",
      bg: "#010101",
      searchUrl: "https://www.tiktok.com/search?q={query}",
      baseUrl: "https://tiktok.com",
      ql: true,
      builtin: true,
    },
    {
      id: "amz",
      name: "Amazon",
      icon: "amazon",
      prefix: "amz",
      bg: "#232F3E",
      searchUrl: "https://www.amazon.com/s?k={query}",
      baseUrl: "https://amazon.com",
      ql: false,
      builtin: true,
    },
  ],
  general: [
    {
      id: "ig",
      name: "Instagram",
      icon: "instagram",
      prefix: "ig",
      bg: "#c13584",
      searchUrl: "https://www.instagram.com/explore/tags/{query}",
      baseUrl: "https://instagram.com",
      ql: true,
      builtin: true,
    },
    {
      id: "tw",
      name: "Twitter/X",
      icon: "twitter",
      prefix: "tw",
      bg: "#000000",
      searchUrl: "https://twitter.com/search?q={query}",
      baseUrl: "https://twitter.com",
      ql: true,
      builtin: true,
    },
    {
      id: "amz",
      name: "Amazon",
      icon: "amazon",
      prefix: "amz",
      bg: "#232F3E",
      searchUrl: "https://www.amazon.com/s?k={query}",
      baseUrl: "https://amazon.com",
      ql: true,
      builtin: true,
    },
    {
      id: "li",
      name: "LinkedIn",
      icon: "linkedin",
      prefix: "li",
      bg: "#0A66C2",
      searchUrl:
        "https://www.linkedin.com/search/results/all/?keywords={query}",
      baseUrl: "https://linkedin.com",
      ql: false,
      builtin: true,
    },
  ],
};

export function buildSitesForIndustry(industry = "general") {
  const base = BASE_SITES.map((s) => ({ ...s }));
  const extras = (INDUSTRY_EXTRAS[industry] || INDUSTRY_EXTRAS.general).map(
    (s) => ({ ...s }),
  );
  extras.forEach((s) => {
    if (!base.find((x) => x.id === s.id)) base.push(s);
  });
  return base;
}

export function siteSupportsSearch(site) {
  return Boolean(site?.searchUrl && /\{query\}|%s/i.test(site.searchUrl));
}

export function buildSearchUrl(site, query) {
  if (!siteSupportsSearch(site) || !query) return site?.baseUrl || "";

  const rawQuery = query.trim();
  const slugRules = site.slugRules || site.slug_rules || {};
  let normalized = rawQuery;

  if (slugRules.lowercase) {
    normalized = normalized.toLowerCase();
  }

  const encoded = encodeURIComponent(normalized);
  const finalQuery =
    slugRules.space_encoding === "+" ? encoded.replace(/%20/g, "+") : encoded;

  const template = String(site.searchUrl).replace(/%s/gi, "{query}");
  return template.replace(/\{query\}/gi, finalQuery);
}

export function buildSiteTargetUrl(site, query) {
  const q = String(query || "").trim();
  if (!site) return "";
  if (q && siteSupportsSearch(site)) {
    return buildSearchUrl(site, q);
  }
  return site.baseUrl || "";
}

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getDomainParts(url = "") {
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const { hostname } = new URL(normalized);
    const cleanHost = hostname.replace(/^www\./i, "").toLowerCase();
    const parts = cleanHost.split(".").filter(Boolean);
    const root = parts.length >= 2 ? parts.slice(-2).join(".") : cleanHost;
    const label = parts[0] || cleanHost;
    return {
      host: cleanHost,
      root,
      label,
    };
  } catch {
    return { host: "", root: "", label: "" };
  }
}

export function isSameSiteDomain(candidateUrl = "", baseUrl = "") {
  const candidate = getDomainParts(candidateUrl);
  const base = getDomainParts(baseUrl);
  if (!candidate.root || !base.root) return false;
  return candidate.root === base.root;
}

export function ensureSearchUrlMatchesBase(baseUrl, candidateSearchUrl) {
  const normalizedBase = baseUrl?.startsWith("http")
    ? baseUrl
    : `https://${baseUrl || ""}`;

  if (!candidateSearchUrl) return "";
  if (!isSameSiteDomain(candidateSearchUrl, normalizedBase)) return "";

  const normalizedTemplate = String(candidateSearchUrl).replace(
    /%s/gi,
    "{query}",
  );
  if (!/\{query\}/i.test(normalizedTemplate)) return "";

  return normalizedTemplate;
}

export function findMentionedSite(sites, rawQuery) {
  const query = normalizeText(rawQuery);
  if (!query) return null;

  const scored = sites
    .map((site) => {
      const name = normalizeText(site.name);
      const prefix = normalizeText(site.prefix);
      const { label, root } = getDomainParts(site.baseUrl);
      const rootLabel = normalizeText(root.replace(/\.[a-z]{2,}$/i, ""));
      const aliases = [];

      if (site.id === "maps") aliases.push("google maps");
      if (site.id === "gpt") aliases.push("chat gpt");
      if (site.id === "so") aliases.push("stack overflow");
      if (site.id === "yt") aliases.push("you tube");
      if (site.id === "tw") aliases.push("twitter x");

      const tokens = [
        name,
        prefix,
        normalizeText(label),
        rootLabel,
        ...aliases.map(normalizeText),
      ].filter(Boolean);

      let bestScore = 0;

      tokens.forEach((token) => {
        if (!token || token.length < 2) return;

        if (query === token) {
          bestScore = Math.max(bestScore, token.length + 100);
          return;
        }

        if (query.startsWith(`${token} `)) {
          bestScore = Math.max(bestScore, token.length + 50);
          return;
        }

        if (query.includes(` ${token} `) || query.endsWith(` ${token}`)) {
          bestScore = Math.max(bestScore, token.length);
        }
      });

      return bestScore > 0 ? { site, score: bestScore } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.site || null;
}

export function findExactPrefix(sites, prefix) {
  return sites.find((s) => s.prefix && s.prefix === prefix) || null;
}
