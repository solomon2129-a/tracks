"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { isBiometricEnrolled, authenticateBiometric, isBiometricSupported } from "@/lib/biometric";

export default function PinVerification() {
  const { userId, user, verifyPin, forgotPassword } = useAuth();
  const [pin, setPin]               = useState("");
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [bioAvailable, setBioAvailable]   = useState(false);
  const [bioLoading, setBioLoading]       = useState(false);

  useEffect(() => {
    if (!userId) return;
    const pinHash = localStorage.getItem(`tracksy_pin_${userId}`);
    if (!pinHash) { verifyPin(""); return; }

    // Auto-trigger Face ID if enrolled
    if (isBiometricSupported() && isBiometricEnrolled(userId)) {
      setBioAvailable(true);
      handleFaceId(userId);
    }
  }, [userId]);

  const handleFaceId = async (uid?: string) => {
    const id = uid ?? userId;
    if (!id) return;
    setBioLoading(true);
    setError("");
    const ok = await authenticateBiometric(id);
    setBioLoading(false);
    if (ok) {
      await verifyPin("__biometric__"); // special token — see AuthContext
    } else {
      setError("Face ID failed. Use your PIN.");
    }
  };

  const handlePinDigit = (digit: string) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) setTimeout(() => handleSubmit(next), 100);
    }
  };

  const handleBackspace = () => { setPin(pin.slice(0, -1)); setError(""); };

  const handleSubmit = async (pinValue = pin) => {
    if (pinValue.length !== 4) return;
    setLoading(true); setError("");
    try {
      const verified = await verifyPin(pinValue);
      if (!verified) { setError("Incorrect PIN"); setPin(""); }
    } catch { setError("Something went wrong"); setPin(""); }
    finally { setLoading(false); }
  };

  const handleForgot = async () => {
    if (!user?.email) return;
    setForgotLoading(true);
    try { await forgotPassword(user.email); } catch {}
    finally { setForgotSent(true); setForgotLoading(false); }
  };

  if (showForgot) {
    return (
      <div className="min-h-screen flex flex-col px-6 max-w-md mx-auto fade-in" style={{ background: "#0F0F0F" }}>
        <div className="flex-1 flex flex-col justify-center gap-6">
          <button onClick={() => { setShowForgot(false); setForgotSent(false); }}
            className="self-start flex items-center gap-2 active:scale-95 transition-transform" style={{ color: "#666" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            <span className="text-sm font-semibold">Back</span>
          </button>
          <div>
            <h2 className="text-white text-3xl font-bold mb-2">Forgot PIN?</h2>
            <p className="text-[#555] text-sm">
              {user?.email ? `We'll send a password reset to ${user.email}.` : "Sign out and reset your password."}
            </p>
          </div>
          {forgotSent ? (
            <div className="rounded-2xl p-5 scale-in" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <p className="text-[#22C55E] font-semibold mb-1">Reset email sent!</p>
              <p className="text-[#22C55E] text-sm opacity-80">Check your inbox and sign in again to set a new PIN.</p>
            </div>
          ) : (
            <button onClick={handleForgot} disabled={forgotLoading}
              className="w-full py-4 rounded-2xl font-bold text-base active:scale-[0.97] transition-all"
              style={{ background: "#fff", color: "#000", opacity: forgotLoading ? 0.7 : 1 }}>
              {forgotLoading ? "Sending…" : "Send Reset Email"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-6 max-w-md mx-auto" style={{ background: "#0F0F0F" }}>
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="text-center fade-up">
          <h1 className="text-white text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-[#555] text-sm">
            {bioAvailable ? "Use Face ID or enter your PIN" : "Enter your PIN to continue"}
          </p>
        </div>

        {/* Face ID button */}
        {bioAvailable && (
          <button
            onClick={() => handleFaceId()}
            disabled={bioLoading}
            className="flex flex-col items-center gap-2 active:scale-90 transition-transform"
          >
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: bioLoading ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {bioLoading ? (
                <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : (
                /* Face ID icon */
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6V4a2 2 0 0 1 2-2h2"/><path d="M4 18v2a2 2 0 0 0 2 2h2"/>
                  <path d="M20 6V4a2 2 0 0 0-2-2h-2"/><path d="M20 18v2a2 2 0 0 1-2 2h-2"/>
                  <path d="M9 10h.01"/><path d="M15 10h.01"/>
                  <path d="M9.5 15a3.5 3.5 0 0 0 5 0"/>
                  <path d="M12 7v3"/>
                </svg>
              )}
            </div>
            <span className="text-xs font-semibold" style={{ color: "#555" }}>
              {bioLoading ? "Scanning…" : "Face ID"}
            </span>
          </button>
        )}

        {/* PIN dots */}
        <div className="flex gap-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i}
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200"
              style={{ background: i < pin.length ? "#fff" : "rgba(255,255,255,0.07)", transform: i < pin.length ? "scale(1.08)" : "scale(1)" }}>
              {i < pin.length && <div className="w-3 h-3 rounded-full" style={{ background: "#000" }} />}
            </div>
          ))}
        </div>

        {error && <p className="text-[#F43F5E] text-sm fade-in">{error}</p>}
      </div>

      {/* Keypad */}
      <div className="pb-12 grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button key={num} onClick={() => handlePinDigit(String(num))}
            disabled={pin.length >= 4 || loading}
            className="py-4 rounded-2xl font-bold text-xl active:scale-95 transition-all"
            style={{ background: "rgba(255,255,255,0.07)", color: "#fff" }}>
            {num}
          </button>
        ))}
        <button onClick={() => setShowForgot(true)}
          className="py-4 rounded-2xl text-xs font-semibold active:scale-95 transition-all"
          style={{ background: "transparent", color: "#3A3A3A" }}>
          Forgot?
        </button>
        <button onClick={() => handlePinDigit("0")} disabled={pin.length >= 4 || loading}
          className="py-4 rounded-2xl font-bold text-xl active:scale-95 transition-all"
          style={{ background: "rgba(255,255,255,0.07)", color: "#fff" }}>
          0
        </button>
        <button onClick={handleBackspace} disabled={loading}
          className="py-4 rounded-2xl text-xl active:scale-95 transition-all"
          style={{ background: "transparent", color: "#666" }}>
          ←
        </button>
      </div>
    </div>
  );
}
