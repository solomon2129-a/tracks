"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import LoginScreen from "./LoginScreen";
import PinVerification from "./PinVerification";
import SplashScreen from "./SplashScreen";
import AccountSetup from "./AccountSetup";
import { getOrCreateUserProfile } from "@/lib/firestore";

type Phase = "splash" | "loading" | "login" | "pin-verify" | "account-setup" | "app";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { userId, loading, isAuthenticated, isPinUnlocked } = useAuth();
  const [splashDone, setSplashDone] = useState(false);
  const [phase, setPhase] = useState<Phase>("splash");
  const [needsAccountSetup, setNeedsAccountSetup] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!splashDone || loading) return;

    // Not authenticated yet
    if (!isAuthenticated || !userId) {
      setPhase("login");
      return;
    }

    // Authenticated but PIN not verified
    if (!isPinUnlocked) {
      setPhase("pin-verify");
      return;
    }

    // PIN is verified, check if accounts are set up
    const checkSetup = async () => {
      try {
        const profile = await getOrCreateUserProfile(userId);
        if (profile.accounts.length === 0) {
          setNeedsAccountSetup(true);
          setPhase("account-setup");
        } else {
          setPhase("app");
        }
      } catch (error) {
        console.error("Error checking profile:", error);
        setPhase("app");
      }
    };

    checkSetup();
  }, [splashDone, loading, isAuthenticated, isPinUnlocked, userId]);

  if (phase === "splash") return <SplashScreen />;

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F0F0F" }}>
        <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  if (phase === "login") return <LoginScreen />;

  if (phase === "pin-verify") return <PinVerification />;

  if (phase === "account-setup" && userId) {
    return <AccountSetup onComplete={() => setPhase("app")} />;
  }

  if (phase === "app") return <>{children}</>;

  return <SplashScreen />;
}

