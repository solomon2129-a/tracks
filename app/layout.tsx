import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tracksy",
  description: "Log money in under 3 seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={`${inter.className} bg-[#0C0C10]`}>
        <AuthProvider>
          <AppShell>
            <div className="max-w-md mx-auto min-h-screen bg-[#0C0C10] relative">
              {children}
            </div>
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
