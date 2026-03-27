"use client";

import { useState } from "react";
import Image from "next/image";

const DEFAULT_PIN = "jessica27";

export function getStoredPin(): string {
  if (typeof window === "undefined") return DEFAULT_PIN;
  return localStorage.getItem("tracksy_pin") ?? DEFAULT_PIN;
}

export function setStoredPin(pin: string) {
  localStorage.setItem("tracksy_pin", pin);
}

interface PinLockProps {
  onUnlock: () => void;
}

export default function PinLock({ onUnlock }: PinLockProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = () => {
    const pin = getStoredPin();
    if (value === pin) {
      sessionStorage.setItem("tracksy_unlocked", "1");
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setValue("");
      setTimeout(() => { setShake(false); setError(false); }, 800);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="min-h-screen bg-[#0C0C10] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs flex flex-col items-center gap-8">
        <Image src="/logotr.png" alt="Tracksy" width={72} height={72} className="rounded-2xl" priority />

        <div className="text-center">
          <h2 className="text-white text-2xl font-bold mb-1">Welcome back</h2>
          <p className="text-[#3A3A4A] text-sm">Enter your secret code to continue</p>
        </div>

        <div className={`w-full transition-all ${shake ? "animate-bounce" : ""}`}>
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Secret code"
            autoFocus
            className={`w-full bg-[#131318] border rounded-2xl px-5 py-4 text-white text-center text-lg font-semibold tracking-widest outline-none transition-all duration-200 placeholder-[#2A2A38] ${
              error ? "border-red-500" : "border-[#1F1F2A] focus:border-indigo-500"
            }`}
          />
          {error && (
            <p className="text-red-400 text-xs text-center mt-2 fade-up">Incorrect code. Try again.</p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!value}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-semibold text-base disabled:opacity-20 transition-all active:scale-[0.97] shadow-lg shadow-indigo-900/40"
        >
          Unlock
        </button>
      </div>
    </div>
  );
}
