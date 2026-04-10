import { useState, useRef, useEffect } from "react";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import CommandBar from "@/components/command/CommandBar";
import QuickLaunch from "@/components/sites/QuickLaunch";
import HistoryList from "@/components/sites/HistoryList";
import AllLinksModal from "@/components/modals/AllLinksModal";
import RearrangeModal from "@/components/modals/RearrangeModal";
import HelpModal from "@/components/modals/HelpModal";
import HistoryModal from "@/components/modals/HistoryModal";
import SettingsPanel from "@/components/modals/SettingsPanel";
import { useClock } from "@/hooks/useClock";
import useAppStore from "@/hooks/useAppStore";
import { useCommand } from "@/hooks/useCommand";
import { THEMES } from "@/utils/themes";

const BACKGROUND_VIDEO_URL =
  "https://video-previews.elements.envatousercontent.com/895fd898-4df1-4d23-abcf-1bb088cdbab3/watermarked_preview/watermarked_preview.mp4";

const BACKGROUND_OPTIONS = [
  { id: "bgx-ocean", label: "Flowing Motion" },
  { id: "bgx-static", label: "Still Gradient" },
];

export default function NewTabPage() {
  const {
    user,
    userData,
    theme,
    font,
    backgroundFx,
    timeFormat,
    setTheme,
    setBackgroundFx,
    setTimeFormat,
    showToast,
  } = useAppStore();
  const { now, timeStr, dateStr, greeting } = useClock();
  const command = useCommand();
  const { setValue, inputRef, execute } = command;

  const [allLinksOpen, setAllLinksOpen] = useState(false);
  const [rearrangeOpen, setRearrangeOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showHelpHint, setShowHelpHint] = useState(false);
  const [showWelcomeSplash, setShowWelcomeSplash] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const welcomedUidRef = useRef(null);

  const name = userData?.name || "";
  const firstName = (userData?.name || user?.displayName || "there")
    .trim()
    .split(" ")[0];
  const welcomeStorageKey = `navix_intro_seen:${user?.uid || "guest"}`;

  // Apply theme and font classes to root element
  useEffect(() => {
    const root = document.documentElement;
    // Remove old theme/font classes
    root.className = root.className
      .split(" ")
      .filter(
        (c) =>
          !c.startsWith("t-") && !c.startsWith("f-") && !c.startsWith("bgx-"),
      )
      .join(" ");
    root.classList.add(theme, font, backgroundFx);
    // Also apply font CSS var
    document.documentElement.style.setProperty("--font", getCSSFont(font));
  }, [theme, font, backgroundFx]);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(welcomeStorageKey);
      setShowWelcomeSplash(seen !== "1");
    } catch {
      setShowWelcomeSplash(true);
    }
  }, [welcomeStorageKey]);

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

  function dismissWelcomeSplash() {
    setShowWelcomeSplash(false);
    try {
      localStorage.setItem(welcomeStorageKey, "1");
    } catch {}
  }

  function handleTimeAreaClick(e) {
    if (e.detail === 3) {
      setShowTimePicker((v) => !v);
    }
  }

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;
  const minuteDeg = minutes * 6;
  const secondDeg = seconds * 6;
  const binaryDigits =
    `${String(hours).padStart(2, "0")}${String(minutes).padStart(2, "0")}${String(seconds).padStart(2, "0")}`
      .split("")
      .map((digit) => Number(digit).toString(2).padStart(4, "0"));

  return (
    <div className="relative z-2 flex min-h-screen flex-col items-center px-8 pt-10 pb-28">
      <div className="video-bg" aria-hidden="true">
        <video
          className="video-bg-media"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src={BACKGROUND_VIDEO_URL} type="video/mp4" />
        </video>
        <div className="video-bg-overlay" />
      </div>

      <div className="noise-layer" />
      <div className="orb orb1" />
      <div className="orb orb2" />

      {showWelcomeSplash && (
        <div className="welcome-overlay animate-fade-up">
          <div className="welcome-setup-panel">
            <p className="welcome-overlay-title">
              Customize your first session
            </p>
            <p className="welcome-overlay-copy">
              Pick your preferred look first. You can tweak these again anytime
              from Settings.
            </p>

            <div className="welcome-setup-group">
              <div className="welcome-setup-label">Background animation</div>
              <div className="welcome-chip-row wrap">
                {BACKGROUND_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setBackgroundFx(option.id)}
                    className={`welcome-chip ${backgroundFx === option.id ? "active" : ""}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="welcome-setup-group">
              <div className="welcome-setup-label">Color theme</div>
              <div className="welcome-theme-grid">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`welcome-theme-chip ${theme === t.id ? "active" : ""}`}
                    title={t.name}
                  >
                    <span
                      className={`welcome-theme-swatch ${t.swatchAClass}`}
                    />
                    <span
                      className={`welcome-theme-swatch ${t.swatchBClass}`}
                    />
                    <span className="welcome-theme-name">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={dismissWelcomeSplash}
              className="welcome-overlay-button"
            >
              Continue
            </button>
          </div>

          <img
            src="/navix-1024.png"
            alt="Navix assistant"
            className="welcome-overlay-mascot"
          />
        </div>
      )}

      <div className="app-scale-shell flex w-full justify-center">
        <div className="flex w-full max-w-220 flex-col items-center gap-8">
          <div className="relative w-full">
            <AppHeader
              onAllLinks={() => setAllLinksOpen(true)}
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
                  <div className="absolute -top-2 right-9 size-4 rotate-45 border-t-[1.5px] border-l-[1.5px] border-app-2 bg-app-2" />
                  <p className="mb-1 text-[0.96rem] font-semibold text-app">
                    Welcome, {firstName}
                  </p>
                  <p className="mb-4 text-[0.8rem] leading-[1.6] text-app-2">
                    New here? Start with the Help button to see what Navix can
                    do, which prefixes are available, and how the command bar
                    works.
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
                      className="cursor-pointer rounded-[9px] border-[1.5px] border-app-2 bg-app-3 px-4 py-[0.7rem] text-[0.78rem] font-medium text-app-2 transition-colors duration-200 hover:border-(--accent) hover:text-(--accent)"
                    >
                      Maybe later
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div
            className="relative flex flex-col items-center gap-[0.4rem] text-center"
            onClick={handleTimeAreaClick}
            title="Triple click to change clock style"
          >
            <div className="time-display-shell">
              {timeFormat === "analog" ? (
                <div className="analog-clock" aria-label="Analog clock">
                  <div className="analog-clock-face" />
                  <span
                    className="analog-clock-hand hour"
                    style={{
                      transform: `translateX(-50%) rotate(${hourDeg}deg)`,
                    }}
                  />
                  <span
                    className="analog-clock-hand minute"
                    style={{
                      transform: `translateX(-50%) rotate(${minuteDeg}deg)`,
                    }}
                  />
                  <span
                    className="analog-clock-hand second"
                    style={{
                      transform: `translateX(-50%) rotate(${secondDeg}deg)`,
                    }}
                  />
                  <span className="analog-clock-center" />
                </div>
              ) : timeFormat === "binary" ? (
                <div
                  className="binary-clock"
                  aria-label="Binary clock"
                  title={timeStr}
                >
                  {binaryDigits.map((bits, idx) => (
                    <div key={`digit-${idx}`} className="binary-digit-col">
                      {bits.split("").map((bit, bitIdx) => (
                        <span
                          key={`bit-${idx}-${bitIdx}`}
                          className={`binary-dot ${bit === "1" ? "on" : "off"}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="time-display-digital">{timeStr}</div>
              )}
            </div>
            <div className="text-[0.88rem] tracking-[0.02em] text-app-2">
              {dateStr}
            </div>

            {showTimePicker && (
              <div className="time-format-popover animate-fade-up">
                <div className="time-format-label">Clock style</div>
                <div className="time-format-options">
                  <button
                    onClick={() => {
                      setTimeFormat("digital");
                      setShowTimePicker(false);
                    }}
                    className={`time-format-btn ${timeFormat === "digital" ? "active" : ""}`}
                  >
                    Digital
                  </button>
                  <button
                    onClick={() => {
                      setTimeFormat("analog");
                      setShowTimePicker(false);
                    }}
                    className={`time-format-btn ${timeFormat === "analog" ? "active" : ""}`}
                  >
                    Analog
                  </button>
                  <button
                    onClick={() => {
                      setTimeFormat("binary");
                      setShowTimePicker(false);
                    }}
                    className={`time-format-btn ${timeFormat === "binary" ? "active" : ""}`}
                  >
                    Binary
                  </button>
                </div>
              </div>
            )}
          </div>

          <CommandBar {...command} />

          <QuickLaunch
            onCmdFill={handleCmdFill}
            onRearrange={() => setRearrangeOpen(true)}
          />

          <HistoryList
            onFill={handleHistoryFill}
            onSeeMore={() => setHistoryOpen(true)}
          />
        </div>
      </div>

      <AppFooter />
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
