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
        setSelectedDonation(null); // Close the interaction modal
        fetchAvailableDonations(); // Refresh the map to remove claimed pin
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-colors duration-300">
      
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Volunteer Hub</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Find and claim surplus food near you to deliver.</p>
        </div>
        <button 
          onClick={fetchAvailableDonations}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
        >
          <svg className={`w-4 h-4 ${fetching ? 'animate-spin text-emerald-500' : 'text-gray-500 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          {fetching ? "Refreshing..." : "Refresh Map"}
        </button>
      </div>

      {/* OTP Banner (Visible after successfully claiming food) */}
      {otpDetails && (
        <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 transition-all">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl"></div>
          
          <div className="flex-grow z-10">
            <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
              <svg className="w-6 h-6 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Donation Claimed Successfully!
            </h3>
            <p className="mt-1 text-emerald-700 dark:text-emerald-400/80 font-medium leading-relaxed">
              You have reserved <strong>{otpDetails.donationTitle}</strong>. Please proceed to the location. Show this verification code to the donor when you arrive.
            </p>
          </div>
          
          <div className="shrink-0 flex flex-col items-center bg-white dark:bg-gray-900 px-8 py-4 rounded-xl shadow-lg border border-emerald-100 dark:border-emerald-800/40 z-10">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Your Code</span>
            <span className="text-4xl font-black font-mono tracking-widest text-emerald-600 dark:text-emerald-400">{otpDetails.code}</span>
          </div>
        </div>
      )}

      {/* Map Section */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-2 lg:p-4 mb-10 transition-colors">
        <MapComponent 
          donations={availableDonations} 
          onMarkerClick={(donation) => {
            setSelectedDonation(donation);
          }}
        />
        
        {/* Overlay HUD stats */}
        <div className="absolute top-6 right-6 z-[1000] pointer-events-none">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center gap-2 font-bold text-sm text-gray-700 dark:text-gray-300 pointer-events-auto transition-colors">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            {availableDonations.length} Active Donations
          </div>
        </div>
      </div>

      {/* Modal Selection Dialog */}
      {selectedDonation && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-gray-900/60 dark:bg-gray-950/80 backdrop-blur-sm overflow-y-auto w-full h-full p-4 transition-all duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-md w-full relative z-[10005] overflow-hidden border border-gray-100 dark:border-gray-800 transform scale-100 transition-transform">
            
            <button
              onClick={() => {
                setSelectedDonation(null);
                setError("");
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            <div className="mb-6">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 pr-6 leading-tight">
                {selectedDonation.foodTitle}
              </h3>
              <p className="text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                Donor: {selectedDonation.donor.name}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 mb-8 space-y-4 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>
                  Quantity
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{selectedDonation.quantityKg} kg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Expires At
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white text-right">
                  {new Date(selectedDonation.expiryTime).toLocaleString(undefined, {
                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                  })}
                </span>
              </div>
              
              {selectedDonation.address && (
                <div className="flex flex-col gap-1 mt-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                    Exact Address
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white pl-6">{selectedDonation.address}</span>
                </div>
              )}
              
              {selectedDonation.instructions && (
                <div className="flex flex-col gap-1 mt-1 pb-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Instructions
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white pl-6">{selectedDonation.instructions}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedDonation.lat},${selectedDonation.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                Navigate
              </a>
              <button
                onClick={() => handleClaim(selectedDonation.id)}
                disabled={loadingClaim}
                className="w-full flex items-center justify-center gap-2 py-3 px-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-gray-900 font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:transform-none"
              >
                {loadingClaim ? (
                  <>
                    <svg className="animate-spin h-5 w-5 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full" viewBox="0 0 24 24"></svg>
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
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4 px-2">
              By claiming this donation, you pledge to pick it up before expiration. Let's make a difference.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
