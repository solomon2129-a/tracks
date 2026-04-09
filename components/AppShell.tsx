"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import LoginScreen from "./LoginScreen";
import PinSetup from "./PinSetup";
import PinVerification from "./PinVerification";
import SplashScreen from "./SplashScreen";
import AccountSetup from "./AccountSetup";
import { getOrCreateUserProfile } from "@/lib/firestore";

type Phase = "splash" | "loading" | "login" | "pin-setup" | "pin-verify" | "account-setup" | "app";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { userId, loading, isAuthenticated, isPinUnlocked, hasCompletedPinSetup } = useAuth();
  const [splashDone, setSplashDone] = useState(false);
  const [phase, setPhase] = useState<Phase>("splash");

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 1400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!splashDone || loading) return;

    if (!isAuthenticated || !userId) {
      setPhase("login");
      return;
    }

    if (!hasCompletedPinSetup()) {
      setPhase("pin-setup");
      return;
    }

    if (!isPinUnlocked) {
      setPhase("pin-verify");
      return;
    }

    // PIN verified — check if accounts are set up
    const checkAccounts = async () => {
      try {
        const profile = await getOrCreateUserProfile(userId);
        setPhase(profile.accounts.length === 0 ? "account-setup" : "app");
      } catch {
        setPhase("app");
      }
    };
    checkAccounts();
  }, [splashDone, loading, isAuthenticated, isPinUnlocked, userId]);

  if (phase === "splash" || phase === "loading") return <SplashScreen />;

  if (phase === "login") return <LoginScreen />;

  if (phase === "pin-setup") return <PinSetup />;

  if (phase === "pin-verify") return <PinVerification />;

  if (phase === "account-setup" && userId) {
    return <AccountSetup onComplete={() => setPhase("app")} />;
  }

  if (phase === "app") return <>{children}</>;

  return <SplashScreen />;
}
