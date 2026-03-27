"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import PinLock from "./PinLock";
import LoginScreen from "./LoginScreen";
import SplashScreen from "./SplashScreen";

type Phase = "splash" | "loading" | "auth" | "pin-setup" | "pin-entry" | "app";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);
  const [phase, setPhase] = useState<Phase>("splash");

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!splashDone) return;
    if (loading) { setPhase("loading"); return; }
    if (!user) { setPhase("auth"); return; }

    // Migrate old global PIN to per-user key
    const pinKey = `tracksy_pin_${user.uid}`;
    if (!localStorage.getItem(pinKey)) {
      const oldPin = localStorage.getItem("tracksy_pin");
      if (oldPin) localStorage.setItem(pinKey, oldPin);
    }

    const hasPin = !!localStorage.getItem(pinKey);
    if (!hasPin) { setPhase("pin-setup"); return; }

    const unlocked = sessionStorage.getItem("tracksy_unlocked") === "1";
    setPhase(unlocked ? "app" : "pin-entry");
  }, [splashDone, loading, user]);

  if (phase === "splash") return <SplashScreen />;

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F0F0F" }}>
        <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  if (phase === "auth") return <LoginScreen />;

  if ((phase === "pin-setup" || phase === "pin-entry") && user) {
    return (
      <PinLock
        mode={phase === "pin-setup" ? "setup" : "verify"}
        userId={user.uid}
        onUnlock={() => setPhase("app")}
      />
    );
  }

  if (phase === "app") return <>{children}</>;

  return <SplashScreen />;
}
