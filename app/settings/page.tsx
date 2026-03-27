"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { deleteAllTransactions } from "@/lib/firestore";

const INPUT_STYLE = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#fff",
  borderRadius: 14,
  padding: "13px 16px",
  fontSize: 14,
  outline: "none",
  width: "100%",
} as const;

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleChangePin = () => {
    if (!user) return;
    setPinError("");
    const pinKey = `tracksy_pin_${user.uid}`;
    const stored = localStorage.getItem(pinKey) ?? "jessica27";
    if (currentPin !== stored) { setPinError("Current code is incorrect."); return; }
    if (newPin.length < 4) { setPinError("New code must be at least 4 characters."); return; }
    if (newPin !== confirmPin) { setPinError("New codes don't match."); return; }
    localStorage.setItem(pinKey, newPin);
    setCurrentPin(""); setNewPin(""); setConfirmPin("");
    setPinSuccess(true);
    setTimeout(() => setPinSuccess(false), 2500);
  };

  const handleDeleteAll = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 4000);
      return;
    }
    if (!user) return;
    setDeleting(true);
    await deleteAllTransactions(user.uid);
    setDeleting(false);
    setDeleteConfirm(false);
    setDeleted(true);
    setTimeout(() => setDeleted(false), 3000);
  };

  const handleLogout = async () => {
    sessionStorage.removeItem("tracksy_unlocked");
    await logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col pb-10" style={{ background: "#0F0F0F" }}>
      {/* Header */}
      <div className="pt-14 pb-5 px-5 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "#1A1A1A" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-white text-xl font-bold">Settings</h1>
      </div>

      <div className="flex flex-col gap-3 px-5">
        {/* Change PIN */}
        <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
          <p className="text-white font-bold mb-1">Secret Code</p>
          <p className="text-[#555] text-xs mb-4">Change the code used to unlock the app.</p>
          <div className="flex flex-col gap-2.5">
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
                onChange={e => setter(e.target.value)}
                style={INPUT_STYLE}
              />
            ))}
            {pinError && <p className="text-[#F43F5E] text-xs">{pinError}</p>}
            {pinSuccess && <p className="text-[#22C55E] text-xs">Code updated successfully.</p>}
            <button
              onClick={handleChangePin}
              disabled={!currentPin || !newPin || !confirmPin}
              className="w-full font-bold py-3.5 rounded-2xl text-sm active:scale-[0.97] transition-all"
              style={
                currentPin && newPin && confirmPin
                  ? { background: "#fff", color: "#000" }
                  : { background: "rgba(255,255,255,0.07)", color: "#444" }
              }
            >
              Update Code
            </button>
          </div>
        </div>

        {/* Clear all data */}
        <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
          <p className="text-white font-bold mb-1">Clear All Data</p>
          <p className="text-[#555] text-xs mb-4">
            Permanently delete all your transactions. This cannot be undone.
          </p>
          {deleted && <p className="text-[#22C55E] text-xs mb-3">All transactions deleted.</p>}
          <button
            onClick={handleDeleteAll}
            disabled={deleting}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm active:scale-[0.97] transition-all"
            style={{
              background: deleteConfirm ? "rgba(244,63,94,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${deleteConfirm ? "rgba(244,63,94,0.4)" : "rgba(255,255,255,0.08)"}`,
              color: deleteConfirm ? "#F43F5E" : "#888",
            }}
          >
            {deleting ? "Deleting…" : deleteConfirm ? "Tap again to confirm" : "Clear All Transactions"}
          </button>
        </div>

        {/* Sign out */}
        <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
          <p className="text-white font-bold mb-1">Account</p>
          <p className="text-[#555] text-xs mb-4">Sign out of your Google account.</p>
          <button
            onClick={handleLogout}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm active:scale-[0.97] transition-all"
            style={{
              background: "rgba(244,63,94,0.08)",
              border: "1px solid rgba(244,63,94,0.2)",
              color: "#F43F5E",
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
