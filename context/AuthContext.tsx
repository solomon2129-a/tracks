"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

interface AuthContextType {
  userId: string | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isPinUnlocked: boolean;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  completePinSetup: (pin?: string) => Promise<void>;
  changePin: (currentPin: string, newPin: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<void>;
  lock: () => void;
  logout: () => Promise<void>;
  resetAccount: () => void;
  hasCompletedPinSetup: () => boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function pinHashKey(uid: string) { return `tracksy_pin_${uid}`; }
function pinSetupDoneKey(uid: string) { return `tracksy_setup_${uid}`; }

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (!firebaseUser) setIsPinUnlocked(false);
    });
    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
    setUser(cred.user);
  };

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    setUser(cred.user);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(getFirebaseAuth(), provider);
    setUser(cred.user);
  };

  const hasCompletedPinSetup = (): boolean => {
    if (!user) return false;
    return !!localStorage.getItem(pinSetupDoneKey(user.uid));
  };

  const completePinSetup = async (pin?: string) => {
    if (!user) return;
    if (pin) {
      const hash = await hashPin(pin);
      localStorage.setItem(pinHashKey(user.uid), hash);
    }
    localStorage.setItem(pinSetupDoneKey(user.uid), "1");
    setIsPinUnlocked(true);
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    if (!user) return false;
    const storedHash = localStorage.getItem(pinHashKey(user.uid));
    if (!storedHash) {
      setIsPinUnlocked(true);
      return true;
    }
    const incomingHash = await hashPin(pin);
    if (incomingHash === storedHash) {
      setIsPinUnlocked(true);
      return true;
    }
    return false;
  };

  const changePin = async (currentPin: string, newPin: string): Promise<boolean> => {
    if (!user) return false;
    const storedHash = localStorage.getItem(pinHashKey(user.uid));
    if (storedHash) {
      const currentHash = await hashPin(currentPin);
      if (currentHash !== storedHash) return false;
    }
    const newHash = await hashPin(newPin);
    localStorage.setItem(pinHashKey(user.uid), newHash);
    return true;
  };

  const forgotPassword = async (email: string) => {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  };

  const lock = () => setIsPinUnlocked(false);

  const logout = async () => {
    await signOut(getFirebaseAuth());
    setIsPinUnlocked(false);
  };

  const resetAccount = () => {
    if (!user) return;
    localStorage.removeItem(pinHashKey(user.uid));
    localStorage.removeItem(pinSetupDoneKey(user.uid));
    signOut(getFirebaseAuth()).catch(() => {});
    setIsPinUnlocked(false);
  };

  return (
    <AuthContext.Provider
      value={{
        userId: user?.uid ?? null,
        user,
        loading,
        isAuthenticated: !!user,
        isPinUnlocked,
        signup,
        login,
        loginWithGoogle,
        verifyPin,
        completePinSetup,
        changePin,
        forgotPassword,
        lock,
        logout,
        resetAccount,
        hasCompletedPinSetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
