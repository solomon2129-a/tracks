"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();
  const active = (p: string) => pathname === p;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div
        className="flex items-center h-[64px] px-6"
        style={{
          background: "rgba(10,10,10,0.96)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Link href="/" className="flex-1 flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <svg
            width="22" height="22" viewBox="0 0 24 24"
            fill={active("/") ? "#fff" : "none"}
            stroke={active("/") ? "#fff" : "#444"}
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-[9px] font-semibold tracking-wide" style={{ color: active("/") ? "#fff" : "#444" }}>Home</span>
        </Link>

        <Link href="/goals" className="flex-1 flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <svg
            width="22" height="22" viewBox="0 0 24 24"
            fill="none"
            stroke={active("/goals") ? "#fff" : "#444"}
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" fill={active("/goals") ? "#fff" : "#444"} />
          </svg>
          <span className="text-[9px] font-semibold tracking-wide" style={{ color: active("/goals") ? "#fff" : "#444" }}>Goals</span>
        </Link>

        <Link href="/dues" className="flex-1 flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <svg
            width="22" height="22" viewBox="0 0 24 24"
            fill="none"
            stroke={active("/dues") ? "#fff" : "#444"}
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M16 3h5v5" />
            <path d="M8 21H3v-5" />
            <path d="M21 3l-7 7" />
            <path d="M3 21l7-7" />
          </svg>
          <span className="text-[9px] font-semibold tracking-wide" style={{ color: active("/dues") ? "#fff" : "#444" }}>Dues</span>
        </Link>

        <Link href="/profile" className="flex-1 flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <svg
            width="22" height="22" viewBox="0 0 24 24"
            fill={active("/profile") ? "#fff" : "none"}
            stroke={active("/profile") ? "#fff" : "#444"}
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="text-[9px] font-semibold tracking-wide" style={{ color: active("/profile") ? "#fff" : "#444" }}>Profile</span>
        </Link>
      </div>
    </nav>
  );
}
