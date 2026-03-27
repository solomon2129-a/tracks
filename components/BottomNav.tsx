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
      <div className="relative mx-0 bg-[#132046] border-t border-[#2A3441] flex items-center h-20 px-8">
        {/* Home */}
        <Link
          href="/"
          className={`flex-1 flex flex-col items-center gap-1 transition-colors duration-200 ${
            pathname === "/" ? "text-[#01C38D]" : "text-[#606E79]"
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-[10px] font-semibold tracking-wide">Home</span>
        </Link>

        {/* FAB */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={onAddClick}
            className="w-14 h-14 rounded-full bg-[#01C38D] flex items-center justify-center shadow-xl shadow-[#01C38D]/30 active:scale-90 transition-transform -mt-8"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#191E29" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {/* Profile */}
        <Link
          href="/profile"
          className={`flex-1 flex flex-col items-center gap-1 transition-colors duration-200 ${
            pathname === "/profile" ? "text-[#01C38D]" : "text-[#606E79]"
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="text-[10px] font-semibold tracking-wide">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
