import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { getSiteIconFrameStyle, SiteIcon } from "@/utils/icons.jsx";
import useAppStore from "@/hooks/useAppStore";

export default function AllLinksModal({ open, onClose, onCmdFill }) {
  const { sites } = useAppStore();
  const [filter, setFilter] = useState("");

  const filtered = filter
    ? sites.filter(
        (s) =>
          s.name.toLowerCase().includes(filter.toLowerCase()) ||
          s.prefix?.includes(filter.toLowerCase()),
      )
    : sites;

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose();
        setFilter("");
      }}
      title="All Sites"
      wide
    >
      <div className="mb-4">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search sites…"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-[0.85rem]">
        {filtered.map((site) => (
          <div
            key={site.id}
            onClick={() => {
              onCmdFill(site);
              onClose();
              setFilter("");
            }}
            className="font-app flex cursor-pointer items-center gap-[0.7rem] rounded-[9px] border-[1.5px] border-app bg-app-3 px-4 py-[0.9rem] transition-colors duration-150 hover:border-[var(--accent)] hover:bg-[var(--accent-glow)]"
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg"
              style={getSiteIconFrameStyle(site)}
            >
              <SiteIcon site={site} size={28} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.82rem] font-medium text-app">
                {site.name}
              </div>
              {site.prefix && (
                <div className="text-[0.67rem] text-accent">{site.prefix}</div>
              )}
            </div>
            {site.ql && (
              <span
                className="shrink-0 rounded px-[0.45rem] py-[0.12rem] text-[0.58rem] uppercase tracking-[0.08em] text-accent border border-app-2 bg-accent-glow"
                title="Quick Launch"
              >
                Quick
              </span>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-[0.88rem] text-app-3">
          No sites found for "{filter}"
        </p>
      )}
    </Modal>
  );
}
