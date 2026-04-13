"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { deleteAllTransactions } from "@/lib/firestore";
import {
  getPermissionStatus,
  requestPermission,
  notificationsEnabled,
  setNotificationsEnabled,
  scheduleForToday,
  registerSW,
  registerFcmToken,
  sendTestNotification,
} from "@/lib/notifications";
import {
  isBiometricSupported,
  isBiometricEnrolled,
  registerBiometric,
  removeBiometric,
} from "@/lib/biometric";

type Tab = "reminders" | "account" | "data";

const TABS: { id: Tab; label: string }[] = [
  { id: "reminders", label: "Reminders" },
  { id: "account",   label: "Account" },
  { id: "data",      label: "Data" },
];

export default function SettingsPage() {
  const { userId, user, changePin, lock, resetAccount } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) || "reminders");

  /* ── Reminders state ── */
  const [notifPermission, setNotifPermission] = useState<string>("default");
  const [notifOn, setNotifOn] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    setNotifPermission(getPermissionStatus());
    setNotifOn(notificationsEnabled());
  }, []);

  const handleNotifToggle = async () => {
    if (notifOn) {
      setNotificationsEnabled(false);
      setNotifOn(false);
      return;
    }
    const granted = await requestPermission();
    setNotifPermission(getPermissionStatus());
    if (granted) {
      setNotificationsEnabled(true);
      setNotifOn(true);
      if (userId) registerFcmToken(userId);
      registerSW().then(() => scheduleForToday());
      // Fire one immediately so the user knows it's working
      setTimeout(() => sendTestNotification(), 500);
    }
  };

  const handleTestNotification = async () => {
    setTestLoading(true);
    const ok = await sendTestNotification();
    setTestLoading(false);
    if (ok) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  /* ── Account state ── */
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin]         = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError]     = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [resetConfirm, setResetConfirm]     = useState(false);
  const [bioSupported, setBioSupported]     = useState(false);
  const [bioEnrolled, setBioEnrolled]       = useState(false);
  const [bioLoading, setBioLoading]         = useState(false);
  const [bioMsg, setBioMsg]                 = useState("");

  useEffect(() => {
    setBioSupported(isBiometricSupported());
    if (userId) setBioEnrolled(isBiometricEnrolled(userId));
  }, [userId]);

  const handleBioToggle = async () => {
    if (!userId || !user) return;
    if (bioEnrolled) {
      removeBiometric(userId);
      setBioEnrolled(false);
      setBioMsg("");
      return;
    }
    setBioLoading(true);
    setBioMsg("");
    const ok = await registerBiometric(userId, user.email ?? userId);
    setBioLoading(false);
    if (ok) {
      setBioEnrolled(true);
      setBioMsg("Face ID enabled. You can now unlock with your face.");
    } else {
      setBioMsg("Setup failed or was cancelled. Try again.");
    }
  };

  const handleChangePin = async () => {
    if (!newPin || !confirmPin || !currentPin) return;
    if (newPin.length < 4) { setPinError("New PIN must be at least 4 characters."); return; }
    if (newPin !== confirmPin) { setPinError("New PINs don't match."); return; }
    setPinLoading(true); setPinError("");
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

  /* ── Data state ── */
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [deleted, setDeleted]             = useState(false);

  const handleDeleteAll = async () => {
    if (!deleteConfirm) { setDeleteConfirm(true); setTimeout(() => setDeleteConfirm(false), 4000); return; }
    if (!userId) return;
    setDeleting(true);
    await deleteAllTransactions(userId);
    setDeleting(false); setDeleteConfirm(false); setDeleted(true);
    setTimeout(() => setDeleted(false), 3000);
  };

  const INPUT_STYLE = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#fff", borderRadius: 14,
    padding: "13px 16px", fontSize: 14,
    outline: "none", width: "100%",
  } as const;

  const canSave = currentPin.length >= 4 && newPin.length >= 4 && confirmPin.length >= 4;
  const blocked = notifPermission === "denied" || notifPermission === "unsupported";

  return (
    <div className="min-h-screen flex flex-col pb-10" style={{ background: "#0F0F0F" }}>
      {/* Header */}
      <div className="pt-14 pb-4 px-5 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
          style={{ background: "#1A1A1A" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-white text-xl font-bold">Settings</h1>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-5">
        <div className="flex gap-2">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                background: tab === t.id ? "#fff" : "rgba(255,255,255,0.06)",
                color:      tab === t.id ? "#000" : "#555",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5">

        {/* ── REMINDERS TAB ── */}
        {tab === "reminders" && (
          <>
            {/* Toggle card */}
            <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-white font-bold">Daily Reminders</p>
                  <p className="text-[#555] text-xs mt-0.5">5–8 nudges per day, 9am–10pm</p>
                </div>
                <button
                  onClick={handleNotifToggle}
                  disabled={blocked}
                  className="relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0"
                  style={{
                    background: notifOn ? "#22C55E" : "rgba(255,255,255,0.1)",
                    opacity: blocked ? 0.35 : 1,
                  }}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300"
                    style={{ left: notifOn ? "calc(100% - 22px)" : 2 }}
                  />
                </button>
              </div>

              {blocked && (
                <p className="text-[#F43F5E] text-xs mt-2">
                  {notifPermission === "denied"
                    ? "Blocked by browser — go to site settings to allow notifications."
                    : "Notifications not supported on this browser."}
                </p>
              )}

              {notifOn && !blocked && (
                <p className="text-[#22C55E] text-xs mt-1">
                  Active — you&apos;ll get reminders throughout the day.
                </p>
              )}
            </div>

            {/* Test button */}
            <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
              <p className="text-white font-bold mb-1">Test Notification</p>
              <p className="text-[#555] text-xs mb-4">
                Send a notification right now to see how they look.
              </p>
              <button
                onClick={handleTestNotification}
                disabled={testLoading || blocked}
                className="w-full py-3.5 rounded-2xl font-bold text-sm active:scale-[0.97] transition-all"
                style={{
                  background: testSent
                    ? "rgba(34,197,94,0.15)"
                    : blocked
                    ? "rgba(255,255,255,0.04)"
                    : "#fff",
                  color: testSent ? "#22C55E" : blocked ? "#444" : "#000",
                  border: testSent ? "1px solid rgba(34,197,94,0.3)" : "none",
                  opacity: blocked ? 0.4 : 1,
                }}
              >
                {testLoading ? "Sending…" : testSent ? "Sent ✓" : "Send Test Notification"}
              </button>
            </div>
          </>
        )}

        {/* ── ACCOUNT TAB ── */}
        {tab === "account" && (
          <>
            {/* Face ID */}
            {bioSupported && (
              <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-white font-bold">Face ID / Biometrics</p>
                    <p className="text-[#555] text-xs mt-0.5">Unlock Tracksy with your face or fingerprint</p>
                  </div>
                  <button
                    onClick={handleBioToggle}
                    disabled={bioLoading}
                    className="relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0"
                    style={{ background: bioEnrolled ? "#22C55E" : "rgba(255,255,255,0.1)" }}
                  >
                    <span
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300"
                      style={{ left: bioEnrolled ? "calc(100% - 22px)" : 2 }}
                    />
                  </button>
                </div>
                {bioLoading && <p className="text-[#555] text-xs mt-2">Waiting for biometric…</p>}
                {bioMsg && (
                  <p className="text-xs mt-2" style={{ color: bioEnrolled ? "#22C55E" : "#F43F5E" }}>{bioMsg}</p>
                )}
              </div>
            )}

            <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
              <p className="text-white font-bold mb-1">Change PIN</p>
              <p className="text-[#555] text-xs mb-4">Update the PIN used to unlock the app.</p>
              <div className="flex flex-col gap-2.5">
                {[
                  { placeholder: "Current PIN", value: currentPin, setter: setCurrentPin },
                  { placeholder: "New PIN",      value: newPin,     setter: setNewPin     },
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
                {pinError   && <p className="text-[#F43F5E] text-xs">{pinError}</p>}
                {pinSuccess && <p className="text-[#22C55E] text-xs">PIN updated successfully.</p>}
                <button
                  onClick={handleChangePin}
                  disabled={!canSave || pinLoading}
                  className="w-full font-bold py-3.5 rounded-2xl text-sm active:scale-[0.97] transition-all"
                  style={canSave && !pinLoading
                    ? { background: "#fff", color: "#000" }
                    : { background: "rgba(255,255,255,0.07)", color: "#444" }}
                >
                  {pinLoading ? "Verifying…" : "Update PIN"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
              <p className="text-white font-bold mb-1">Lock App</p>
              <p className="text-[#555] text-xs mb-4">Requires PIN to get back in.</p>
              <button
                onClick={() => lock()}
                className="w-full py-3.5 rounded-2xl font-semibold text-sm active:scale-[0.97]"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
              >
                Lock App
              </button>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
              <p className="text-white font-bold mb-1">Reset Account</p>
              <p className="text-[#555] text-xs mb-4">Permanently delete your account and all local data.</p>
              <button
                onClick={() => {
                  if (!resetConfirm) { setResetConfirm(true); setTimeout(() => setResetConfirm(false), 4000); return; }
                  resetAccount(); router.push("/");
                }}
                className="w-full py-3.5 rounded-2xl font-semibold text-sm active:scale-[0.97]"
                style={{
                  background: resetConfirm ? "rgba(244,63,94,0.15)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${resetConfirm ? "rgba(244,63,94,0.4)" : "rgba(255,255,255,0.08)"}`,
                  color: resetConfirm ? "#F43F5E" : "#888",
                }}
              >
                {resetConfirm ? "Tap again to confirm reset" : "Reset Account"}
              </button>
            </div>
          </>
        )}

        {/* ── DATA TAB ── */}
        {tab === "data" && (
          <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
            <p className="text-white font-bold mb-1">Clear All Transactions</p>
            <p className="text-[#555] text-xs mb-4">Permanently delete all transaction history. Cannot be undone.</p>
            {deleted && <p className="text-[#22C55E] text-xs mb-3">All transactions deleted.</p>}
            <button
              onClick={handleDeleteAll}
              disabled={deleting}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm active:scale-[0.97]"
              style={{
                background: deleteConfirm ? "rgba(244,63,94,0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${deleteConfirm ? "rgba(244,63,94,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: deleteConfirm ? "#F43F5E" : "#888",
              }}
            >
              {deleting ? "Deleting…" : deleteConfirm ? "Tap again to confirm" : "Clear All Transactions"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
