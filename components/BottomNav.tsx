"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  {
    href: "/",
    icon: (active: boolean) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill={active ? "#fff" : "none"}
        stroke={active ? "#fff" : "#555"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: "/goals",
    icon: (active: boolean) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
        stroke={active ? "#fff" : "#555"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2" fill={active ? "#fff" : "#555"}/>
      </svg>
    ),
  },
  {
    href: "/dues",
    icon: (active: boolean) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
        stroke={active ? "#fff" : "#555"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3h5v5"/><path d="M8 21H3v-5"/>
        <path d="M21 3l-7 7"/><path d="M3 21l7-7"/>
      </svg>
    ),
  },
  {
    href: "/profile",
    icon: (active: boolean) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill={active ? "#fff" : "none"}
        stroke={active ? "#fff" : "#555"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div
      className="fixed left-0 right-0 z-40 flex justify-center max-w-md mx-auto"
      style={{ bottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
    >
      <nav
        className="flex items-center gap-1 px-3 py-3"
        style={{
          background: "rgba(18,18,18,0.92)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.05) inset, 0 0 60px rgba(255,255,255,0.03)",
        }}
      >
        {LINKS.map(({ href, icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="relative flex items-center justify-center w-14 h-12 rounded-full transition-all duration-200 active:scale-90"
              style={{
                background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                boxShadow: isActive ? "0 0 18px rgba(255,255,255,0.12), 0 0 40px rgba(255,255,255,0.05)" : "none",
              }}
            >
              {/* Active dot */}
              {isActive && (
                <span
                  className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: "#fff", boxShadow: "0 0 6px rgba(255,255,255,0.9)" }}
                />
              )}
              <span className={isActive ? "icon-glow" : ""}>
                {icon(isActive)}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
