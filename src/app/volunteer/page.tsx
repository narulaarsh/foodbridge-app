"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import the Map component to prevent SSR DOM errors
const MapComponent = dynamic(() => import("@/components/Map"), { ssr: false });

interface Donation {
  id: number;
  foodTitle: string;
  quantityKg: number;
  expiryTime: string;
  status: string;
  lat: number;
  lng: number;
  address?: string;
  instructions?: string;
  donor: {
    name: string;
  };
}

export default function VolunteerDashboard() {
  const [availableDonations, setAvailableDonations] = useState<Donation[]>([]);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [otpDetails, setOtpDetails] = useState<{ code: number; donationTitle: string } | null>(null);
  const [loadingClaim, setLoadingClaim] = useState(false);
  const [error, setError] = useState("");
  const [fetching, setFetching] = useState(true);

  const fetchAvailableDonations = async () => {
    try {
      setFetching(true);
      const res = await fetch("/api/donations/available");
      if (res.ok) {
        const data = await res.json();
        setAvailableDonations(data.donations);
      }
    } catch (err) {
      console.error("Failed to fetch donations", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchAvailableDonations();
  }, []);

  const handleClaim = async (donationId: number) => {
    setLoadingClaim(true);
    setError("");

    try {
      const res = await fetch("/api/pickups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationId }),
      });

      const data = await res.json();

      if (res.ok) {
        setOtpDetails({ code: data.otpCode, donationTitle: selectedDonation!.foodTitle });
        setSelectedDonation(null);
        fetchAvailableDonations();
      } else {
        setError(data.message || "Failed to claim donation");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoadingClaim(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Volunteer Hub</h1>
              <p className="text-sm text-gray-400">Find and claim surplus food near you to deliver.</p>
            </div>
          </div>
          <button 
            onClick={fetchAvailableDonations}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm font-bold text-gray-300 hover:bg-white/[0.08] hover:text-white transition-all"
          >
            <svg className={`w-4 h-4 ${fetching ? 'animate-spin text-emerald-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            {fetching ? "Refreshing..." : "Refresh Map"}
          </button>
        </div>

        {/* OTP Banner */}
        {otpDetails && (
          <div className="mb-8 p-6 bg-emerald-500/[0.06] border border-emerald-500/20 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px]"></div>
            
            <div className="flex-grow z-10">
              <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Donation Claimed Successfully!
              </h3>
              <p className="mt-1 text-gray-400 font-medium leading-relaxed text-sm">
                You have reserved <strong className="text-white">{otpDetails.donationTitle}</strong>. Proceed to the location and show this code to the donor.
              </p>
            </div>
            
            <div className="shrink-0 flex flex-col items-center bg-white/[0.04] border border-emerald-500/20 px-8 py-4 rounded-xl z-10">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Your Code</span>
              <span className="text-4xl font-black font-mono tracking-widest text-emerald-400">{otpDetails.code}</span>
            </div>
          </div>
        )}

        {/* Map Section */}
        <div className="relative bg-white/[0.04] border border-white/[0.08] rounded-2xl p-2 lg:p-3 mb-10 shadow-xl backdrop-blur-sm overflow-hidden">
          <MapComponent 
            donations={availableDonations} 
            onMarkerClick={(donation) => {
              setSelectedDonation(donation);
            }}
          />
          
          {/* Overlay HUD stats */}
          <div className="absolute top-6 right-6 z-[1000] pointer-events-none">
            <div className="bg-gray-950/80 backdrop-blur-xl px-4 py-2.5 rounded-full border border-white/[0.08] flex items-center gap-2.5 font-bold text-sm text-gray-300 pointer-events-auto shadow-lg">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
              {availableDonations.length} Active Donations
            </div>
          </div>
        </div>

        {/* Modal Selection Dialog */}
        {selectedDonation && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-gray-950/80 backdrop-blur-md overflow-y-auto w-full h-full p-4 transition-all duration-300">
            <div className="bg-gray-900 border border-white/[0.08] rounded-3xl shadow-2xl p-8 max-w-md w-full relative z-[10005] overflow-hidden">
              
              {/* Top accent gradient */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400"></div>
              
              <button
                onClick={() => {
                  setSelectedDonation(null);
                  setError("");
                }}
                className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.06]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>

              <div className="mb-6">
                <h3 className="text-2xl font-black text-white mb-2 pr-8 leading-tight">
                  {selectedDonation.foodTitle}
                </h3>
                <p className="text-emerald-400 text-sm font-bold flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  Donor: {selectedDonation.donor.name}
                </p>
              </div>

              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>
                    Quantity
                  </span>
                  <span className="text-sm font-bold text-white">{selectedDonation.quantityKg} kg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Expires At
                  </span>
                  <span className="text-sm font-bold text-white text-right">
                    {new Date(selectedDonation.expiryTime).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                    })}
                  </span>
                </div>
                
                {selectedDonation.address && (
                  <div className="flex flex-col gap-1 mt-2 pt-3 border-t border-white/[0.06]">
                    <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                      Exact Address
                    </span>
                    <span className="text-sm font-medium text-white pl-6">{selectedDonation.address}</span>
                  </div>
                )}
                
                {selectedDonation.instructions && (
                  <div className="flex flex-col gap-1 mt-1 pb-1">
                    <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Instructions
                    </span>
                    <span className="text-sm font-medium text-white pl-6">{selectedDonation.instructions}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-4">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedDonation.lat},${selectedDonation.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 px-3 bg-blue-500/10 text-blue-400 font-bold rounded-xl border border-blue-500/20 hover:bg-blue-500/20 hover:-translate-y-0.5 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                  Navigate
                </a>
                <button
                  onClick={() => handleClaim(selectedDonation.id)}
                  disabled={loadingClaim}
                  className="flex items-center justify-center gap-2 py-3 px-3 bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {loadingClaim ? (
                    <>
                      <svg className="animate-spin h-5 w-5 border-2 border-gray-900 border-t-transparent rounded-full" viewBox="0 0 24 24"></svg>
                      Claiming
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      Claim
                    </>
                  )}
                </button>
              </div>
              <p className="text-center text-xs text-gray-600 px-2">
                By claiming, you pledge to pick this up before expiration.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
