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

  const handleSubmit = () => {
    if (value === getStoredPin()) {
      sessionStorage.setItem("tracksy_unlocked", "1");
      onUnlock();
    } else {
      setError(true);
      setValue("");
      setTimeout(() => setError(false), 1200);
    }
  };

  return (
    <div className="min-h-screen bg-[#191E29] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs flex flex-col items-center gap-8">
        <Image src="/logotr.png" alt="Tracksy" width={64} height={64} className="rounded-2xl" priority />

        <div className="text-center">
          <h2 className="text-white text-2xl font-bold mb-1">Welcome back</h2>
          <p className="text-[#606E79] text-sm">Enter your secret code</p>
        </div>

        <div className="w-full">
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && value && handleSubmit()}
            placeholder="Secret code"
            autoFocus
            className={`w-full bg-[#132046] border rounded-2xl px-5 py-4 text-white text-center text-lg font-semibold tracking-widest outline-none transition-all duration-200 placeholder-[#2A3441] ${
              error ? "border-[#FF5A5F]" : "border-[#2A3441] focus:border-[#01C38D]"
            }`}
          />
          {error && (
            <p className="text-[#FF5A5F] text-xs text-center mt-2 fade-up">Incorrect code. Try again.</p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!value}
          className="w-full bg-[#01C38D] text-[#191E29] font-bold py-4 rounded-2xl text-base disabled:opacity-20 active:scale-[0.97] transition-all"
        >
          Unlock
        </button>
      </div>
    </div>
  );
}
