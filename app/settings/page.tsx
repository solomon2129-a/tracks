"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getStoredPin, setStoredPin } from "@/components/PinLock";

export default function SettingsPage() {
  const { logout } = useAuth();
  const router = useRouter();
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChangePin = () => {
    setError("");
    if (currentPin !== getStoredPin()) { setError("Current code is incorrect."); return; }
    if (newPin.length < 4) { setError("New code must be at least 4 characters."); return; }
    if (newPin !== confirmPin) { setError("New codes don't match."); return; }
    setStoredPin(newPin);
    setCurrentPin(""); setNewPin(""); setConfirmPin("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  };

  const handleLogout = async () => {
    sessionStorage.removeItem("tracksy_unlocked");
    await logout();
    router.push("/");
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1.5px solid rgba(255,255,255,0.08)",
    color: "#fff",
    borderRadius: 16,
    padding: "14px 16px",
    fontSize: 14,
    outline: "none",
    width: "100%",
    transition: "border-color 0.2s",
  };

  return (
    <div className="min-h-screen flex flex-col pb-10" style={{ background: "#191E29" }}>
      <div className="pt-14 pb-6 px-5 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "rgba(255,255,255,0.06)", color: "#7A8EA0" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-white text-xl font-bold">Settings</h1>
      </div>

      <div className="flex flex-col gap-3 px-5">
        {/* Change PIN */}
        <div className="rounded-3xl p-5" style={{ background: "#132046" }}>
          <p className="text-white font-bold mb-1">Secret Code</p>
          <p className="text-[#7A8EA0] text-xs mb-5">Change the code used to unlock the app.</p>
          <div className="flex flex-col gap-3">
            {[
              { placeholder: "Current code", value: currentPin, setter: setCurrentPin },
              { placeholder: "New code", value: newPin, setter: setNewPin },
              { placeholder: "Confirm new code", value: confirmPin, setter: setConfirmPin },
            ].map(({ placeholder, value, setter }) => (
              <input
                key={placeholder}
                type="password"
                placeholder={placeholder}
                value={value}
                onChange={(e) => setter(e.target.value)}
                style={inputStyle}
              />
            ))}
            {error && <p className="text-[#FF5A5F] text-xs">{error}</p>}
            {success && <p className="text-[#01C38D] text-xs">Code updated successfully.</p>}
            <button
              onClick={handleChangePin}
              disabled={!currentPin || !newPin || !confirmPin}
              className="w-full font-bold py-4 rounded-2xl text-sm active:scale-[0.97] transition-all"
              style={{
                background: currentPin && newPin && confirmPin
                  ? "linear-gradient(135deg,#01C38D,#00A070)"
                  : "rgba(255,255,255,0.06)",
                color: currentPin && newPin && confirmPin ? "#fff" : "#3D5166",
                boxShadow: currentPin && newPin && confirmPin ? "0 4px 16px rgba(1,195,141,0.3)" : "none",
              }}
            >
              Update Code
            </button>
          </div>
        </div>

        {/* Sign out */}
        <div className="rounded-3xl p-5" style={{ background: "#132046" }}>
          <p className="text-white font-bold mb-1">Account</p>
          <p className="text-[#7A8EA0] text-xs mb-5">Sign out of your Google account.</p>
          <button
            onClick={handleLogout}
            className="w-full py-4 rounded-2xl font-semibold text-sm active:scale-[0.97] transition-all"
            style={{
              background: "rgba(255,90,95,0.08)",
              border: "1.5px solid rgba(255,90,95,0.2)",
              color: "#FF5A5F",
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
