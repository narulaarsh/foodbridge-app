"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetupRole = searchParams.get("setup_role") === "true";
  
  const [isLogin, setIsLogin] = useState(!isSetupRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Donor");
  const [adminSecret, setAdminSecret] = useState("");
  
  const [error, setError] = useState(searchParams.get("error") || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(errorParam);
    }
    if (isSetupRole) {
      setIsLogin(false);
    }
  }, [searchParams, isSetupRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    let payload: any = isLogin
      ? { email, password }
      : { name, email, password, role, adminSecret: role === "Admin" ? adminSecret : undefined };

    if (isSetupRole) {
      endpoint = "/api/auth/google/complete";
      payload = { role, adminSecret: role === "Admin" ? adminSecret : undefined };
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        if (isLogin || isSetupRole) {
          const userRole = data.user.role;
          router.push(`/${userRole.toLowerCase()}`);
        } else {
          setIsLogin(true);
          setPassword("");
          setAdminSecret("");
        }
      } else {
        setError(data.message || "An error occurred");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:shadow-amber-500/40 transition-shadow">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <span className="text-3xl font-extrabold text-white tracking-tight">FoodBridge</span>
          </Link>
          <p className="text-gray-500 font-medium text-sm">Rescue surplus food, fight hunger.</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/[0.04] backdrop-blur-xl rounded-3xl border border-white/[0.08] p-8 sm:p-10 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-1.5 text-center">
            {isSetupRole ? "Complete Registration" : isLogin ? "Welcome Back" : "Create an Account"}
          </h2>
          <p className="text-center text-sm text-gray-500 mb-6">
            {isSetupRole 
              ? "Select your role to complete Google registration." 
              : isLogin 
                ? "Sign in to access your dashboard." 
                : "Join FoodBridge and make a difference."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 font-medium">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                {error}
              </div>
            )}

            {!isLogin && !isSetupRole && (
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wider">Full Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] text-white rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all placeholder-gray-600"
                  placeholder="John Doe" />
              </div>
            )}

            {!isSetupRole && (
              <>
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wider">Email Address</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] text-white rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all placeholder-gray-600"
                    placeholder="you@example.com" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wider">Password</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] text-white rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all placeholder-gray-600"
                    placeholder="••••••••" />
                </div>
              </>
            )}

            {!isLogin && (
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wider">I want to join as</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "Donor", label: "Donor", icon: "M12 6v6m0 0v6m0-6h6m-6 0H6", desc: "Post Food" },
                    { value: "Volunteer", label: "Volunteer", icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z", desc: "Deliver" },
                    { value: "Admin", label: "Admin", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", desc: "Manage" },
                  ].map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all text-center ${
                        role === r.value
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                          : "bg-white/[0.02] border-white/[0.06] text-gray-500 hover:bg-white/[0.04] hover:text-gray-300"
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={r.icon}></path></svg>
                      <span className="text-xs font-bold">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isLogin && role === "Admin" && (
              <div>
                <label className="text-xs font-bold text-indigo-400 mb-1.5 block uppercase tracking-wider flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  Admin Secret Key
                </label>
                <input type="password" required value={adminSecret} onChange={(e) => setAdminSecret(e.target.value)}
                  className="w-full px-4 py-3 bg-indigo-500/5 border border-indigo-500/20 text-white rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder-indigo-800"
                  placeholder="Enter authorized key" />
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : isSetupRole ? "Complete Registration" : isLogin ? "Sign in" : "Create Account"}
            </button>

            {!isSetupRole && (
              <>
                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t border-white/[0.06]"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-600 text-xs font-bold uppercase tracking-wider">Or</span>
                  <div className="flex-grow border-t border-white/[0.06]"></div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    window.location.href = "/api/auth/google";
                  }}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white/[0.04] hover:bg-white/[0.08] text-white font-semibold rounded-xl border border-white/[0.08] hover:border-white/[0.12] transition-all disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                  Sign in with Google
                </button>
              </>
            )}
          </form>

          {!isSetupRole && (
            <div className="mt-6 text-center text-sm">
              <span className="text-gray-500">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </span>{" "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-amber-400 hover:text-amber-300 font-bold transition-colors"
              >
                {isLogin ? "Join FoodBridge" : "Log in"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">Loading...</div>}>
      <AuthForm />
    </Suspense>
  );
}
