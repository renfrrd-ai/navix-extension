export default function NavixLogo({ size = 28 }) {
  const id = `nlg-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="13" stroke={`url(#${id})`} strokeWidth="1.5" />
      <circle cx="14" cy="14" r="5" fill={`url(#${id})`} />
      <line
        x1="14"
        y1="1"
        x2="14"
        y2="7"
        stroke={`url(#${id})`}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="14"
        y1="21"
        x2="14"
        y2="27"
        stroke={`url(#${id})`}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="1"
        y1="14"
        x2="7"
        y2="14"
        stroke={`url(#${id})`}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="21"
        y1="14"
        x2="27"
        y2="14"
        stroke={`url(#${id})`}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient
          id={id}
          x1="0"
          y1="0"
          x2="28"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#818cf8" />
          <stop offset="1" stopColor="#c084fc" />
        </linearGradient>
      </defs>
    </svg>
  );
}
