"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 max-w-md mx-auto">
      <div className="flex">
        <Link
          href="/"
          className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
            pathname === "/" ? "text-indigo-600" : "text-gray-400"
          }`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          Add
        </Link>
        <Link
          href="/profile"
          className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
            pathname === "/profile" ? "text-indigo-600" : "text-gray-400"
          }`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Profile
        </Link>
      </div>
    </nav>
  );
}
