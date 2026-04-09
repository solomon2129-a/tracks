"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function PinSetup() {
  const { completePinSetup } = useAuth();
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"set" | "confirm">("set");

  const currentVal = phase === "set" ? pin : confirm;

  const handleDigit = (digit: string) => {
    setError("");
    if (phase === "set") {
      if (pin.length >= 4) return;
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) setTimeout(() => setPhase("confirm"), 250);
    } else {
      if (confirm.length >= 4) return;
      const next = confirm + digit;
      setConfirm(next);
      if (next.length === 4) {
        setTimeout(async () => {
          if (next === pin) {
            setLoading(true);
            await completePinSetup(pin);
            setLoading(false);
          } else {
            setError("PINs don't match. Try again.");
            setPin("");
            setConfirm("");
            setPhase("set");
          }
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    setError("");
    if (phase === "confirm") {
      if (confirm.length > 0) setConfirm(confirm.slice(0, -1));
      else { setPhase("set"); }
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    await completePinSetup();
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col px-6 max-w-md mx-auto" style={{ background: "#0F0F0F" }}>
      <div className="flex-1 flex flex-col items-center justify-center gap-10">
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center scale-in"
          style={{ background: "#1A1A1A" }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        {/* Title */}
        <div key={phase} className="text-center fade-in">
          <h2 className="text-white text-3xl font-bold mb-2">
            {phase === "set" ? "Set a PIN" : "Confirm PIN"}
          </h2>
          <p className="text-[#555] text-sm">
            {phase === "set" ? "Protect your finances with a PIN" : "Enter the same 4 digits again"}
          </p>
        </div>

        {/* PIN dots */}
        <div className="flex gap-4">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                background: i < currentVal.length ? "#fff" : "rgba(255,255,255,0.07)",
                transform: i < currentVal.length ? "scale(1.08)" : "scale(1)",
              }}
            >
              {i < currentVal.length && (
                <div className="w-3 h-3 rounded-full" style={{ background: "#000" }} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-[#F43F5E] text-sm text-center fade-in">{error}</p>
        )}
      </div>

      {/* Keypad */}
      <div className="pb-12 grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handleDigit(String(num))}
            disabled={loading || currentVal.length >= 4}
            className="py-4 rounded-2xl font-bold text-xl active:scale-95 transition-all"
            style={{ background: "rgba(255,255,255,0.07)", color: "#fff" }}
          >
            {num}
          </button>
        ))}

        <button
          onClick={handleSkip}
          disabled={loading}
          className="py-4 rounded-2xl font-semibold text-xs active:scale-95 transition-all"
          style={{ background: "transparent", color: "#3A3A3A" }}
        >
          Skip
        </button>

        <button
          onClick={() => handleDigit("0")}
          disabled={loading || currentVal.length >= 4}
          className="py-4 rounded-2xl font-bold text-xl active:scale-95 transition-all"
          style={{ background: "rgba(255,255,255,0.07)", color: "#fff" }}
        >
          0
        </button>

        <button
          onClick={handleBackspace}
          disabled={loading}
          className="py-4 rounded-2xl text-xl active:scale-95 transition-all"
          style={{ background: "transparent", color: "#666" }}
        >
          ←
        </button>
      </div>
    </div>
  );
}
