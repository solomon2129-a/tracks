"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { deleteAllTransactions } from "@/lib/firestore";

export default function SettingsPage() {
  const { userId, changePin, logout, resetAccount } = useAuth();
  const router = useRouter();
  const [resetConfirm, setResetConfirm] = useState(false);

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleChangePin = async () => {
    if (!newPin || !confirmPin || !currentPin) return;
    if (newPin.length < 4) { setPinError("New PIN must be at least 4 characters."); return; }
    if (newPin !== confirmPin) { setPinError("New PINs don't match."); return; }

    setPinLoading(true);
    setPinError("");
    const ok = await changePin(currentPin, newPin);
    setPinLoading(false);

    if (!ok) {
      setPinError("Current PIN is incorrect.");
    } else {
      setCurrentPin(""); setNewPin(""); setConfirmPin("");
      setPinSuccess(true);
      setTimeout(() => setPinSuccess(false), 2500);
    }
  };

  const handleDeleteAll = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 4000);
      return;
    }
    if (!userId) return;
    setDeleting(true);
    await deleteAllTransactions(userId);
    setDeleting(false);
    setDeleteConfirm(false);
    setDeleted(true);
    setTimeout(() => setDeleted(false), 3000);
  };

  const handleLock = () => {
    logout(); // just locks — keeps account intact
  };

  const handleReset = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 4000);
      return;
    }
    resetAccount(); // wipes everything
    router.push("/");
  };

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

  const canSave = currentPin.length >= 4 && newPin.length >= 4 && confirmPin.length >= 4;

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
          <p className="text-white font-bold mb-1">Change PIN</p>
          <p className="text-[#555] text-xs mb-4">Update the PIN used to unlock the app.</p>
          <div className="flex flex-col gap-2.5">
            {[
              { placeholder: "Current PIN", value: currentPin, setter: setCurrentPin },
              { placeholder: "New PIN", value: newPin, setter: setNewPin },
              { placeholder: "Confirm new PIN", value: confirmPin, setter: setConfirmPin },
            ].map(({ placeholder, value, setter }) => (
              <input
                key={placeholder}
                type="password"
                inputMode="numeric"
                placeholder={placeholder}
                value={value}
                onChange={e => setter(e.target.value)}
                style={INPUT_STYLE}
              />
            ))}
            {pinError && <p className="text-[#F43F5E] text-xs">{pinError}</p>}
            {pinSuccess && <p className="text-[#22C55E] text-xs">PIN updated successfully.</p>}
            <button
              onClick={handleChangePin}
              disabled={!canSave || pinLoading}
              className="w-full font-bold py-3.5 rounded-2xl text-sm active:scale-[0.97] transition-all"
              style={
                canSave && !pinLoading
                  ? { background: "#fff", color: "#000" }
                  : { background: "rgba(255,255,255,0.07)", color: "#444" }
              }
            >
              {pinLoading ? "Verifying…" : "Update PIN"}
            </button>
          </div>
        </div>

        {/* Clear all data */}
        <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
          <p className="text-white font-bold mb-1">Clear All Transactions</p>
          <p className="text-[#555] text-xs mb-4">
            Permanently delete all transaction history. This cannot be undone.
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

        {/* Lock */}
        <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
          <p className="text-white font-bold mb-1">Lock App</p>
          <p className="text-[#555] text-xs mb-4">Lock Tracksy. Your account and data stay safe — just re-enter your PIN to get back in.</p>
          <button
            onClick={handleLock}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm active:scale-[0.97] transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
            }}
          >
            Lock App
          </button>
        </div>

        {/* Reset account */}
        <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
          <p className="text-white font-bold mb-1">Reset Account</p>
          <p className="text-[#555] text-xs mb-4">Permanently delete your account and all local data. This cannot be undone.</p>
          <button
            onClick={handleReset}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm active:scale-[0.97] transition-all"
            style={{
              background: resetConfirm ? "rgba(244,63,94,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${resetConfirm ? "rgba(244,63,94,0.4)" : "rgba(255,255,255,0.08)"}`,
              color: resetConfirm ? "#F43F5E" : "#888",
            }}
          >
            {resetConfirm ? "Tap again to confirm reset" : "Reset Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
