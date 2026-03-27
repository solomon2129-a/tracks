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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#191E29" }}>
        <div className="w-8 h-8 border-2 border-[#01C38D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!unlocked) {
    return <PinLock onUnlock={() => setUnlocked(true)} />;
  }

  return <>{children}</>;
}
