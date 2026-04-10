import { useEffect, useState } from "react";
import Panel from "@/components/ui/Panel";
import { GhostButton } from "@/components/ui/Button";
import { THEMES, FONTS } from "@/utils/themes";
import useAppStore from "@/hooks/useAppStore";
import { signOut } from "@/services/auth";
import {
  forceSyncToFirestore,
  getPrivacyDiagnostics,
  resetPrivacyLocalData,
  updateLocalData,
} from "@/services/data";
import Input from "@/components/ui/Input";

const BACKGROUND_OPTIONS = [
  { id: "bgx-ocean", label: "Flowing Motion" },
  { id: "bgx-static", label: "Still Gradient" },
];

export default function SettingsPanel({ open, onClose }) {
  const {
    user,
    userData,
    theme,
    font,
    backgroundFx,
    devMode,
    setTheme,
    setFont,
    setBackgroundFx,
    setDevMode,
    setUserData,
    showToast,
    resetAll,
  } = useAppStore();

  const name = userData?.name || user?.displayName || "User";
  const email = userData?.email || user?.email || "";
  const initial = name.charAt(0).toUpperCase();
  const photo = user?.photoURL;
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [privacyReport, setPrivacyReport] = useState(null);

  useEffect(() => {
    setDraftName(name);
    setEditingName(false);
  }, [open, name]);

  async function handleSignOut() {
    if (user?.uid) {
      await forceSyncToFirestore(user.uid);
    }
    await signOut();
    resetAll();
    showToast("Signed out");
    onClose();
  }

  function toggleMode() {
    const next = !devMode;
    setDevMode(next);
    showToast(
      next ? "Dev Mode on — edit search URLs directly" : "Basic Mode on",
    );
  }

  function handleSaveName() {
    const trimmed = draftName.trim();
    if (!trimmed) {
      showToast("Enter a valid name", "error");
      return;
    }

    const nextUserData = { ...(userData || {}), name: trimmed };
    setUserData(nextUserData);
    updateLocalData({ name: trimmed });
    setDraftName(trimmed);
    setEditingName(false);
    showToast("Name saved");
  }

  function handlePrivacyReport() {
    const report = getPrivacyDiagnostics(user?.uid || "");
    setPrivacyReport(report);
    showToast("Privacy report updated");
  }

  function handlePrivacyReset() {
    const confirmed = window.confirm(
      "Reset local Navix data on this device? This clears local profile cache, history, and hint flags.",
    );
    if (!confirmed) return;

    resetPrivacyLocalData();
    setPrivacyReport(getPrivacyDiagnostics(user?.uid || ""));
    showToast("Local privacy data reset", "info");
    window.location.reload();
  }

  return (
    <Panel open={open} onClose={onClose} title="Settings">
      <div className="font-app flex items-center gap-[0.85rem] rounded-[14px] border-[1.5px] border-app bg-app-3 px-[1.1rem] py-4">
        <div className="bg-accent-gradient flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-base font-semibold text-white">
          {photo ? (
            <img src={photo} alt="" className="size-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {editingName ? (
              <>
                <Input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") {
                      setDraftName(name);
                      setEditingName(false);
                    }
                  }}
                  maxLength={32}
                  autoFocus
                  className="h-9 px-3 py-2 text-[0.88rem] font-semibold"
                />
                <button
                  onClick={handleSaveName}
                  className="shrink-0 cursor-pointer rounded-lg bg-accent-gradient px-3 py-2 text-[0.74rem] font-semibold text-white transition-opacity duration-200 hover:opacity-90"
                >
                  Save
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="cursor-pointer rounded-lg border-0 bg-transparent px-0 py-0 text-[0.88rem] font-semibold text-app transition-colors duration-200 hover:text-(--accent)"
              >
                {name}
              </button>
            )}
          </div>
          <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.72rem] text-app-3">
            {email}
          </div>
          <div className="text-[0.68rem] text-accent">☁ Synced to Navix</div>
        </div>
      </div>

      <SettingGroup
        label="Mode"
        badge={devMode ? "Dev" : "Basic"}
        badgeDev={devMode}
      >
        <p className="font-app mb-3 text-[0.79rem] leading-[1.6] text-app-2">
          Basic mode protects built-in URLs. Dev mode lets you edit search URLs
          directly and delete any site.
        </p>
        <GhostButton onClick={toggleMode}>
          {devMode ? "Switch to Basic Mode" : "Switch to Dev Mode"}
        </GhostButton>
      </SettingGroup>

      <SettingGroup label="Theme">
        <div className="grid grid-cols-4 gap-[0.55rem]">
          {THEMES.map((t) => (
            <div
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`cursor-pointer overflow-hidden rounded-[9px] border-2 transition-[border-color,transform] duration-200 ${
                theme === t.id ? "scale-[1.04] border-(--accent)" : "border-app"
              }`}
            >
              <div
                className={`flex h-11 items-center justify-center gap-0.75 ${t.swatchBgClass}`}
              >
                <div className={`size-2.25 rounded-full ${t.swatchAClass}`} />
                <div
                  className={`size-2.25 rounded-full opacity-60 ${t.swatchBClass}`}
                />
              </div>
              <div className="font-app bg-app-3 px-[0.4rem] py-[0.3rem] text-center text-[0.64rem] text-app-2">
                {t.name}
              </div>
            </div>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup label="Font">
        <div className="flex flex-col gap-2">
          {FONTS.map((f) => (
            <div
              key={f.id}
              onClick={() => setFont(f.id)}
              className={`flex cursor-pointer items-center justify-between rounded-[9px] border-[1.5px] px-4 py-[0.7rem] transition-colors duration-200 ${
                font === f.id
                  ? "border-(--accent) bg-(--accent-glow)"
                  : "border-app bg-app-3"
              } ${f.id}`}
            >
              <span className="text-[0.8rem] font-medium text-app">
                {f.name}
              </span>
              <span className="text-[0.78rem] text-app-3">{f.sample}</span>
            </div>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup label="Display">
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-app-3">
              Background animation
            </div>
            <div className="grid grid-cols-1 gap-2">
              {BACKGROUND_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setBackgroundFx(option.id)}
                  className={`cursor-pointer rounded-[9px] border px-3 py-[0.6rem] text-left text-[0.78rem] font-medium transition-colors duration-200 ${
                    backgroundFx === option.id
                      ? "border-(--accent) bg-(--accent-glow) text-app"
                      : "border-app bg-app-3 text-app-2 hover:border-app-2 hover:text-app"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SettingGroup>

      <SettingGroup label="Privacy">
        <p className="font-app mb-3 text-[0.79rem] leading-[1.6] text-app-2">
          Review your current local data footprint and privacy controls.
        </p>
        <div className="flex flex-wrap gap-2">
          <GhostButton onClick={handlePrivacyReport}>
            Show Data Summary
          </GhostButton>
          <GhostButton onClick={handlePrivacyReset} danger>
            Reset Local Privacy Data
          </GhostButton>
        </div>

        {privacyReport && (
          <div className="mt-3 rounded-[10px] border-[1.5px] border-app bg-app-3 p-3">
            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-app-3">
              Privacy Summary
            </div>
            <pre className="mt-2 overflow-x-auto text-[0.72rem] leading-[1.55] text-app-2">
              {JSON.stringify(privacyReport, null, 2)}
            </pre>
          </div>
        )}
      </SettingGroup>

      <div className="border-t border-app pt-5">
        <GhostButton onClick={handleSignOut} danger>
          Sign out
        </GhostButton>
      </div>
    </Panel>
  );
}

function SettingGroup({ label, badge, badgeDev, children }) {
  return (
    <div className="font-app flex flex-col gap-[0.6rem]">
      <div className="flex items-center gap-2">
        <label className="text-[0.83rem] font-semibold text-app">{label}</label>
        {badge && (
          <span
            className={`rounded-[20px] px-2 py-[0.15rem] text-[0.62rem] font-semibold tracking-[0.04em] text-white ${
              badgeDev
                ? "bg-[linear-gradient(135deg,#34d399,#6ee7b7)]"
                : "bg-[linear-gradient(135deg,var(--accent),var(--accent2))]"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
