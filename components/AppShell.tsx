"use client";

import { useState, useEffect } from "react";
import PinLock from "./PinLock";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const isUnlocked = sessionStorage.getItem("tracksy_unlocked") === "1";
    setUnlocked(isUnlocked);
    setChecked(true);
  }, []);

  if (!checked) {
    return (
      <div className="min-h-screen bg-[#0C0C10] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!unlocked) {
    return <PinLock onUnlock={() => setUnlocked(true)} />;
  }

  return <>{children}</>;
}
