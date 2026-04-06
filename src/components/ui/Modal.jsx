import { useEffect, useRef } from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide = false,
}) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div ref={overlayRef} onClick={onClose} className="ui-modal-overlay" />

      <div
        className={`ui-modal-shell ${wide ? "w-[min(800px,95vw)]" : "w-[min(520px,95vw)]"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ui-shell-header">
          <span>{title}</span>
          <button
            onClick={onClose}
            className="cursor-pointer border-0 bg-transparent px-1 text-[1.1rem] leading-none text-app-2"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-7">{children}</div>

        {footer && (
          <div className="flex shrink-0 justify-end border-t border-app px-7 py-4">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
