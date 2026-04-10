import useAppStore from "@/hooks/useAppStore";
import SiteCard from "./SiteCard";

export default function QuickLaunch({ onCmdFill, onRearrange }) {
  const { sites } = useAppStore();
  const qlSites = sites.filter((s) => s.ql);

  return (
    <div className="w-full">
      <div className="mb-[0.85rem] flex items-center justify-between">
        <span className="text-[0.73rem] font-semibold uppercase tracking-[0.09em] text-app-3">
          Quick Launch
        </span>
        <button
          onClick={onRearrange}
          className="font-app cursor-pointer rounded-[5px] border-0 bg-transparent px-[0.4rem] py-[0.2rem] text-[0.75rem] text-app-3 transition-colors duration-150 hover:text-accent"
        >
          ⇄ Rearrange
        </button>
      </div>

      <div className="grid grid-cols-6 gap-[0.9rem]">
        {qlSites.map((site) => (
          <SiteCard key={site.id} site={site} onCmdFill={onCmdFill} />
        ))}
      </div>
    </div>
  );
}
