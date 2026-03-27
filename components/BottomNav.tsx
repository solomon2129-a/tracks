"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto">
      <div className="mx-4 mb-4 bg-gray-900 rounded-3xl flex overflow-hidden shadow-2xl shadow-gray-900/30">
        <Link
          href="/"
          className={`flex-1 flex flex-col items-center py-4 gap-1 transition-all duration-200 ${
            pathname === "/" ? "text-white" : "text-gray-500"
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
            pathname === "/" ? "bg-white/15" : ""
          }`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <span className="text-[10px] font-semibold tracking-wide">Add</span>
        </Link>

        <Link
          href="/profile"
          className={`flex-1 flex flex-col items-center py-4 gap-1 transition-all duration-200 ${
            pathname === "/profile" ? "text-white" : "text-gray-500"
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
            pathname === "/profile" ? "bg-white/15" : ""
          }`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <span className="text-[10px] font-semibold tracking-wide">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
