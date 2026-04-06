import { useEffect } from "react";

export default function Panel({ open, onClose, title, children }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      {open && <div onClick={onClose} className="ui-panel-overlay" />}

      <aside
        className={`ui-panel-shell ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="ui-shell-header">
          <span>{title}</span>
          <button
            onClick={onClose}
            className="flex size-8.5 cursor-pointer items-center justify-center rounded-[9px] border-[1.5px] border-app-2 bg-app-3 text-[0.9rem] text-app-2"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-7 overflow-y-auto p-7">
          {children}
        </div>
      </aside>
    </>
  );
}
