import useAppStore from "@/hooks/useAppStore";

export default function AppFooter() {
  const { devMode, setDevMode, showToast } = useAppStore();

  function toggle() {
    const next = !devMode;
    setDevMode(next);
    showToast(
      next ? "Dev Mode on — edit search URLs directly" : "Basic Mode on",
    );
  }

  return (
    <footer className="font-app fixed inset-x-0 bottom-0 z-10 flex items-center justify-center gap-6 border-t border-app bg-app px-4 py-[0.65rem] text-[0.69rem] text-app-3">
      <span>
        Enter to go ·{" "}
        <kbd className="rounded border border-app-2 bg-app-3 px-[0.38rem] py-[0.1rem] text-[0.63rem] text-app-2">
          ↑↓
        </kbd>{" "}
        history ·{" "}
        <kbd className="rounded border border-app-2 bg-app-3 px-[0.38rem] py-[0.1rem] text-[0.63rem] text-app-2">
          Esc
        </kbd>{" "}
        clear
      </span>
      <button
        onClick={toggle}
        className="cursor-pointer border-0 bg-transparent text-[0.69rem] text-accent"
      >
        {devMode ? "⚡ Dev Mode" : "🔒 Basic Mode"}
      </button>
    </footer>
  );
}
