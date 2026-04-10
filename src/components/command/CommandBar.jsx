import useAppStore from "@/hooks/useAppStore";
import { SiteIcon } from "@/utils/icons.jsx";

const SearchIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const EnterIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <polyline points="9 10 4 15 9 20" />
    <path d="M20 4v7a4 4 0 0 1-4 4H4" />
  </svg>
);
const StarIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L9.09 9.09 2 12l7.09 2.91L12 22l2.91-7.09L22 12l-7.09-2.91L12 2z" />
  </svg>
);
const LoaderDot = ({ delay = "0ms" }) => (
  <span
    className="size-1.5 rounded-full bg-(--accent) animate-[pulse_1.1s_ease-in-out_infinite]"
    style={{ animationDelay: delay }}
  />
);

export default function CommandBar({
  value,
  aiThinking,
  suggestions,
  badgeLabel,
  isNatural,
  inputRef,
  handleChange,
  handleKeyDown,
  pickSuggestion,
  execute,
}) {
  const { history } = useAppStore();

  return (
    <div className="relative w-full max-w-190">
      <div className="flex items-center overflow-hidden rounded-[18px] border-[1.5px] border-app-2 bg-app-2 transition-[border-color,box-shadow] duration-200 focus-within:border-(--accent) focus-within:ring-app">
        <div className="flex shrink-0 items-center px-[1.3rem] pr-[1.1rem] text-app-3">
          <SearchIcon />
        </div>

        <input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={(e) => handleKeyDown(e, history)}
          placeholder="Type a command like  yt lo-fi  or ask anything…"
          autoComplete="off"
          spellCheck={false}
          autoFocus
          className="font-app flex-1 border-0 bg-transparent px-2 py-[1.2rem] text-[1.05rem] text-app caret-(--accent) outline-none"
        />

        {aiThinking && (
          <div className="mr-[0.45rem] flex shrink-0 items-center gap-[0.45rem] rounded-[9px] border border-[rgba(129,140,248,0.22)] bg-accent-glow px-[0.72rem] py-[0.42rem] text-[0.68rem] font-semibold tracking-[0.06em] text-accent">
            <StarIcon />
            <span className="whitespace-nowrap">AI routing</span>
            <span className="flex items-center gap-[0.22rem]">
              <LoaderDot />
              <LoaderDot delay="140ms" />
              <LoaderDot delay="280ms" />
            </span>
          </div>
        )}
        {!aiThinking && isNatural && value.trim() && (
          <div className="mr-[0.4rem] flex shrink-0 items-center gap-[0.3rem] rounded-[7px] border border-[rgba(192,132,252,0.22)] bg-accent-glow-2 px-[0.6rem] py-1 text-[0.68rem] font-semibold tracking-[0.06em] text-accent-2">
            <StarIcon /> AI
          </div>
        )}
        {!aiThinking && !isNatural && badgeLabel && (
          <div className="bg-accent-gradient mr-[0.4rem] shrink-0 whitespace-nowrap rounded-[7px] px-[0.65rem] py-[0.28rem] text-[0.68rem] font-semibold tracking-[0.07em] text-white">
            {badgeLabel}
          </div>
        )}

        <button
          onClick={() => execute(value)}
          className="bg-accent-gradient flex min-h-16 shrink-0 cursor-pointer items-center justify-center rounded-r-2xl border-0 px-[1.3rem] text-white transition-opacity duration-200 hover:opacity-85"
        >
          <EnterIcon />
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="absolute inset-x-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-[14px] border-[1.5px] border-app-2 bg-app-2 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          {suggestions.map((s) => (
            <div
              key={s.id}
              onClick={() => pickSuggestion(s.prefix)}
              className="flex cursor-pointer items-center gap-[0.85rem] border-b border-app px-[1.2rem] py-[0.85rem] text-[0.88rem] text-app-2 transition-colors duration-150 hover:bg-(--accent-glow) hover:text-app"
            >
              <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-[7px] bg-app-3">
                <SiteIcon site={s} size={22} />
              </div>
              <span className="flex-1">{s.name}</span>
              <span className="text-[0.72rem] font-semibold text-accent">
                {s.prefix}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
