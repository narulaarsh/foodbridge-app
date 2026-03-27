"use client";

import { useState, useEffect } from "react";

interface Donation {
  id: number;
  foodTitle: string;
  quantityKg: number;
  expiryTime: string;
  status: string;
  lat: number;
  lng: number;
}

export default function DonorDashboard() {
  const [foodTitle, setFoodTitle] = useState("");
  const [quantityKg, setQuantityKg] = useState("");
  const [expiryTime, setExpiryTime] = useState("");
  const [address, setAddress] = useState("");
  const [instructions, setInstructions] = useState("");
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [fetching, setFetching] = useState(true);

  // Verification state map: { donationId: { otpCode, loading, error, success } }
  const [verifyState, setVerifyState] = useState<Record<number, any>>({});

  const fetchDonations = async () => {
    try {
      setFetching(true);
      const res = await fetch("/api/donations");
      if (res.ok) {
        const data = await res.json();
        setDonations(data.donations);
      }
    } catch (error) {
      console.error("Error fetching donations", error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    if (!navigator.geolocation) {
      setMessage({ text: "Geolocation is not supported by your browser", type: "error" });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const res = await fetch("/api/donations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              foodTitle,
              quantityKg: parseFloat(quantityKg),
              expiryTime,
              lat: latitude,
              lng: longitude,
              address,
              instructions,
            }),
          });

          const data = await res.json();

          if (res.ok) {
            setMessage({ text: "Donation posted successfully!", type: "success" });
            setFoodTitle("");
            setQuantityKg("");
            setExpiryTime("");
            setAddress("");
            setInstructions("");
            fetchDonations();
          } else {
            setMessage({ text: data.message || "Failed to post donation", type: "error" });
          }
        } catch (error) {
          setMessage({ text: "Something went wrong", type: "error" });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setMessage({ text: `Location access denied or failed: ${error.message}`, type: "error" });
        setLoading(false);
      }
    );
  };

  const handleVerifyOtp = async (donationId: number) => {
    const state = verifyState[donationId] || {};
    const otpCode = state.otpCode;
    
    if (!otpCode || otpCode.length !== 4) {
      setVerifyState(prev => ({ 
        ...prev, 
        [donationId]: { ...state, error: "OTP must be 4 digits", success: false } 
      }));
      return;
    }

    setVerifyState(prev => ({ 
      ...prev, 
      [donationId]: { ...state, loading: true, error: "" } 
    }));

    try {
      const res = await fetch("/api/pickups/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationId, otpCode }),
      });

      const data = await res.json();

      if (res.ok) {
        setVerifyState(prev => ({
          ...prev,
          [donationId]: { ...state, loading: false, success: true, error: "" }
        }));
        
        setTimeout(() => {
          fetchDonations();
        }, 2000);
      } else {
        setVerifyState(prev => ({
          ...prev,
          [donationId]: { ...state, loading: false, error: data.message || "Verification failed" }
        }));
      }
    } catch (err) {
      setVerifyState(prev => ({
        ...prev,
        [donationId]: { ...state, loading: false, error: "Something went wrong" }
      }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
            Available
          </span>
        );
      case "Reserved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full border border-amber-500/20 animate-pulse tracking-wide uppercase">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
            Waiting for Volunteer
          </span>
        );
      case "PickedUp":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-500/10 text-gray-400 text-xs font-bold rounded-full border border-gray-500/20 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
            Handed Over
          </span>
        );
      default:
        return <span className="px-2 py-1 bg-gray-500/10 text-gray-400 text-xs font-medium rounded-full">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Donor Dashboard</h1>
              <p className="text-sm text-gray-400">Post surplus food and track your donations.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Form Column */}
          <div className="lg:col-span-2">
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl sticky top-24">
              <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  Post Food Donation
                </h3>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {message.text && (
                  <div className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {message.type === 'success' ? (
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    ) : (
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    )}
                    {message.text}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider" htmlFor="foodTitle">Food Title</label>
                  <input id="foodTitle" type="text" required value={foodTitle} onChange={(e) => setFoodTitle(e.target.value)}
                    className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all placeholder-gray-600"
                    placeholder="e.g. 2 Trays of Lasagna" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider" htmlFor="quantityKg">Quantity (kg)</label>
                  <input id="quantityKg" type="number" step="0.1" min="0.1" required value={quantityKg} onChange={(e) => setQuantityKg(e.target.value)}
                    className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all placeholder-gray-600"
                    placeholder="e.g. 5.5" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider" htmlFor="expiryTime">Expiry Time</label>
                  <input id="expiryTime" type="datetime-local" required value={expiryTime} onChange={(e) => setExpiryTime(e.target.value)}
                    className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider" htmlFor="address">Exact Address</label>
                  <input id="address" type="text" required value={address} onChange={(e) => setAddress(e.target.value)}
                    className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all placeholder-gray-600"
                    placeholder="e.g. 123 Main St, Apt 4B" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider" htmlFor="instructions">Pickup Instructions</label>
                  <textarea id="instructions" rows={2} required value={instructions} onChange={(e) => setInstructions(e.target.value)}
                    className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all placeholder-gray-600 resize-none"
                    placeholder="e.g. Ring the doorbell, leave at front desk" />
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={loading}
                    className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 disabled:opacity-50 transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0">
                    {loading ? "Posting Location & Detail..." : "Post Donation"}
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-3 flex items-center justify-center gap-1.5 font-medium">
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    Location will be attached automatically
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Feed Column */}
          <div className="lg:col-span-3">
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl flex flex-col">
              <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] flex justify-between items-center">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                  Your Pledges
                </h3>
                <button onClick={fetchDonations} 
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  Refresh
                </button>
              </div>
              
              <div className="flex-grow">
                {fetching ? (
                  <div className="p-16 flex flex-col justify-center items-center gap-3 text-gray-500">
                    <svg className="animate-spin h-6 w-6 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm font-medium">Loading donations...</span>
                  </div>
                ) : donations.length === 0 ? (
                  <div className="p-16 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                    </div>
                    <p className="text-white font-bold text-lg">No donations yet</p>
                    <p className="text-gray-500 text-sm mt-1">Use the form to post your first surplus food item.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-white/[0.06]">
                    {donations.map((donation) => {
                      const state = verifyState[donation.id] || {};
                      const isReserved = donation.status === "Reserved";
                      
                      return (
                      <li key={donation.id} className={`p-6 transition-all duration-300 ${isReserved ? 'bg-amber-500/[0.04]' : 'hover:bg-white/[0.02]'}`}>
                        <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
                          <div className="flex-grow">
                            <h4 className="text-base font-bold text-white">{donation.foodTitle}</h4>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                              <span className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-lg text-gray-400 font-medium">
                                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>
                                {donation.quantityKg} kg
                              </span>
                              <span className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-lg text-gray-400 font-medium">
                                <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                {new Date(donation.expiryTime).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0">{getStatusBadge(donation.status)}</div>
                        </div>
                        
                        {/* OTP Verification UI for Reserved Donations */}
                        {isReserved && !state.success && (
                          <div className="mt-5 pt-5 border-t border-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-bold text-amber-400">Volunteer Arrived?</p>
                              <p className="text-xs font-medium text-amber-500/60 mt-0.5">Enter the 4-digit code they provide.</p>
                            </div>
                            <div className="flex items-start gap-2 w-full sm:w-auto">
                              <div className="flex flex-col">
                                <input 
                                  type="text" maxLength={4} placeholder="0000"
                                  value={state.otpCode || ""}
                                  onChange={(e) => setVerifyState(prev => ({ 
                                    ...prev, 
                                    [donation.id]: { ...state, otpCode: e.target.value.replace(/\D/g, '') } 
                                  }))}
                                  className="w-24 px-3 py-2 text-center text-lg font-mono font-bold tracking-widest border border-amber-500/20 bg-amber-500/5 text-white rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none"
                                />
                                {state.error && <span className="text-xs text-red-400 mt-1 font-bold">{state.error}</span>}
                              </div>
                              <button
                                onClick={() => handleVerifyOtp(donation.id)}
                                disabled={state.loading || (state.otpCode || "").length !== 4}
                                className="px-5 py-2.5 bg-amber-500 text-gray-900 text-sm font-bold rounded-lg hover:bg-amber-400 disabled:opacity-50 transition-all shadow-sm min-h-[46px]"
                              >
                                {state.loading ? "..." : "Verify"}
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* OTP Success Result */}
                        {isReserved && state.success && (
                          <div className="mt-5 pt-4 border-t border-emerald-500/20 flex items-center gap-2 text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span className="font-bold text-sm">Handover verified! Marking as Picked Up...</span>
                          </div>
                        )}
                      </li>
                    )})}
                  </ul>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
