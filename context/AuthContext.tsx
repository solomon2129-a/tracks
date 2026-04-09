"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

interface AuthContextType {
  userId: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isPinUnlocked: boolean;
  signup: (pin?: string) => Promise<void>;
  login: () => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  changePin: (currentPin: string, newPin: string) => Promise<boolean>;
  /** Lock the app — shows PIN screen. Does NOT erase account. */
  logout: () => void;
  /** Wipe everything — used only in Settings > Reset Account */
  resetAccount: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);

  useEffect(() => {
    // Firebase Anonymous Auth persists in IndexedDB across reloads.
    // When we have a stored userId that matches the Firebase UID, Firestore rules pass.
    const storedUserId = localStorage.getItem("tracksy_user_id");

    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (firebaseUser) => {
      if (firebaseUser && storedUserId && firebaseUser.uid === storedUserId) {
        // Returning user — Firebase auth restored, userId matches
        setUserId(storedUserId);
        setIsAuthenticated(true);
      } else if (storedUserId && storedUserId.startsWith("user_")) {
        // Legacy local-only userId (created before anonymous auth) — still load them in
        setUserId(storedUserId);
        setIsAuthenticated(true);
      } else if (!storedUserId) {
        // Fresh install — no account yet
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (pin?: string) => {
    // Sign in anonymously to get a real Firebase UID — Firestore rules will pass
    let uid: string;
    try {
      const credential = await signInAnonymously(getFirebaseAuth());
      uid = credential.user.uid;
    } catch {
      // Fallback if Firebase is unavailable
      uid = `local_${Date.now()}`;
    }

    const pinToSet = pin || "0000";
    const hashedPin = await hashPin(pinToSet);
    localStorage.setItem("tracksy_user_id", uid);
    localStorage.setItem("tracksy_pin_hash", hashedPin);
    setUserId(uid);
    setIsAuthenticated(true);
    setIsPinUnlocked(true);
  };

  const login = async () => {
    const storedUserId = localStorage.getItem("tracksy_user_id");
    const storedHash = localStorage.getItem("tracksy_pin_hash");
    if (!storedUserId || !storedHash) throw new Error("No existing account found");
    setUserId(storedUserId);
    setIsAuthenticated(true);
    // isPinUnlocked stays false — AppShell will route to PinVerification
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    const storedHash = localStorage.getItem("tracksy_pin_hash");
    if (!storedHash) return false;
    const incomingHash = await hashPin(pin);
    if (incomingHash === storedHash) {
      setIsPinUnlocked(true);
      return true;
    }
    return false;
  };

  const changePin = async (currentPin: string, newPin: string): Promise<boolean> => {
    const isValid = await verifyPin(currentPin);
    if (!isValid) return false;
    const newHash = await hashPin(newPin);
    localStorage.setItem("tracksy_pin_hash", newHash);
    return true;
  };

  /** Lock the app — clears in-memory unlock flag only. Account stays. */
  const logout = () => {
    setIsPinUnlocked(false);
  };

  /** Wipe account completely — only from Settings > Reset Account. */
  const resetAccount = () => {
    localStorage.removeItem("tracksy_user_id");
    localStorage.removeItem("tracksy_pin_hash");
    setUserId(null);
    setIsAuthenticated(false);
    setIsPinUnlocked(false);
  };

  return (
    <AuthContext.Provider
      value={{ userId, loading, isAuthenticated, isPinUnlocked, signup, login, verifyPin, changePin, logout, resetAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export const useAuth = () => useContext(AuthContext);
