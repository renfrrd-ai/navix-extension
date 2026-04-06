import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { PrimaryButton } from "@/components/ui/Button";
import Toggle from "@/components/ui/Toggle";
import { SiteIcon } from "@/utils/icons.jsx";
import useAppStore from "@/hooks/useAppStore";

export default function RearrangeModal({ open, onClose }) {
  const { sites, reorderSites, showToast } = useAppStore();
  const [local, setLocal] = useState([]);
  const [dragIdx, setDragIdx] = useState(null);

  useEffect(() => {
    if (!open) {
      setLocal([]);
      return;
    }
    setLocal(sites.map((site) => ({ ...site })));
  }, [open, sites]);

  function handleToggleQL(id) {
    setLocal((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ql: !s.ql } : s)),
    );
  }

  function handleDragStart(i) {
    setDragIdx(i);
  }
  function handleDragOver(e, i) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const next = [...local];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved);
    setLocal(next);
    setDragIdx(i);
  }
  function handleDragEnd() {
    setDragIdx(null);
  }

  function handleSave() {
    reorderSites(local);
    setLocal([]);
    showToast("Order saved");
    onClose();
  }

  function handleClose() {
    setLocal([]);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Rearrange Quick Launch"
      footer={<PrimaryButton onClick={handleSave}>Save Order</PrimaryButton>}
    >
      <p className="font-app mb-4 text-[0.82rem] text-app-2">
        Drag to reorder. Toggle to show/hide in Quick Launch.
      </p>

      {local.map((site, i) => (
        <div
          key={site.id}
          draggable
          onDragStart={() => handleDragStart(i)}
          onDragOver={(e) => handleDragOver(e, i)}
          onDragEnd={handleDragEnd}
          className={`font-app mb-[0.45rem] flex select-none items-center gap-[0.85rem] rounded-[9px] border-[1.5px] px-4 py-[0.78rem] transition-colors duration-150 ${
            dragIdx === i
              ? "border-[var(--accent)] bg-[var(--accent-glow)]"
              : "border-app bg-app-3"
          }`}
        >
          <span className="cursor-grab text-[1rem] text-app-3">⠿</span>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-[7px] bg-app-4">
            <SiteIcon site={site} size={22} />
          </div>
          <span className="flex-1 text-[0.84rem] text-app">{site.name}</span>
          <Toggle checked={site.ql} onChange={() => handleToggleQL(site.id)} />
        </div>
      ))}
    </Modal>
  );
}
