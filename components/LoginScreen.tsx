"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const { signup, login } = useAuth();
  const [step, setStep] = useState<"welcome" | "pin-setup">("welcome");
  const [hasExistingAccount, setHasExistingAccount] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if user already has an account
    const pinHash = localStorage.getItem("tracksy_pin_hash");
    setHasExistingAccount(!!pinHash);
  }, []);

  const handleCreateAccount = () => {
    setStep("pin-setup");
    setError("");
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await login();
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handlePinDigit = (digit: string, isConfirm: boolean) => {
    if (isConfirm) {
      if (confirmPin.length < 4) {
        setConfirmPin(confirmPin + digit);
      }
    } else {
      if (pin.length < 4) {
        setPin(pin + digit);
      }
    }
  };

  const handleBackspace = (isConfirm: boolean) => {
    if (isConfirm) {
      setConfirmPin(confirmPin.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  const handleSkipPin = async () => {
    setLoading(true);
    try {
      await signup(); // Uses default "0000"
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPin = async () => {
    if (pin.length !== 4 || confirmPin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }

    if (pin !== confirmPin) {
      setError("PINs don't match");
      setPin("");
      setConfirmPin("");
      return;
    }

    setLoading(true);
    try {
      await signup(pin);
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (step === "welcome") {
    return (
      <div className="min-h-screen flex flex-col px-6 max-w-md mx-auto" style={{ background: "#0F0F0F" }}>
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <Image src="/logotr.png" alt="Tracksy" width={80} height={80} className="rounded-3xl" priority />
          <div className="text-center">
            <h1 className="text-white text-4xl font-bold tracking-tight mb-2">Tracksy</h1>
            <p className="text-[#666] text-base">Track spending across your accounts</p>
          </div>
        </div>

        <div className="pb-12 flex flex-col gap-3">
          {hasExistingAccount ? (
            <>
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="w-full py-4 rounded-2xl font-bold text-base active:scale-[0.97] transition-transform disabled:opacity-50"
                style={{ background: "#fff", color: "#000" }}
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
              <button
                onClick={handleCreateAccount}
                className="w-full py-4 rounded-2xl font-bold text-base active:scale-[0.97] transition-transform"
                style={{ background: "#1A1A1A", color: "#fff", border: "1px solid #333" }}
              >
                Create Another Account
              </button>
            </>
          ) : (
            <button
              onClick={handleCreateAccount}
              className="w-full py-4 rounded-2xl font-bold text-base active:scale-[0.97] transition-transform"
              style={{ background: "#fff", color: "#000" }}
            >
              Create Account
            </button>
          )}
          <p className="text-center text-xs" style={{ color: "#333" }}>Your data is secure and private</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-6 max-w-md mx-auto" style={{ background: "#0F0F0F" }}>
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="text-center">
          <h2 className="text-white text-3xl font-bold mb-2">Set Up Secret PIN</h2>
          <p className="text-[#666] text-sm">Optional: Protect your app with a PIN (or skip to use 0000)</p>
        </div>

        <div className="w-full space-y-6">
          {/* PIN Entry */}
          <div>
            <label className="text-[#666] text-xs font-semibold block mb-3">Enter PIN</label>
            <div className="flex gap-3 justify-center">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-white font-bold text-xl transition-all"
                  style={{
                    borderColor: i < pin.length ? "#fff" : "#333",
                    background: i < pin.length ? "#fff" : "transparent",
                    color: i < pin.length ? "#000" : "#fff",
                  }}
                >
                  {i < pin.length ? "●" : ""}
                </div>
              ))}
            </div>
          </div>

          {/* PIN Confirm */}
          <div>
            <label className="text-[#666] text-xs font-semibold block mb-3">Confirm PIN</label>
            <div className="flex gap-3 justify-center">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-white font-bold text-xl transition-all"
                  style={{
                    borderColor: i < confirmPin.length ? "#fff" : "#333",
                    background: i < confirmPin.length ? "#fff" : "transparent",
                    color: i < confirmPin.length ? "#000" : "#fff",
                  }}
                >
                  {i < confirmPin.length ? "●" : ""}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </div>
      </div>

      {/* Numeric Keypad */}
      <div className="pb-20 grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => {
              if (pin.length < 4) handlePinDigit(String(num), false);
              else if (confirmPin.length < 4) handlePinDigit(String(num), true);
            }}
            disabled={loading}
            className="py-4 rounded-2xl font-bold text-xl transition-all active:scale-95"
            style={{ background: "#fff", color: "#000" }}
          >
            {num}
          </button>
        ))}

        <button
          onClick={() => {
            if (pin.length < 4) handlePinDigit("0", false);
            else if (confirmPin.length < 4) handlePinDigit("0", true);
          }}
          className="col-span-2 py-4 rounded-2xl font-bold text-xl transition-all active:scale-95"
          disabled={loading}
          style={{ background: "#fff", color: "#000" }}
        >
          0
        </button>

        <button
          onClick={() => {
            if (confirmPin.length > 0) handleBackspace(true);
            else if (pin.length > 0) handleBackspace(false);
          }}
          className="py-4 rounded-2xl font-bold text-lg transition-all active:scale-95"
          style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
        >
          ←
        </button>

        {/* Action Buttons */}
        <button
          onClick={handleSkipPin}
          disabled={loading}
          className="col-span-3 py-4 rounded-2xl font-bold transition-all active:scale-95"
          style={{
            background: "rgba(255,255,255,0.1)",
            color: "#666",
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? "Loading..." : "Skip (Use 0000)"}
        </button>

        <button
          onClick={handleSetPin}
          disabled={pin.length !== 4 || confirmPin.length !== 4 || loading}
          className="col-span-3 py-4 rounded-2xl font-bold transition-all active:scale-95"
          style={{
            background: pin.length === 4 && confirmPin.length === 4 ? "#fff" : "rgba(255,255,255,0.1)",
            color: pin.length === 4 && confirmPin.length === 4 ? "#000" : "#444",
            opacity: pin.length === 4 && confirmPin.length === 4 && !loading ? 1 : 0.5,
          }}
        >
          {loading ? "Creating..." : "Create Account"}
        </button>
      </div>
    </div>
  );
}
