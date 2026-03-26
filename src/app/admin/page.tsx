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
        return <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 text-xs font-bold rounded-full border border-indigo-200 dark:border-indigo-800 uppercase tracking-wider">Admin</span>;
      case "Donor":
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-xs font-bold rounded-full border border-amber-200 dark:border-amber-800 uppercase tracking-wider">Donor</span>;
      case "Volunteer":
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider">Volunteer</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 text-xs font-medium rounded-full">{role}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-colors duration-300">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Platform overview and user management.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-sm font-medium rounded-lg border border-red-200 dark:border-red-500/20 flex items-center shadow-sm">
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {error}
        </div>
      )}

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        {/* Total Users */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden group hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="px-6 py-6 sm:p-6">
            <dt className="text-sm font-semibold text-gray-600 dark:text-gray-400 truncate flex items-center gap-2">
              <span className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </span>
              Total Users
            </dt>
            <dd className="mt-4 text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {loadingMetrics ? <span className="text-gray-300 dark:text-gray-700 animate-pulse">--</span> : metrics?.totalUsers || 0}
            </dd>
          </div>
        </div>

        {/* Active Donations */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden group hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="px-6 py-6 sm:p-6">
            <dt className="text-sm font-semibold text-gray-600 dark:text-gray-400 truncate flex items-center gap-2">
              <span className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
              </span>
              Active Donations
            </dt>
            <dd className="mt-4 text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {loadingMetrics ? <span className="text-gray-300 dark:text-gray-700 animate-pulse">--</span> : metrics?.activeDonations || 0}
            </dd>
          </div>
        </div>

        {/* Food Rescued */}
        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-800/30 overflow-hidden group hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="px-6 py-6 sm:p-6">
            <dt className="text-sm font-semibold text-emerald-800 dark:text-emerald-400 truncate flex items-center gap-2">
              <span className="p-2 bg-emerald-100 dark:bg-emerald-800/50 rounded-lg text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-200/50 dark:border-emerald-700/50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </span>
              Total Food Rescued
            </dt>
            <dd className="mt-4 flex items-baseline text-4xl font-extrabold text-emerald-700 dark:text-emerald-400 tracking-tight">
              {loadingMetrics ? <span className="opacity-50 animate-pulse">--</span> : metrics?.totalFoodRescued.toFixed(1) || "0.0"}
              <span className="ml-2 text-lg font-medium text-emerald-600 dark:text-emerald-500">kg</span>
            </dd>
          </div>
        </div>

      </div>

      {/* Users Table List */}
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        User Management
      </h2>

      <div className="bg-white dark:bg-gray-900 shadow-sm overflow-hidden border border-gray-200 dark:border-gray-800 rounded-2xl transition-colors duration-300">
        {loadingUsers ? (
          <div className="p-12 flex justify-center items-center gap-3 text-gray-500 dark:text-gray-400">
            <svg className="animate-spin h-5 w-5 text-indigo-500 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">No users found in the system.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 transition-colors">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                  <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-400 dark:text-gray-500">#{user.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        disabled={deletingId === user.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-900 transition-colors ${deletingId === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Delete User"
                      >
                        {deletingId === user.id ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-red-700 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
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
  );
}
