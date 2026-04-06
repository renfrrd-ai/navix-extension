import useAppStore from "@/hooks/useAppStore";
import { getSiteIconFrameStyle, SiteIcon } from "@/utils/icons.jsx";
import { Icons } from "@/utils/icons.jsx";

export default function HistoryList({ onFill, onSeeMore }) {
  const { history, clearHistory, sites } = useAppStore();
  const visibleHistory = history.slice(0, 3);

  if (!history.length) return null;

  return (
    <div className="w-full">
      <div className="mb-[0.6rem] flex items-center justify-between">
        <span className="text-[0.73rem] font-semibold uppercase tracking-[0.09em] text-app-3">
          Recent
        </span>
        <button
          onClick={clearHistory}
          className="font-app cursor-pointer border-0 bg-transparent text-[0.75rem] text-app-3 transition-colors duration-150 hover:text-danger"
        >
          Clear
        </button>
      </div>

      <div className="flex flex-col gap-[0.35rem]">
        {visibleHistory.map((entry, i) => {
          const site = entry.icon
            ? sites.find((s) => s.icon === entry.icon)
            : null;

          return (
            <div
              key={i}
              onClick={() => onFill(entry.raw)}
              className="font-app flex cursor-pointer items-center gap-[0.85rem] rounded-[9px] border-[1.5px] border-app bg-app-2 px-4 py-[0.7rem] transition-colors duration-150 hover:border-app-2 hover:bg-app-3"
            >
              <div
                className="flex size-7.5 shrink-0 items-center justify-center overflow-hidden rounded-lg text-base"
                style={site ? getSiteIconFrameStyle(site) : undefined}
              >
                {site ? (
                  <SiteIcon site={site} size={22} />
                ) : entry.emoji ? (
                  entry.emoji
                ) : entry.logoUrl ? (
                  <img
                    src={entry.logoUrl}
                    className="size-5.5 rounded-sm object-contain"
                    alt=""
                  />
                ) : entry.ai ? (
                  Icons.ai
                ) : (
                  "🔍"
                )}
              </div>

              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[0.87rem] text-app-2">
                {entry.query || entry.raw}
              </span>
              <span className="shrink-0 text-[0.7rem] text-app-3">
                {entry.ai
                  ? `✦ ${entry.name || "AI"}`
                  : (entry.name || "").slice(0, 14)}
              </span>
            </div>
          );
        })}
      </div>

      {history.length > 3 && (
        <div className="mt-2 flex justify-end">
          <button
            onClick={onSeeMore}
            className="font-app cursor-pointer border-0 bg-transparent text-[0.76rem] font-medium text-accent transition-colors duration-150 hover:text-accent-2"
          >
            {`See more (${history.length - 3})`}
          </button>
        </div>
      )}
    </div>
  );
}
