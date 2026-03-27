import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FoodBridge — Rescue Surplus Food, Feed Communities",
  description: "FoodBridge connects surplus food with volunteers who deliver it to people in need. Join the movement to fight food waste.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  let session = null;

  if (token) {
    session = await verifyToken(token);
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-amber-500/30 dark:selection:bg-amber-500/50`}>
        {session && (
          <nav className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/70 dark:bg-gray-950/80 border-b border-gray-200/80 dark:border-white/[0.06] transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                
                {/* Logo Section */}
                <div className="flex-shrink-0 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  </div>
                  <span className="font-extrabold text-xl tracking-tight text-gray-900 dark:text-white">FoodBridge</span>
                </div>
                
                {/* User Section */}
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-lg border border-gray-200/80 dark:border-white/[0.08]">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {session.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-tight">{session.role}</span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{session.email}</span>
                      </div>
                    </div>
                  </div>
                  <LogoutButton />
                </div>
                
              </div>
            </div>
          </nav>
        )}
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}
