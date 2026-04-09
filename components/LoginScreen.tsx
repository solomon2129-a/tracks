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
  const { signup, login, loginWithGoogle, forgotPassword } = useAuth();
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

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
          <span className="text-[#333] text-xs font-semibold">or</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
        </div>

        {/* Google */}
        <button
          onClick={async () => {
            setLoading(true);
            setError("");
            try { await loginWithGoogle(); }
            catch (err: any) {
              if (!err?.code?.includes("popup-closed")) setError("Google sign-in failed. Try again.");
            } finally { setLoading(false); }
          }}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-3 active:scale-[0.97] transition-all"
          style={{ background: "#1A1A1A", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          {/* Google G logo */}
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </div>

      <p className="text-center text-[#2A2A2A] text-xs pb-10">Your data stays private and secure</p>
    </div>
  );
}
