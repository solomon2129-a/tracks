"use client";

import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

type Tab = "signin" | "signup";

const INPUT_STYLE = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 14,
  color: "#fff",
  padding: "16px",
  fontSize: 16,
  outline: "none",
  width: "100%",
} as const;

export default function LoginScreen() {
  const { signup, login, forgotPassword } = useAuth();
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const switchTab = (t: Tab) => {
    setTab(t);
    setError("");
    setPassword("");
    setConfirmPass("");
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (tab === "signup" && password !== confirmPass) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");
    try {
      if (tab === "signin") {
        await login(email.trim(), password);
      } else {
        await signup(email.trim(), password);
      }
    } catch (err: any) {
      const code: string = err?.code || "";
      if (code.includes("user-not-found") || code.includes("wrong-password") || code.includes("invalid-credential")) {
        setError("Incorrect email or password");
      } else if (code.includes("email-already-in-use")) {
        setError("Account already exists — try Sign In");
      } else if (code.includes("invalid-email")) {
        setError("Invalid email address");
      } else if (code.includes("weak-password")) {
        setError("Password must be at least 6 characters");
      } else {
        setError("Something went wrong. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    try {
      await forgotPassword(forgotEmail.trim());
    } catch {
      // Always show success to prevent email enumeration
    } finally {
      setForgotSent(true);
      setForgotLoading(false);
    }
  };

  if (showForgot) {
    return (
      <div className="min-h-screen flex flex-col px-6 max-w-md mx-auto fade-in" style={{ background: "#0F0F0F" }}>
        <div className="flex-1 flex flex-col justify-center gap-6">
          <button
            onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(""); }}
            className="self-start flex items-center gap-2 active:scale-95 transition-transform"
            style={{ color: "#666" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-semibold">Back</span>
          </button>

          <div>
            <h2 className="text-white text-3xl font-bold mb-2">Reset Password</h2>
            <p className="text-[#555] text-sm">Enter your email to receive a reset link.</p>
          </div>

          {forgotSent ? (
            <div className="rounded-2xl p-5 scale-in" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <p className="text-[#22C55E] font-semibold mb-1">Email sent!</p>
              <p className="text-[#22C55E] text-sm opacity-80">Check your inbox and follow the link to reset your password. Then sign in with your new password.</p>
            </div>
          ) : (
            <>
              <input
                type="email"
                placeholder="your@email.com"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleForgot()}
                style={INPUT_STYLE}
                autoFocus
              />
              <button
                onClick={handleForgot}
                disabled={!forgotEmail.trim() || forgotLoading}
                className="w-full py-4 rounded-2xl font-bold text-base active:scale-[0.97] transition-all"
                style={{
                  background: forgotEmail.trim() ? "#fff" : "rgba(255,255,255,0.07)",
                  color: forgotEmail.trim() ? "#000" : "#444",
                }}
              >
                {forgotLoading ? "Sending…" : "Send Reset Email"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-6 max-w-md mx-auto" style={{ background: "#0F0F0F" }}>
      <div className="flex-1 flex flex-col justify-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 scale-in">
          <Image src="/logotr.png" alt="Tracksy" width={72} height={72} className="rounded-3xl" priority />
          <div className="text-center">
            <h1 className="text-white text-3xl font-bold tracking-tight">Tracksy</h1>
            <p className="text-[#555] text-sm mt-1">Your personal finance tracker</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-2xl p-1 fade-up" style={{ background: "#1A1A1A", animationDelay: "80ms" }}>
          {(["signin", "signup"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95"
              style={{
                background: tab === t ? "#fff" : "transparent",
                color: tab === t ? "#000" : "#555",
              }}
            >
              {t === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* Form */}
        <div key={tab} className="flex flex-col gap-3 fade-in">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={INPUT_STYLE}
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={INPUT_STYLE}
            autoComplete={tab === "signup" ? "new-password" : "current-password"}
          />
          {tab === "signup" && (
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPass}
              onChange={e => { setConfirmPass(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={INPUT_STYLE}
              autoComplete="new-password"
            />
          )}

          {error && (
            <p className="text-[#F43F5E] text-sm text-center animate-pulse">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-base active:scale-[0.97] transition-all mt-1"
            style={{ background: "#fff", color: "#000", opacity: loading ? 0.7 : 1 }}
          >
            {loading
              ? (tab === "signin" ? "Signing In…" : "Creating Account…")
              : (tab === "signin" ? "Sign In" : "Create Account")}
          </button>

          {tab === "signin" && (
            <button
              onClick={() => { setShowForgot(true); setForgotEmail(email); }}
              className="text-center text-sm transition-colors active:scale-95"
              style={{ color: "#444" }}
            >
              Forgot password?
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-[#2A2A2A] text-xs pb-10">Your data stays private and secure</p>
    </div>
  );
}
