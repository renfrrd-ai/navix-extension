import { useAuthListener } from "@/hooks/useAuth";
import useAppStore from "@/hooks/useAppStore";
import AuthWall from "@/components/auth/AuthWall";
import NewTabPage from "@/pages/NewTabPage";
import Toast from "@/components/ui/Toast";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

export default function App() {
  // Start listening to Firebase auth state
  useAuthListener();

  const { user, userData, authReady } = useAppStore();

  // Determine if onboarding is needed: logged in but missing profile setup
  const needsOnboard =
    user &&
    userData &&
    (!(userData.name || user.displayName) || !userData.industry);

  return (
    <ErrorBoundary>
      {/* Show loading spinner while auth initialises */}
      {!authReady && (
        <div className="fixed inset-0 flex items-center justify-center bg-app">
          <div className="size-9 rounded-full border-[3px] border-app-2 border-t-(--accent) animate-spin-slow" />
        </div>
      )}

      {/* Not logged in OR needs onboarding → show auth wall */}
      {authReady && (!user || needsOnboard) && (
        <>
          <AuthWall />
          <Toast />
        </>
      )}

      {/* Fully authenticated and onboarded */}
      {authReady && user && !needsOnboard && (
        <>
          <NewTabPage />
          <Toast />
        </>
      )}
    </ErrorBoundary>
  );
}
