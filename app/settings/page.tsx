"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getStoredPin, setStoredPin } from "@/components/PinLock";

export default function SettingsPage() {
  const { logout } = useAuth();
  const router = useRouter();

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);

  const handleChangePin = () => {
    setPinError("");
    const stored = getStoredPin();
    if (currentPin !== stored) {
      setPinError("Current code is incorrect.");
      return;
    }
    if (newPin.length < 4) {
      setPinError("New code must be at least 4 characters.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("New codes don't match.");
      return;
    }
    setStoredPin(newPin);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setPinSuccess(true);
    setTimeout(() => setPinSuccess(false), 2500);
  };

  const handleLogout = async () => {
    sessionStorage.removeItem("tracksy_unlocked");
    await logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#0C0C10] flex flex-col pb-10">
      {/* Header */}
      <div className="pt-16 pb-6 px-5 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-2xl bg-[#131318] border border-[#1F1F2A] flex items-center justify-center text-[#4A4A5A] active:scale-95 transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      <div className="flex flex-col gap-3 px-5">
        {/* Change PIN */}
        <div className="bg-[#131318] rounded-3xl p-5 border border-[#1F1F2A]">
          <p className="text-white font-bold mb-1">Change Secret Code</p>
          <p className="text-[#3A3A4A] text-xs mb-5">Update the code used to unlock the app.</p>

          <div className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Current code"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              className="w-full bg-[#0C0C10] border border-[#1F1F2A] focus:border-indigo-500 rounded-2xl px-4 py-3.5 text-white text-sm outline-none transition-colors placeholder-[#2A2A38]"
            />
            <input
              type="password"
              placeholder="New code"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              className="w-full bg-[#0C0C10] border border-[#1F1F2A] focus:border-indigo-500 rounded-2xl px-4 py-3.5 text-white text-sm outline-none transition-colors placeholder-[#2A2A38]"
            />
            <input
              type="password"
              placeholder="Confirm new code"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className="w-full bg-[#0C0C10] border border-[#1F1F2A] focus:border-indigo-500 rounded-2xl px-4 py-3.5 text-white text-sm outline-none transition-colors placeholder-[#2A2A38]"
            />

            {pinError && <p className="text-red-400 text-xs">{pinError}</p>}
            {pinSuccess && <p className="text-emerald-400 text-xs">Code updated successfully.</p>}

            <button
              onClick={handleChangePin}
              disabled={!currentPin || !newPin || !confirmPin}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-semibold text-sm disabled:opacity-20 transition-all active:scale-[0.97]"
            >
              Update Code
            </button>
          </div>
        </div>

        {/* Sign out */}
        <div className="bg-[#131318] rounded-3xl p-5 border border-[#1F1F2A]">
          <p className="text-white font-bold mb-1">Account</p>
          <p className="text-[#3A3A4A] text-xs mb-5">Sign out of your Google account.</p>
          <button
            onClick={handleLogout}
            className="w-full bg-red-500/10 border border-red-500/20 text-red-400 py-4 rounded-2xl font-semibold text-sm transition-all active:scale-[0.97]"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
