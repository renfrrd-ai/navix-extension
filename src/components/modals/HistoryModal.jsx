import Modal from "@/components/ui/Modal";
import useAppStore from "@/hooks/useAppStore";
import { getSiteIconFrameStyle, SiteIcon, Icons } from "@/utils/icons.jsx";

export default function HistoryModal({ open, onClose, onFill }) {
  const { history, clearHistory, sites } = useAppStore();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Recent History"
      wide
      footer={
        <button
          onClick={clearHistory}
          className="font-app cursor-pointer rounded-[9px] border-[1.5px] border-app-2 bg-app-3 px-4 py-[0.68rem] text-[0.78rem] font-medium text-app-2 transition-colors duration-150 hover:border-danger hover:text-danger"
        >
          Clear history
        </button>
      }
    >
      <div className="flex flex-col gap-[0.45rem]">
        {history.map((entry, i) => {
          const site = entry.icon
            ? sites.find((s) => s.icon === entry.icon)
            : null;

          return (
            <div
              key={`${entry.raw}-${i}`}
              onClick={() => {
                onFill(entry.raw);
                onClose();
              }}
              className="font-app flex cursor-pointer items-center gap-[0.9rem] rounded-[10px] border-[1.5px] border-app bg-app-3 px-4 py-[0.82rem] transition-colors duration-150 hover:border-app-2 hover:bg-app-2"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg text-base"
                style={site ? getSiteIconFrameStyle(site) : undefined}
              >
                {site ? (
                  <SiteIcon site={site} size={24} />
                ) : entry.emoji ? (
                  entry.emoji
                ) : entry.logoUrl ? (
                  <img
                    src={entry.logoUrl}
                    className="h-6 w-6 rounded-sm object-contain"
                    alt=""
                  />
                ) : entry.ai ? (
                  Icons.ai
                ) : (
                  "🔍"
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.86rem] text-app">
                  {entry.query || entry.raw}
                </div>
                <div className="mt-[0.14rem] overflow-hidden text-ellipsis whitespace-nowrap text-[0.7rem] text-app-3">
                  {entry.raw}
                </div>
              </div>

              <span className="shrink-0 text-[0.7rem] text-app-3">
                {entry.ai
                  ? `✦ ${entry.name || "AI"}`
                  : (entry.name || "").slice(0, 18)}
              </span>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
