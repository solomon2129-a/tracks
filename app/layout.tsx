import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tracksy",
  description: "Log money in under 3 seconds.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tracksy",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0F0F0F",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/logotr.png" />
      </head>
      <body className={`${inter.className} bg-[#0F0F0F]`}>
        <ErrorBoundary>
          <AuthProvider>
            <AppShell>
              <div className="max-w-md mx-auto min-h-screen bg-[#0F0F0F] relative">
                {children}
              </div>
            </AppShell>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
