"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BottomNavProps {
  onAddClick: () => void;
}

export default function BottomNav({ onAddClick }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto">
      <div
        className="relative flex items-center h-20 px-8"
        style={{
          background: "rgba(10, 14, 24, 0.88)",
          backdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Home */}
        <Link
          href="/"
          className="flex-1 flex flex-col items-center gap-1.5 transition-all duration-200 active:scale-90"
        >
          <svg
            width="22" height="22" viewBox="0 0 24 24"
            fill={pathname === "/" ? "#01C38D" : "none"}
            stroke={pathname === "/" ? "#01C38D" : "#3D5166"}
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span
            className="text-[10px] font-semibold tracking-wide"
            style={{ color: pathname === "/" ? "#01C38D" : "#3D5166" }}
          >
            Home
          </span>
        </Link>

        {/* FAB */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={onAddClick}
            className="w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-all duration-150 -mt-8"
            style={{
              background: "linear-gradient(145deg, #01C38D, #00A070)",
              boxShadow: "0 0 28px rgba(1,195,141,0.55), 0 4px 16px rgba(0,0,0,0.4)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {/* Profile */}
        <Link
          href="/profile"
          className="flex-1 flex flex-col items-center gap-1.5 transition-all duration-200 active:scale-90"
        >
          <svg
            width="22" height="22" viewBox="0 0 24 24"
            fill={pathname === "/profile" ? "#01C38D" : "none"}
            stroke={pathname === "/profile" ? "#01C38D" : "#3D5166"}
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span
            className="text-[10px] font-semibold tracking-wide"
            style={{ color: pathname === "/profile" ? "#01C38D" : "#3D5166" }}
          >
            Profile
          </span>
        </Link>
      </div>
    </nav>
  );
}
