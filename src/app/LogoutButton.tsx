"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-xs font-bold text-gray-400 hover:text-white transition-all bg-white/[0.04] hover:bg-red-500/10 hover:text-red-400 px-4 py-2 rounded-xl border border-white/[0.08] hover:border-red-500/20 disabled:opacity-50"
    >
      {loading ? "..." : "Sign out"}
    </button>
  );
}
