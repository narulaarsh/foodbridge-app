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
  title: "FoodBridge",
  description: "Rescue surplus food and connect with volunteers.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if user is logged in for the persistent navigation bar
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
          <nav className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/70 dark:bg-gray-950/70 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                
                {/* Logo Section */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  <span className="font-extrabold text-xl tracking-tight text-gray-900 dark:text-white">FoodBridge</span>
                </div>
                
                {/* User Section */}
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{session.role} Dashboard</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{session.email}</span>
                  </div>
                  <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 mx-1 hidden sm:block"></div>
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
