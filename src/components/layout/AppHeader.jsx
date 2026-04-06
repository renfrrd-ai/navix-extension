import NavixLogo from "@/components/ui/NavixLogo";
import { IconButton } from "@/components/ui/Button";
import useAppStore from "@/hooks/useAppStore";

const GridIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);
const PlusIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const SettingsIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
  </svg>
);
const HelpIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" />
  </svg>
);

export default function AppHeader({
  onAllLinks,
  onAddSite,
  onSettings,
  onHelp,
  helpHighlighted = false,
}) {
  const { user, userData } = useAppStore();
  const name = userData?.name || user?.displayName || "U";
  const initial = name.charAt(0).toUpperCase();
  const photo = user?.photoURL;

  return (
    <header className="flex w-full items-center justify-between">
      <div className="flex items-center gap-[0.78rem]">
        <NavixLogo size={30} />
        <div className="flex flex-col leading-[1.1]">
          <span className="gradient-text text-[1.5rem] font-bold tracking-[-0.03em]">
            Navix
          </span>
          <span className="text-[0.8rem] uppercase tracking-[0.08em] text-app-3">
            Smart Command Hub
          </span>
        </div>
      </div>

      <div className="flex items-center gap-[0.45rem]">
        <IconButton onClick={onAllLinks} title="All Sites">
          <GridIcon />
        </IconButton>
        <IconButton onClick={onAddSite} title="Add site">
          <PlusIcon />
        </IconButton>
        <IconButton onClick={onSettings} title="Settings">
          <SettingsIcon />
        </IconButton>
        <div className="relative">
          <IconButton onClick={onHelp} title="Help" active={helpHighlighted}>
            <HelpIcon />
          </IconButton>
          {helpHighlighted && (
            <span className="pointer-events-none absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-(--accent) opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-(--accent2)" />
            </span>
          )}
        </div>

        <button
          onClick={onSettings}
          title="Account"
          className="bg-accent-gradient flex h-8.5 w-8.5 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-0 text-[0.82rem] font-semibold text-white"
        >
          {photo ? (
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </button>
      </div>
    </header>
  );
}
