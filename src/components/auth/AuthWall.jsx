import { useEffect, useState } from "react";
import { signInWithGoogle } from "@/services/auth";
import { updateLocalData } from "@/services/data";
import { buildSitesForIndustry } from "@/utils/sites";
import { INDUSTRIES } from "@/utils/themes";
import useAppStore from "@/hooks/useAppStore";
import NavixLogo from "@/components/ui/NavixLogo";
import { PrimaryButton } from "@/components/ui/Button";
import Input from "@/components/ui/Input";

// ── Step machine ───────────────────────────────────────────────────
// 'signin' → 'onboard-name' → 'onboard-industry'

export default function AuthWall() {
  const { user, userData } = useAppStore();
  const [step, setStep] = useState("signin");
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [status, setStatus] = useState({ msg: "", type: "" });
  const [loading, setLoading] = useState(false);

  const setMsg = (msg, type = "") => setStatus({ msg, type });

  useEffect(() => {
    if (!user || !userData) return;

    setName(userData.name || user.displayName || "");
    setIndustry(
      userData.industry && userData.industry !== "general"
        ? userData.industry
        : "",
    );

    if (!(userData.name || user.displayName)) {
      setStep("onboard-name");
      return;
    }

    if (!userData.industry || userData.industry === "general") {
      setStep("onboard-industry");
      return;
    }

    setStep("signin");
  }, [user, userData]);

  // ── Google ──────────────────────────────────────────────────
  async function handleGoogle() {
    setLoading(true);
    setMsg("Connecting to Google…", "loading");
    try {
      await signInWithGoogle();
    } catch (e) {
      setMsg(e.message || "Google sign-in failed. Please try again.", "error");
      setLoading(false);
      return;
    }
  }

  function handleNameNext() {
    if (!name.trim()) {
      setMsg("Enter your name.", "error");
      return;
    }
    setMsg("");
    setStep("onboard-industry");
  }

  // ── Onboard: Industry ──────────────────────────────────────
  async function handleIndustryNext() {
    if (!industry) {
      setMsg("Pick an option.", "error");
      return;
    }
    const sites = buildSitesForIndustry(industry);
    const currentUserData = useAppStore.getState().userData || {};
    const nextUserData = {
      ...currentUserData,
      name: name.trim(),
      industry,
      shortcuts: sites,
    };
    updateLocalData(nextUserData);
    useAppStore.getState().setUserData(nextUserData);
    useAppStore.getState().setSites(sites);
    setMsg("");
    // auth listener will have already set user; updating store triggers App re-render
  }

  // ── Status color ────────────────────────────────────────────
  const statusColor =
    status.type === "ok"
      ? "text-success"
      : status.type === "error"
        ? "text-danger"
        : "text-accent";

  return (
    <div className="font-app fixed inset-0 z-1000 flex items-center justify-center bg-app p-4 text-[0.97rem]">
      <div className="noise-layer" />
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="animate-fade-up relative flex w-full max-w-[960px] overflow-hidden rounded-[32px] border-[1.5px] border-app-2 bg-app-2 shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
        {step === "signin" && (
          <div className="grid w-full grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative flex flex-col justify-center gap-7 border-b border-app px-8 py-9 lg:border-r lg:border-b-0 lg:px-10 lg:py-10">
              <div className="inline-flex w-fit items-center gap-3 rounded-full border border-app bg-app-3 px-4 py-2 text-[0.74rem] font-semibold tracking-[0.08em] text-app-2">
                <span className="size-2 animate-pulse rounded-full bg-[var(--accent)]" />
                Smart Command Hub
              </div>

              <div className="flex max-w-[460px] flex-col gap-6">
                <div className="relative flex items-center gap-4">
                  <div className="absolute left-3 size-16 rounded-full bg-[var(--accent-glow)] blur-2xl" />
                  <div className="relative rounded-[22px] border border-app bg-app-3 p-4">
                    <NavixLogo size={58} />
                  </div>
                  <div>
                    <div className="gradient-text text-[1.9rem] font-bold tracking-[-0.05em] lg:text-[2.45rem]">
                      Navix
                    </div>
                    <div className="text-[0.8rem] uppercase tracking-[0.12em] text-app-3">
                      Search less. Flow more.
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="mb-3 text-[1.85rem] font-bold leading-[1.02] tracking-[-0.05em] text-app lg:text-[2.8rem]">
                    One command bar for your whole browser.
                  </h2>
                  <p className="max-w-[420px] text-[0.88rem] leading-[1.75] text-app-2">
                    Open your web tools faster with a calm new-tab space built
                    around shortcuts, search, and flow.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-[0.76rem] text-app-3">
                  {["Quick launch", "Smart routing", "Synced setup"].map(
                    (item) => (
                      <div
                        key={item}
                        className="rounded-full border border-app bg-app-3 px-3 py-1.5"
                      >
                        {item}
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-5 px-8 py-9 lg:px-10 lg:py-10">
              <div>
                <div className="mb-2 text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-app-3">
                  Welcome
                </div>
                <h3 className="mb-3 text-[1.65rem] font-bold tracking-[-0.04em] text-app">
                  Join Navix
                </h3>
                <p className="text-[0.82rem] leading-[1.7] text-app-2">
                  Sign in to save your setup and pick up where you left off.
                </p>
              </div>

              <button
                onClick={handleGoogle}
                disabled={loading}
                className={`flex items-center justify-center gap-3 rounded-[14px] border-[1.5px] border-app-2 bg-app-3 px-5 py-4 text-[0.95rem] font-medium text-app transition-colors duration-200 ${loading ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--accent-glow)]"}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Join with Google
              </button>

              {status.msg && (
                <p className={`m-0 text-center text-[0.78rem] ${statusColor}`}>
                  {status.msg}
                </p>
              )}

              <p className="text-center text-[0.72rem] leading-[1.6] text-app-3">
                By continuing you agree to Navix&apos;s Terms of Service and
                saved settings.
              </p>
            </div>
          </div>
        )}

        {step === "onboard-name" && (
          <>
            <h2 className="text-[1.5rem] font-bold tracking-[-0.03em] text-app">
              Welcome to Navix 👋
            </h2>
            <p className="text-[0.85rem] leading-[1.6] text-app-2">
              Let's personalise your setup — takes 30 seconds.
            </p>

            <div className="flex flex-col gap-2">
              <label className="text-[0.83rem] font-semibold text-app">
                Your name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex"
                maxLength={32}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleNameNext()}
              />
            </div>

            <PrimaryButton onClick={handleNameNext} full>
              Continue →
            </PrimaryButton>
            {status.msg && (
              <p className={`m-0 text-center text-[0.78rem] ${statusColor}`}>
                {status.msg}
              </p>
            )}
          </>
        )}

        {step === "onboard-industry" && (
          <>
            <h2 className="text-[1.5rem] font-bold tracking-[-0.03em] text-app">
              What do you do, {name.split(" ")[0]}?
            </h2>
            <p className="text-[0.85rem] leading-[1.6] text-app-2">
              We'll preload shortcuts that fit your workflow.
            </p>

            <div className="grid grid-cols-2 gap-[0.65rem]">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => setIndustry(ind.id)}
                  className={`cursor-pointer rounded-[9px] border-[1.5px] px-4 py-[0.85rem] text-left text-[0.85rem] transition-colors duration-200 ${
                    industry === ind.id
                      ? "border-[var(--accent)] bg-[var(--accent-glow)] text-[var(--accent)]"
                      : "border-app-2 bg-app-3 text-app-2"
                  }`}
                >
                  {ind.label}
                </button>
              ))}
            </div>

            <PrimaryButton
              onClick={handleIndustryNext}
              disabled={!industry}
              full
            >
              Let's go →
            </PrimaryButton>
            {status.msg && (
              <p className={`m-0 text-center text-[0.78rem] ${statusColor}`}>
                {status.msg}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
