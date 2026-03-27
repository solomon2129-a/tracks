"use client";

import { useState } from "react";
import Image from "next/image";

interface PinLockProps {
  mode: "setup" | "verify";
  userId: string;
  onUnlock: () => void;
}

export default function PinLock({ mode, userId, onUnlock }: PinLockProps) {
  const [value, setValue] = useState("");
  const [confirmValue, setConfirmValue] = useState("");
  const [setupStep, setSetupStep] = useState<"enter" | "confirm">("enter");
  const [error, setError] = useState("");

  const pinKey = `tracksy_pin_${userId}`;

  const handleVerify = () => {
    const stored = localStorage.getItem(pinKey);
    if (value === stored) {
      sessionStorage.setItem("tracksy_unlocked", "1");
      onUnlock();
    } else {
      setError("Incorrect code. Try again.");
      setValue("");
      setTimeout(() => setError(""), 1500);
    }
  };

  const handleSetup = () => {
    if (setupStep === "enter") {
      if (value.length < 4) {
        setError("Must be at least 4 characters.");
        return;
      }
      setError("");
      setSetupStep("confirm");
    } else {
      if (confirmValue !== value) {
        setError("Codes don't match. Try again.");
        setConfirmValue("");
        return;
      }
      localStorage.setItem(pinKey, value);
      sessionStorage.setItem("tracksy_unlocked", "1");
      onUnlock();
    }
  };

  const isVerify = mode === "verify";
  const currentVal = isVerify ? value : setupStep === "confirm" ? confirmValue : value;
  const setCurrentVal = isVerify
    ? setValue
    : setupStep === "confirm"
    ? setConfirmValue
    : setValue;

  const title = isVerify
    ? "Welcome back"
    : setupStep === "enter"
    ? "Create a secret code"
    : "Confirm your code";

  const subtitle = isVerify
    ? "Enter your secret code to continue"
    : setupStep === "enter"
    ? "Choose a code to secure your data"
    : "Re-enter the same code";

  const btnLabel = isVerify ? "Unlock" : setupStep === "enter" ? "Continue" : "Set Code";
  const isValid = currentVal.length >= (mode === "setup" && setupStep === "enter" ? 4 : 1);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "#0F0F0F" }}
    >
      <div className="w-full max-w-xs flex flex-col items-center gap-8">
        <Image src="/logotr.png" alt="Tracksy" width={60} height={60} className="rounded-2xl" priority />

        <div className="text-center">
          <h2 className="text-white text-2xl font-bold mb-1">{title}</h2>
          <p className="text-[#666] text-sm">{subtitle}</p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <input
            type="password"
            value={currentVal}
            onChange={(e) => setCurrentVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && isValid && (isVerify ? handleVerify() : handleSetup())}
            placeholder={setupStep === "confirm" ? "Confirm code" : "Secret code"}
            autoFocus
            className="w-full rounded-2xl px-5 py-4 text-white text-center text-lg font-semibold tracking-widest outline-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: `1.5px solid ${error ? "#F43F5E" : "rgba(255,255,255,0.08)"}`,
            }}
          />
          {error && <p className="text-[#F43F5E] text-xs text-center">{error}</p>}
          <button
            onClick={isVerify ? handleVerify : handleSetup}
            disabled={!isValid}
            className="w-full font-bold py-4 rounded-2xl text-base active:scale-[0.97] transition-all"
            style={{
              background: isValid ? "#FFFFFF" : "rgba(255,255,255,0.07)",
              color: isValid ? "#000" : "#444",
            }}
          >
            {btnLabel}
          </button>
          {mode === "setup" && setupStep === "confirm" && (
            <button
              onClick={() => { setSetupStep("enter"); setConfirmValue(""); setError(""); }}
              className="text-[#666] text-sm text-center active:opacity-60 py-1"
            >
              Go back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
