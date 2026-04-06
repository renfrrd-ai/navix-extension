import { useState, useRef, useEffect } from "react";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import CommandBar from "@/components/command/CommandBar";
import QuickLaunch from "@/components/sites/QuickLaunch";
import HistoryList from "@/components/sites/HistoryList";
import AddSiteModal from "@/components/modals/AddSiteModal";
import AllLinksModal from "@/components/modals/AllLinksModal";
import RearrangeModal from "@/components/modals/RearrangeModal";
import HelpModal from "@/components/modals/HelpModal";
import HistoryModal from "@/components/modals/HistoryModal";
import SettingsPanel from "@/components/modals/SettingsPanel";
import { useClock } from "@/hooks/useClock";
import useAppStore from "@/hooks/useAppStore";
import { useCommand } from "@/hooks/useCommand";

export default function NewTabPage() {
  const { user, userData, theme, font, showToast } = useAppStore();
  const { timeStr, dateStr, greeting } = useClock();
  const command = useCommand();
  const { setValue, inputRef, execute } = command;

  const [addSiteOpen, setAddSiteOpen] = useState(false);
  const [editSite, setEditSite] = useState(null);
  const [allLinksOpen, setAllLinksOpen] = useState(false);
  const [rearrangeOpen, setRearrangeOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showHelpHint, setShowHelpHint] = useState(false);
  const welcomedUidRef = useRef(null);

  const name = userData?.name || "";
  const firstName = (userData?.name || user?.displayName || "there")
    .trim()
    .split(" ")[0];

  // Apply theme and font classes to root element
  useEffect(() => {
    const root = document.documentElement;
    // Remove old theme/font classes
    root.className = root.className
      .split(" ")
      .filter((c) => !c.startsWith("t-") && !c.startsWith("f-"))
      .join(" ");
    root.classList.add(theme, font);
    // Also apply font CSS var
    document.documentElement.style.setProperty("--font", getCSSFont(font));
  }, [theme, font]);

  useEffect(() => {
    if (!user?.uid) return;
    if (welcomedUidRef.current === user.uid) return;

    welcomedUidRef.current = user.uid;
    showToast(`Welcome, ${firstName}`);

    try {
      const seen = localStorage.getItem(`navix_help_hint_seen:${user.uid}`);
      setShowHelpHint(seen !== "1");
    } catch {
      setShowHelpHint(true);
    }
  }, [user?.uid, firstName, showToast]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incomingCommand = params.get("command")?.trim() || "";
    const shouldAutorun = params.get("autorun") === "1";

    if (!incomingCommand) return;

    setValue(incomingCommand);

    const cleanUrl = `${window.location.origin}${window.location.pathname}${window.location.hash || ""}`;
    window.history.replaceState({}, document.title, cleanUrl);

    if (shouldAutorun) {
      const timer = window.setTimeout(() => execute(incomingCommand), 120);
      return () => window.clearTimeout(timer);
    }

    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(focusTimer);
  }, [execute, inputRef, setValue]);

  function getCSSFont(fontId) {
    const map = {
      "f-inter": "'Inter', system-ui, sans-serif",
      "f-mono": "'JetBrains Mono', monospace",
      "f-dm": "'DM Sans', system-ui, sans-serif",
      "f-syne": "'Syne', system-ui, sans-serif",
      "f-space": "'Space Grotesk', system-ui, sans-serif",
    };
    return map[fontId] || map["f-inter"];
  }

  function handleEditSite(site) {
    setEditSite(site);
    setAddSiteOpen(true);
  }

  function handleCmdFill(site) {
    setValue((site.prefix || "") + " ");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleHistoryFill(raw) {
    setValue(raw);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function dismissHelpHint() {
    setShowHelpHint(false);
    if (!user?.uid) return;
    try {
      localStorage.setItem(`navix_help_hint_seen:${user.uid}`, "1");
    } catch {}
  }

  function openHelpFromHint() {
    dismissHelpHint();
    setHelpOpen(true);
  }

  return (
    <div className="relative z-2 flex min-h-screen flex-col items-center px-8 pt-10 pb-28">
      <div className="noise-layer" />
      <div className="orb orb1" />
      <div className="orb orb2" />

      <div className="flex w-full max-w-220 flex-col items-center gap-10">
        <div className="relative w-full">
          <AppHeader
            onAllLinks={() => setAllLinksOpen(true)}
            onAddSite={() => {
              setEditSite(null);
              setAddSiteOpen(true);
            }}
            onSettings={() => setSettingsOpen(true)}
            onHelp={() => {
              dismissHelpHint();
              setHelpOpen(true);
            }}
            helpHighlighted={showHelpHint}
          />

          {showHelpHint && (
            <div className="animate-fade-up absolute top-[calc(100%+0.9rem)] right-0 z-30 w-full max-w-[320px]">
              <div className="relative rounded-[18px] border-[1.5px] border-app-2 bg-app-2 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.38)]">
                <div className="absolute -top-2 right-9 h-4 w-4 rotate-45 border-t-[1.5px] border-l-[1.5px] border-app-2 bg-app-2" />
                <p className="mb-1 text-[0.96rem] font-semibold text-app">
                  Welcome, {firstName}
                </p>
                <p className="mb-4 text-[0.8rem] leading-[1.6] text-app-2">
                  New here? Start with the Help button to see what Navix can do,
                  which prefixes are available, and how the command bar works.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={openHelpFromHint}
                    className="cursor-pointer rounded-[9px] bg-accent-gradient px-4 py-[0.7rem] text-[0.78rem] font-semibold text-white transition-opacity duration-200 hover:opacity-90"
                  >
                    Show me how
                  </button>
                  <button
                    onClick={dismissHelpHint}
                    className="cursor-pointer rounded-[9px] border-[1.5px] border-app-2 bg-app-3 px-4 py-[0.7rem] text-[0.78rem] font-medium text-app-2 transition-colors duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-[0.4rem] text-center">
          <div className="text-[1.05rem] font-normal text-app-2">
            {name ? `${greeting}, ${name.split(" ")[0]} 👋` : greeting}
          </div>
          <div className="text-app text-[clamp(4rem,10vw,6.5rem)] font-light leading-none tracking-[-0.05em] [font-variant-numeric:tabular-nums]">
            {timeStr}
          </div>
          <div className="text-[0.88rem] tracking-[0.02em] text-app-2">
            {dateStr}
          </div>
        </div>

        <CommandBar {...command} />

        <QuickLaunch
          onEdit={handleEditSite}
          onCmdFill={handleCmdFill}
          onRearrange={() => setRearrangeOpen(true)}
        />

        <HistoryList
          onFill={handleHistoryFill}
          onSeeMore={() => setHistoryOpen(true)}
        />
      </div>

      <AppFooter />

      <AddSiteModal
        open={addSiteOpen}
        onClose={() => {
          setAddSiteOpen(false);
          setEditSite(null);
        }}
        editSite={editSite}
      />
      <AllLinksModal
        open={allLinksOpen}
        onClose={() => setAllLinksOpen(false)}
        onCmdFill={handleCmdFill}
      />
      <RearrangeModal
        open={rearrangeOpen}
        onClose={() => setRearrangeOpen(false)}
      />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <HistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onFill={handleHistoryFill}
      />
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
