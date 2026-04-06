import { useEffect } from "react";
import { onAuthChange } from "@/services/auth";
import { loadUserData, syncToFirestore } from "@/services/data";
import useAppStore from "./useAppStore";

export function useAuthListener() {
  const {
    setUser,
    setUserData,
    setAuthReady,
    initSites,
    loadHistory,
    resetAll,
  } = useAppStore();

  useEffect(() => {
    let syncTimeoutId = null;
    let syncIntervalId = null;

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (syncTimeoutId) {
        window.clearTimeout(syncTimeoutId);
        syncTimeoutId = null;
      }

      if (syncIntervalId) {
        window.clearInterval(syncIntervalId);
        syncIntervalId = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const data = await loadUserData(firebaseUser);
          setUserData(data);
          initSites(data);
          useAppStore.setState({
            theme: data.theme || "t-midnight",
            font: data.font || "f-inter",
            devMode: data.devMode ?? false,
          });
          loadHistory();

          const runSyncCheck = () =>
            syncToFirestore(firebaseUser.uid).catch(() => {});

          syncTimeoutId = window.setTimeout(runSyncCheck, 5000);
          syncIntervalId = window.setInterval(
            runSyncCheck,
            60 * 60 * 1000,
          );
        } catch {
          resetAll();
        }
      } else {
        resetAll();
      }
      setAuthReady(true);
    });

    return () => {
      if (syncTimeoutId) window.clearTimeout(syncTimeoutId);
      if (syncIntervalId) window.clearInterval(syncIntervalId);
      unsubscribe();
    };
  }, []);
}
