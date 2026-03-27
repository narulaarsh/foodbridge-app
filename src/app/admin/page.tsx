"use client";

import { useState, useEffect } from "react";

interface Metrics {
  totalUsers: number;
  activeDonations: number;
  totalFoodRescued: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoadingMetrics(true);
      const metricsRes = await fetch("/api/admin/metrics");
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data.metrics);
      } else {
        setError("Failed to fetch metrics");
      }
      setLoadingMetrics(false);

      setLoadingUsers(true);
      const usersRes = await fetch("/api/admin/users");
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users);
      } else {
        setError("Failed to fetch users");
      }
      setLoadingUsers(false);
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred while loading dashboard data.");
      setLoadingMetrics(false);
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete ${userName}? This action removes all their pending donations and pickup records. It cannot be undone.`)) {
      return;
    }

    setDeletingId(userId);
    setError("");

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        fetchDashboardData();
      } else {
        setError(data.message || "Failed to delete user.");
      }
    } catch (err) {
      setError("An unexpected error occurred during deletion.");
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-full border border-indigo-500/20 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
            Admin
          </span>
        );
      case "Donor":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full border border-amber-500/20 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
            Donor
          </span>
        );
      case "Volunteer":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
            Volunteer
          </span>
        );
      default:
        return <span className="px-2.5 py-1 bg-gray-500/10 text-gray-400 text-xs font-medium rounded-full">{role}</span>;
    }
  };

  const metricCards = [
    {
      label: "Total Users",
      value: metrics?.totalUsers || 0,
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      color: "indigo",
      suffix: "",
    },
    {
      label: "Active Donations",
      value: metrics?.activeDonations || 0,
      icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9",
      color: "amber",
      suffix: "",
    },
    {
      label: "Food Rescued",
      value: metrics?.totalFoodRescued.toFixed(1) || "0.0",
      icon: "M5 13l4 4L19 7",
      color: "emerald",
      suffix: " kg",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Dashboard</h1>
              <p className="text-sm text-gray-400">Platform overview and user management.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-400 text-sm font-medium rounded-xl border border-red-500/20 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {error}
          </div>
        )}

        {/* Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {metricCards.map((card, i) => (
            <div key={i} className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden group hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 hover:-translate-y-1 shadow-xl">
              <div className="p-6">
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2.5">
                  <span className={`p-2 bg-${card.color}-500/10 border border-${card.color}-500/20 rounded-xl`}>
                    <svg className={`w-4 h-4 text-${card.color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={card.icon}></path></svg>
                  </span>
                  {card.label}
                </dt>
                <dd className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-white tracking-tight">
                    {loadingMetrics ? <span className="text-gray-700 animate-pulse">--</span> : card.value}
                  </span>
                  {card.suffix && <span className="ml-2 text-lg font-medium text-gray-500">{card.suffix}</span>}
                </dd>
              </div>
            </div>
          ))}
        </div>

        {/* Users Table */}
        <div className="flex items-center gap-2.5 mb-5">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          <h2 className="text-lg font-bold text-white">User Management</h2>
          <span className="text-xs font-bold text-gray-500 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-full">{users.length} users</span>
        </div>

        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] overflow-hidden rounded-2xl shadow-xl">
          {loadingUsers ? (
            <div className="p-16 flex flex-col justify-center items-center gap-3 text-gray-500">
              <svg className="animate-spin h-6 w-6 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm font-medium">Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="p-16 text-center text-gray-500">No users found in the system.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/[0.06]">
                <thead className="bg-white/[0.02]">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">ID</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">User</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Role</th>
                    <th className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">#{user.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          disabled={deletingId === user.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors ${deletingId === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Delete User"
                        >
                          {deletingId === user.id ? (
                            <>
                              <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                              Delete
                            </>
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
    </div>
  );
}
