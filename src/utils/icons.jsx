import {
  FaAmazon,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaWikipediaW,
} from "react-icons/fa";
import { FaWandMagicSparkles } from "react-icons/fa6";
import {
  SiFigma,
  SiGithub,
  SiGoogle,
  SiInstagram,
  SiNpm,
  SiOpenai,
  SiReddit,
  SiStackoverflow,
  SiTiktok,
  SiX,
  SiYoutube,
} from "react-icons/si";

const BRAND_ICON_MAP = {
  amazon: { component: FaAmazon, color: "#FF9900" },
  chatgpt: { component: SiOpenai, color: "#10A37F" },
  figma: { component: SiFigma, color: "#F24E1E" },
  github: { component: SiGithub, color: "#ffffff" },
  google: { component: SiGoogle, color: "#ffffff" },
  instagram: { component: SiInstagram, color: "#E1306C" },
  linkedin: { component: FaLinkedinIn, color: "#0A66C2" },
  maps: { component: FaMapMarkerAlt, color: "#EA4335" },
  npm: { component: SiNpm, color: "#CB3837" },
  reddit: { component: SiReddit, color: "#FF4500" },
  stackoverflow: { component: SiStackoverflow, color: "#F48024" },
  tiktok: { component: SiTiktok, color: "#ffffff" },
  twitter: { component: SiX, color: "#ffffff" },
  wikipedia: { component: FaWikipediaW, color: "#ffffff" },
  youtube: { component: SiYoutube, color: "#FF0000" },
  ai: { component: FaWandMagicSparkles, color: "#c084fc" },
};

export const Icons = {
  ai: <FaWandMagicSparkles size={16} color="#c084fc" />,
};

export function getSiteIconFrameStyle(site) {
  const color = site?.bg || "#818cf8";
  return {
    background: `${color}22`,
    border: `1px solid ${color}36`,
  };
}

function getIconSize(size) {
  if (size >= 40) return 24;
  if (size >= 28) return 18;
  return 14;
}

export function SiteIcon({ site, size = 40 }) {
  if (site.logoUrl) {
    return (
      <img
        src={site.logoUrl}
        alt={site.name}
        className="rounded-lg object-contain"
        width={size}
        height={size}
        onError={(e) => {
          e.target.classList.add("hidden");
        }}
      />
    );
  }

  if (site.icon === "google") {
    const iconSize = getIconSize(size) + (size >= 40 ? 2 : 0);
    return (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
    );
  }

  const iconDef = site.icon ? BRAND_ICON_MAP[site.icon] : null;
  if (iconDef) {
    const Icon = iconDef.component;
    const iconSize = getIconSize(size);
    return (
      <span className="flex items-center justify-center">
        <Icon size={iconSize} color={iconDef.color} />
      </span>
    );
  }

  return (
    <span
      className={
        size >= 40 ? "text-[22px]" : size >= 28 ? "text-[16px]" : "text-[12px]"
      }
    >
      {site.emoji || "🔗"}
    </span>
  );
}
