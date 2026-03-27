"use client";

import Image from "next/image";

export default function SplashScreen() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-5"
      style={{ background: "#0F0F0F" }}
    >
      <div className="scale-in flex flex-col items-center gap-4">
        <Image
          src="/logotr.png"
          alt="Tracksy"
          width={72}
          height={72}
          className="rounded-3xl"
          priority
        />
        <div className="text-center">
          <h1 className="text-white text-3xl font-bold tracking-tight">Tracksy</h1>
          <p className="text-[#666] text-sm mt-1">Log money in under 3 seconds.</p>
        </div>
      </div>
    </div>
  );
}
