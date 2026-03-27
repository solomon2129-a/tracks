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
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(180deg, #0D1623 0%, #191E29 100%)" }}
    >
      <div className="w-full max-w-xs flex flex-col items-center gap-8">
        <div className="relative">
          <div
            className="absolute inset-0 rounded-3xl blur-2xl"
            style={{ background: "rgba(1,195,141,0.2)", transform: "scale(1.4)" }}
          />
          <Image src="/logotr.png" alt="Tracksy" width={72} height={72} className="relative rounded-3xl" priority />
        </div>

        <div className="text-center">
          <h2 className="text-white text-2xl font-bold mb-1.5">Welcome back</h2>
          <p className="text-[#7A8EA0] text-sm">Enter your secret code to continue</p>
        </div>

        <div className="w-full">
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && value && handleSubmit()}
            placeholder="Secret code"
            autoFocus
            className="w-full rounded-2xl px-5 py-4 text-white text-center text-lg font-semibold tracking-widest outline-none transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: `1.5px solid ${error ? "#FF5A5F" : "rgba(255,255,255,0.08)"}`,
              boxShadow: error ? "0 0 0 4px rgba(255,90,95,0.12)" : "none",
            }}
          />
          {error && (
            <p className="text-[#FF5A5F] text-xs text-center mt-2.5 fade-up">Incorrect code. Try again.</p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!value}
          className="w-full font-bold py-4 rounded-2xl text-base active:scale-[0.97] transition-all"
          style={{
            background: value ? "linear-gradient(135deg,#01C38D,#00A070)" : "rgba(255,255,255,0.06)",
            color: value ? "#fff" : "#3D5166",
            boxShadow: value ? "0 4px 20px rgba(1,195,141,0.35)" : "none",
          }}
        >
          Unlock
        </button>
      </div>
    </div>
  );
}
