"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default Leaflet markers in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Donation {
  id: number;
  foodTitle: string;
  quantityKg: number;
  expiryTime: string;
  status: string;
  lat: number;
  lng: number;
  donor: {
    name: string;
  };
}

interface MapProps {
  donations: Donation[];
  onMarkerClick: (donation: Donation) => void;
}

function CenterMap({ donations }: { donations: Donation[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (donations.length > 0) {
      const bounds = L.latLngBounds(donations.map((d) => [d.lat, d.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [donations, map]);
  
  return null;
}

export default function Map({ donations, onMarkerClick }: MapProps) {
  // Default center if no donations exist (e.g., center of US)
  const defaultCenter: [number, number] = [39.8283, -98.5795];

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-md border border-gray-200 z-0">
      <MapContainer
        center={donations.length > 0 ? [donations[0].lat, donations[0].lng] : defaultCenter}
        zoom={4}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {donations.map((donation) => (
          <Marker
            key={donation.id}
            position={[donation.lat, donation.lng]}
            eventHandlers={{
              click: () => onMarkerClick(donation),
            }}
          >
            {/* The popup is optional here since we use a custom modal, 
                but we can keep a small tooltip or just let the modal trigger. */}
          </Marker>
        ))}
        
        <CenterMap donations={donations} />
      </MapContainer>
    </div>
  );
}
