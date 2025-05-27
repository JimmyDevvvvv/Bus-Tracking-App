// components/LiveBusMap.tsx
"use client";

import { useEffect, useRef } from "react";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface LiveBusMapProps {
  busId: string;
  emitLive: boolean;
  studentPickup: LatLng;
  /** Optional live bus location */
  busLocation?: LatLng | null;
}

export default function LiveBusMap({
  busId,
  emitLive,
  studentPickup,
  busLocation = null,
}: LiveBusMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  // Fit both pickup & bus into view whenever they change
  useEffect(() => {
    if (!mapRef.current) return;
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({ lat: studentPickup.latitude, lng: studentPickup.longitude });
    if (busLocation) {
      bounds.extend({ lat: busLocation.latitude, lng: busLocation.longitude });
    }
    mapRef.current.fitBounds(bounds);
  }, [studentPickup, busLocation]);

  if (!isLoaded) return <div>Loading map…</div>;

  // helper zero-scale circle to hide default marker
  const hiddenIcon: google.maps.Symbol = {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 0,
  };

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      onLoad={map => {
        mapRef.current = map;
      }}
      // center/fallback — overridden by fitBounds
      center={{ lat: studentPickup.latitude, lng: studentPickup.longitude }}
      zoom={15}
    >
      {/* Student pickup marker as 🎒 */}
      <Marker
        position={{
          lat: studentPickup.latitude,
          lng: studentPickup.longitude,
        }}
        // icon={hiddenIcon}
        label= "🎒"
      />

      {/* Live bus marker as 🚌 */}
      {busLocation && (
        <Marker
          position={{
            lat: busLocation.latitude,
            lng: busLocation.longitude,
          }}
          
          label="🚌"
        />
      )}
    </GoogleMap>
  );
}
