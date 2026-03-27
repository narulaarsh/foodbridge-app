"use client";

import { useState, useEffect } from "react";

interface Metrics {
  totalUsers: number;
  activeDonations: number;
  reservedDonations: number;
  completedDonations: number;
  totalDonations: number;
  totalFoodRescued: number;
  totalFoodPosted: number;
  donorCount: number;
  volunteerCount: number;
  adminCount: number;
  totalPickups: number;
  completedPickups: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AdminDonation {
  id: number;
  foodTitle: string;
  quantityKg: number;
  expiryTime: string;
  status: string;
  lat: number;
  lng: number;
  address: string | null;
  instructions: string | null;
  donor: { id: number; name: string; email: string };
  pickup: {
    id: number;
    otpCode: number;
    claimTime: string;
    finishTime: string | null;
    volunteer: { id: number; name: string; email: string };
  } | null;
}

type Tab = "overview" | "donations" | "users";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [donationFilter, setDonationFilter] = useState<string>("All");
  const [userFilter, setUserFilter] = useState<string>("All");
  const [expandedDonation, setExpandedDonation] = useState<number | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const res = await fetch("/api/admin/metrics");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
      } else { setError("Failed to fetch metrics"); }
    } catch { setError("Failed to fetch metrics"); }
    finally { setLoadingMetrics(false); }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      } else { setError("Failed to fetch users"); }
    } catch { setError("Failed to fetch users"); }
    finally { setLoadingUsers(false); }
  };

  const fetchDonations = async () => {
    try {
      setLoadingDonations(true);
      const res = await fetch("/api/admin/donations");
      if (res.ok) {
        const data = await res.json();
        setDonations(data.donations);
      } else { setError("Failed to fetch donations"); }
    } catch { setError("Failed to fetch donations"); }
    finally { setLoadingDonations(false); }
  };

  useEffect(() => {
    fetchMetrics();
    fetchUsers();
    fetchDonations();
  }, []);

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete ${userName}? This action removes all their pending donations and pickup records. It cannot be undone.`)) return;
    setDeletingId(userId);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) { fetchUsers(); fetchMetrics(); fetchDonations(); }
      else { setError(data.message || "Failed to delete user."); }
    } catch { setError("An unexpected error occurred during deletion."); }
    finally { setDeletingId(null); }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      Admin: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      Donor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      Volunteer: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };
    const s = styles[role] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
    return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${s} text-xs font-bold rounded-full border uppercase tracking-wider`}>{role}</span>;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; dot: string }> = {
      Available: { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
      Reserved: { bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400" },
      PickedUp: { bg: "bg-blue-500/10 text-blue-400 border-blue-500/20", dot: "bg-blue-400" },
    };
    const s = styles[status] || { bg: "bg-gray-500/10 text-gray-400 border-gray-500/20", dot: "bg-gray-400" };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${s.bg} text-xs font-bold rounded-full border uppercase tracking-wider`}>
        <span className={`w-1.5 h-1.5 ${s.dot} rounded-full ${status === "Reserved" ? "animate-pulse" : ""}`}></span>
        {status === "PickedUp" ? "Completed" : status}
      </span>
    );
  };

  const filteredDonations = donationFilter === "All" ? donations : donations.filter(d => d.status === donationFilter);
  const filteredUsers = userFilter === "All" ? users : users.filter(u => u.role === userFilter);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
    { key: "donations", label: "All Donations", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
    { key: "users", label: "Users", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Full platform overview and management.</p>
            </div>
          </div>
          <button onClick={() => { fetchMetrics(); fetchUsers(); fetchDonations(); }}
            className="text-xs font-bold text-gray-400 hover:text-white px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Refresh All
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 text-red-400 text-sm font-medium rounded-xl border border-red-500/20 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {error}
            <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-300">✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl mb-8 w-fit">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.key ? "bg-white/[0.08] text-white shadow-sm" : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}></path></svg>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Primary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: metrics?.totalUsers, icon: "👥" },
                { label: "Total Donations", value: metrics?.totalDonations, icon: "📦" },
                { label: "Food Rescued", value: metrics ? `${metrics.totalFoodRescued.toFixed(1)} kg` : null, icon: "✅" },
                { label: "Food Posted", value: metrics ? `${metrics.totalFoodPosted.toFixed(1)} kg` : null, icon: "📋" },
              ].map((card, i) => (
                <div key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.06] transition-all">
                  <div className="text-xl mb-2">{card.icon}</div>
                  <div className="text-2xl font-extrabold text-white">
                    {loadingMetrics ? <span className="text-gray-700 animate-pulse">--</span> : card.value ?? 0}
                  </div>
                  <div className="text-xs font-medium text-gray-500 mt-1">{card.label}</div>
                </div>
              ))}
            </div>

            {/* Donation Status Breakdown */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Donation Pipeline</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Available", value: metrics?.activeDonations, color: "emerald" },
                  { label: "Reserved", value: metrics?.reservedDonations, color: "amber" },
                  { label: "Completed", value: metrics?.completedDonations, color: "blue" },
                ].map((item, i) => (
                  <div key={i} className={`bg-${item.color}-500/[0.06] border border-${item.color}-500/20 rounded-2xl p-5`}>
                    <div className={`text-3xl font-extrabold text-${item.color}-400`}>
                      {loadingMetrics ? <span className="opacity-30 animate-pulse">--</span> : item.value ?? 0}
                    </div>
                    <div className={`text-xs font-bold text-${item.color}-500/60 mt-1 uppercase tracking-wider`}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Role Breakdown */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">User Breakdown</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Donors", value: metrics?.donorCount, color: "amber" },
                  { label: "Volunteers", value: metrics?.volunteerCount, color: "emerald" },
                  { label: "Admins", value: metrics?.adminCount, color: "indigo" },
                ].map((item, i) => (
                  <div key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
                    <div className="text-3xl font-extrabold text-white">
                      {loadingMetrics ? <span className="text-gray-700 animate-pulse">--</span> : item.value ?? 0}
                    </div>
                    <div className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Donations</h3>
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
                {donations.slice(0, 5).map((d, i) => (
                  <div key={d.id} className={`flex items-center justify-between p-4 ${i > 0 ? "border-t border-white/[0.04]" : ""} hover:bg-white/[0.02] transition-colors`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-xs font-bold text-gray-500">#{d.id}</div>
                      <div>
                        <p className="text-sm font-bold text-white">{d.foodTitle}</p>
                        <p className="text-xs text-gray-500">by {d.donor.name} · {d.quantityKg} kg</p>
                      </div>
                    </div>
                    {getStatusBadge(d.status)}
                  </div>
                ))}
                {donations.length === 0 && !loadingDonations && (
                  <div className="p-8 text-center text-gray-500 text-sm">No donations yet.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── DONATIONS TAB ─── */}
        {activeTab === "donations" && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex items-center gap-2 flex-wrap">
              {["All", "Available", "Reserved", "PickedUp"].map(f => (
                <button key={f} onClick={() => setDonationFilter(f)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${donationFilter === f ? "bg-white/[0.08] text-white border-white/[0.12]" : "text-gray-500 border-white/[0.06] hover:text-gray-300 hover:bg-white/[0.04]"}`}>
                  {f === "PickedUp" ? "Completed" : f}
                </button>
              ))}
              <span className="ml-auto text-xs text-gray-600 font-medium">{filteredDonations.length} results</span>
            </div>

            {/* Donations List */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
              {loadingDonations ? (
                <div className="p-12 flex flex-col items-center gap-3 text-gray-500">
                  <svg className="animate-spin h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span className="text-sm font-medium">Loading donations...</span>
                </div>
              ) : filteredDonations.length === 0 ? (
                <div className="p-12 text-center text-gray-500 text-sm">No donations match this filter.</div>
              ) : (
                filteredDonations.map((d, i) => (
                  <div key={d.id} className={`${i > 0 ? "border-t border-white/[0.04]" : ""}`}>
                    <div className="p-5 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setExpandedDonation(expandedDonation === d.id ? null : d.id)}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-grow">
                          <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-xs font-mono font-bold text-gray-500 shrink-0">#{d.id}</div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white">{d.foodTitle}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                              <span className="text-xs text-gray-500">{d.quantityKg} kg</span>
                              <span className="text-xs text-gray-600">·</span>
                              <span className="text-xs text-gray-500">Donor: {d.donor.name}</span>
                              <span className="text-xs text-gray-600">·</span>
                              <span className="text-xs text-gray-500">Exp: {new Date(d.expiryTime).toLocaleDateString()}</span>
                              {d.pickup && (
                                <>
                                  <span className="text-xs text-gray-600">·</span>
                                  <span className="text-xs text-emerald-500">Volunteer: {d.pickup.volunteer.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {getStatusBadge(d.status)}
                          <svg className={`w-4 h-4 text-gray-600 transition-transform ${expandedDonation === d.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {expandedDonation === d.id && (
                      <div className="px-5 pb-5 pt-0">
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 grid sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Donor Details</p>
                            <p className="text-white font-medium">{d.donor.name}</p>
                            <p className="text-gray-500 text-xs">{d.donor.email}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Location</p>
                            <p className="text-white font-medium">{d.address || "Auto-detected GPS"}</p>
                            <p className="text-gray-500 text-xs">{d.lat.toFixed(4)}, {d.lng.toFixed(4)}</p>
                          </div>
                          {d.instructions && (
                            <div>
                              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Pickup Instructions</p>
                              <p className="text-gray-300 text-xs">{d.instructions}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Expiry</p>
                            <p className="text-white font-medium">{new Date(d.expiryTime).toLocaleString()}</p>
                          </div>
                          {d.pickup && (
                            <>
                              <div>
                                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Volunteer</p>
                                <p className="text-white font-medium">{d.pickup.volunteer.name}</p>
                                <p className="text-gray-500 text-xs">{d.pickup.volunteer.email}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Pickup Info</p>
                                <p className="text-white font-medium">OTP: <span className="font-mono text-amber-400">{d.pickup.otpCode}</span></p>
                                <p className="text-gray-500 text-xs">Claimed: {new Date(d.pickup.claimTime).toLocaleString()}</p>
                                {d.pickup.finishTime && <p className="text-emerald-400 text-xs font-bold">Completed: {new Date(d.pickup.finishTime).toLocaleString()}</p>}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── USERS TAB ─── */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex items-center gap-2 flex-wrap">
              {["All", "Donor", "Volunteer", "Admin"].map(f => (
                <button key={f} onClick={() => setUserFilter(f)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${userFilter === f ? "bg-white/[0.08] text-white border-white/[0.12]" : "text-gray-500 border-white/[0.06] hover:text-gray-300 hover:bg-white/[0.04]"}`}>
                  {f}
                </button>
              ))}
              <span className="ml-auto text-xs text-gray-600 font-medium">{filteredUsers.length} users</span>
            </div>

            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
              {loadingUsers ? (
                <div className="p-12 flex flex-col items-center gap-3 text-gray-500">
                  <svg className="animate-spin h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span className="text-sm font-medium">Loading users...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-12 text-center text-gray-500 text-sm">No users match this filter.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/[0.06]">
                    <thead className="bg-white/[0.02]">
                      <tr>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">ID</th>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">User</th>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Role</th>
                        <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 text-sm font-mono text-gray-600">#{user.id}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-white text-xs font-bold">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => handleDeleteUser(user.id, user.name)} disabled={deletingId === user.id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors ${deletingId === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              {deletingId === user.id ? (
                                <><svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Deleting...</>
                              ) : (
                                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>Delete</>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
