"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function PinVerification() {
  const { verifyPin } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePinDigit = (digit: string) => {
    if (pin.length < 4) {
      setPin(pin + digit);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const verified = await verifyPin(pin);
      if (!verified) {
        setError("Invalid PIN");
        setPin("");
      }
    } catch (err) {
      setError("Something went wrong");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-6 max-w-md mx-auto" style={{ background: "#0F0F0F" }}>
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="text-center">
          <h1 className="text-white text-3xl font-bold mb-2">Unlock Tracksy</h1>
          <p className="text-[#666] text-sm">Enter your secret PIN to continue</p>
        </div>

        {/* PIN Display */}
        <div className="flex gap-3">
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

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      {/* Numeric Keypad */}
      <div className="pb-20 grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handlePinDigit(String(num))}
            disabled={pin.length >= 4 || loading}
            className="py-4 rounded-2xl font-bold text-xl transition-all active:scale-95"
            style={{
              background: "#fff",
              color: "#000",
              opacity: pin.length >= 4 ? 0.5 : 1,
            }}
          >
            {num}
          </button>
        ))}

        <button
          onClick={() => handlePinDigit("0")}
          className="col-span-2 py-4 rounded-2xl font-bold text-xl transition-all active:scale-95"
          disabled={pin.length >= 4 || loading}
          style={{
            background: "#fff",
            color: "#000",
            opacity: pin.length >= 4 ? 0.5 : 1,
          }}
        >
          0
        </button>

        <button
          onClick={handleBackspace}
          className="py-4 rounded-2xl font-bold text-lg transition-all active:scale-95"
          style={{
            background: "rgba(255,255,255,0.1)",
            color: "#fff",
          }}
        >
          ←
        </button>

        {/* Confirm Button */}
        <button
          onClick={handleSubmit}
          disabled={pin.length !== 4 || loading}
          className="col-span-3 py-4 rounded-2xl font-bold transition-all active:scale-95"
          style={{
            background: pin.length === 4 ? "#fff" : "rgba(255,255,255,0.1)",
            color: pin.length === 4 ? "#000" : "#444",
            opacity: pin.length === 4 && !loading ? 1 : 0.5,
          }}
        >
          {loading ? "Verifying..." : "Unlock"}
        </button>
      </div>
    </div>
  );
}
