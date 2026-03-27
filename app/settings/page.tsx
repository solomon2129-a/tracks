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

  return (
    <div className="min-h-screen bg-[#191E29] flex flex-col pb-10">
      <div className="pt-14 pb-6 px-5 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-[#132046] flex items-center justify-center text-[#606E79] active:scale-95 transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-white text-xl font-bold">Settings</h1>
      </div>

      <div className="flex flex-col gap-3 px-5">
        <div className="bg-[#132046] rounded-3xl p-5 border border-[#2A3441]">
          <p className="text-white font-bold mb-1">Secret Code</p>
          <p className="text-[#606E79] text-xs mb-5">Change the code used to unlock the app.</p>
          <div className="flex flex-col gap-3">
            {["Current code", "New code", "Confirm new code"].map((ph, i) => {
              const vals = [currentPin, newPin, confirmPin];
              const setters = [setCurrentPin, setNewPin, setConfirmPin];
              return (
                <input
                  key={ph}
                  type="password"
                  placeholder={ph}
                  value={vals[i]}
                  onChange={(e) => setters[i](e.target.value)}
                  className="w-full bg-[#191E29] border border-[#2A3441] focus:border-[#01C38D] rounded-2xl px-4 py-3.5 text-white text-sm outline-none transition-colors placeholder-[#2A3441]"
                />
              );
            })}
            {error && <p className="text-[#FF5A5F] text-xs">{error}</p>}
            {success && <p className="text-[#01C38D] text-xs">Code updated successfully.</p>}
            <button
              onClick={handleChangePin}
              disabled={!currentPin || !newPin || !confirmPin}
              className="w-full bg-[#01C38D] text-[#191E29] font-bold py-4 rounded-2xl text-sm disabled:opacity-20 active:scale-[0.97] transition-all"
            >
              Update Code
            </button>
          </div>
        </div>

        <div className="bg-[#132046] rounded-3xl p-5 border border-[#2A3441]">
          <p className="text-white font-bold mb-1">Account</p>
          <p className="text-[#606E79] text-xs mb-5">Sign out of your Google account.</p>
          <button
            onClick={handleLogout}
            className="w-full bg-[rgba(255,90,95,0.08)] border border-[rgba(255,90,95,0.2)] text-[#FF5A5F] py-4 rounded-2xl font-semibold text-sm active:scale-[0.97] transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
