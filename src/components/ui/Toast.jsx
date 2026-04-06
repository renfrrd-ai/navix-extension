import { useEffect, useState } from "react";
import useAppStore from "@/hooks/useAppStore";

export default function Toast() {
  const toast = useAppStore((s) => s.toast);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      setVisible(true);
    } else {
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [toast]);

  if (!visible && !toast) return null;

  return (
    <div
      className={`font-app fixed bottom-12 left-1/2 z-1000 -translate-x-1/2 whitespace-nowrap rounded-[10px] border-[1.5px] border-app-2 bg-app-3 px-[1.4rem] py-[0.6rem] text-[0.85rem] text-app shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-opacity duration-200 ${toast ? "opacity-100" : "opacity-0"}`}
    >
      {toast?.message}
    </div>
  );
}
