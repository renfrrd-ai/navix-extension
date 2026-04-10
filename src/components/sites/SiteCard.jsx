import { useState } from "react";
import { getSiteIconFrameStyle, SiteIcon } from "@/utils/icons.jsx";
import useAppStore from "@/hooks/useAppStore";

export default function SiteCard({ site, onCmdFill }) {
  const { toggleQL, removeSite, devMode, showToast } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  function openMenu(e) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 6,
      left: Math.min(rect.left, window.innerWidth - 210),
    });
    setMenuOpen(true);
  }

  function handleDelete() {
    setMenuOpen(false);
    if (site.builtin && !devMode) {
      showToast("Switch to Dev Mode to delete built-in sites");
      return;
    }
    if (!window.confirm(`Delete "${site.name}"?`)) return;
    removeSite(site.id);
    showToast(`${site.name} deleted`);
  }

  const iconFrameStyle = getSiteIconFrameStyle(site);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onCmdFill(site)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onCmdFill(site);
          }
        }}
        title={`${site.name}${site.prefix ? ` (${site.prefix})` : ""}`}
        className="group font-app relative flex cursor-pointer flex-col items-center gap-[0.6rem] rounded-[14px] border-[1.5px] border-app bg-app-2 px-2 py-[1.15rem] pb-[0.95rem] transition-[border-color,background,transform] duration-200 hover:-translate-y-0.75 hover:border-(--accent) hover:bg-(--accent-glow)"
      >
        <div
          className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl"
          style={iconFrameStyle}
        >
          <SiteIcon site={site} size={40} />
        </div>

        <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-[0.72rem] font-medium leading-[1.3] text-app-2">
          {site.name}
        </span>

        {site.prefix && (
          <span className="text-[0.58rem] font-semibold tracking-[0.04em] text-app-3">
            {site.prefix}
          </span>
        )}

        <button
          onClick={openMenu}
          className="kebab absolute top-1.25 right-1.25 hidden size-5 cursor-pointer items-center justify-center rounded-[5px] border border-app-2 bg-app-3 text-[0.85rem] leading-none text-app-2 group-hover:flex"
        >
          ⋮
        </button>
      </div>

      {menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-490"
          />
          <div
            className="font-app fixed z-500 min-w-50 overflow-hidden rounded-[9px] border-[1.5px] border-app-2 bg-app-3 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            {[
              {
                label: site.ql
                  ? "Remove from Quick Launch"
                  : "Add to Quick Launch",
                action: () => {
                  setMenuOpen(false);
                  toggleQL(site.id);
                  showToast(
                    site.ql
                      ? `${site.name} removed`
                      : `${site.name} added to Quick Launch`,
                  );
                },
              },
              { label: "Delete site", action: handleDelete, danger: true },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className={`block w-full cursor-pointer border-0 border-b border-app bg-transparent px-4 py-[0.8rem] text-left text-[0.84rem] transition-colors duration-150 ${
                  item.danger
                    ? "text-(--red) hover:bg-[rgba(248,113,113,0.1)] hover:text-(--red)"
                    : "text-app-2 hover:bg-(--accent-glow) hover:text-app"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
