// components/LiveBusMap.tsx
"use client";

import { useEffect, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { io } from "socket.io-client";

export type LatLng = { latitude: number; longitude: number };

interface LiveBusMapProps {
  /** The bus room to join */
  busId: string;
  /** If true, will watchPosition() and emit your coords (for driver) */
  emitLive?: boolean;
  /** If provided, render a second “🎒” marker at pickup (for student) */
  studentPickup?: LatLng;
}

export default function LiveBusMap({
  busId,
  emitLive = false,
  studentPickup,
}: LiveBusMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  const [busLocation, setBusLocation] = useState<LatLng | null>(null);

  useEffect(() => {
    const socket = io("http://localhost:5002");
    socket.emit("join-bus-room", { busId });

    // if driver side, emit your GPS
    let watcher: number;
    if (emitLive && navigator.geolocation) {
      watcher = navigator.geolocation.watchPosition(
        pos => {
          socket.emit("location-update", {
            busId,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        console.error,
        { enableHighAccuracy: true }
      );
    }

    // always listen for bus-location
    socket.on("bus-location", (data: any) => {
      if (data.latitude != null && data.longitude != null) {
        setBusLocation({
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
    });

    socket.on("connect_error", console.error);

    return () => {
      if (emitLive && watcher !== undefined)
        navigator.geolocation.clearWatch(watcher);
      socket.disconnect();
    };
  }, [busId, emitLive]);

  if (loadError) return <div className="p-4 text-red-500">Map load error</div>;
  if (!isLoaded) return <div className="p-4 text-center">Loading map…</div>;

  // center on bus or pickup or fallback
  const center = busLocation
    ? { lat: busLocation.latitude, lng: busLocation.longitude }
    : studentPickup
    ? { lat: studentPickup.latitude, lng: studentPickup.longitude }
    : { lat: 0, lng: 0 };

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={center}
      zoom={14}
      onLoad={map => {
        // optional: fit both markers
        const bounds = new window.google.maps.LatLngBounds();
        if (busLocation)
          bounds.extend({ lat: busLocation.latitude, lng: busLocation.longitude });
        if (studentPickup)
          bounds.extend({ lat: studentPickup.latitude, lng: studentPickup.longitude });
        if (!bounds.isEmpty()) map.fitBounds(bounds);
      }}
    >
      {busLocation && (
        <Marker
          position={{ lat: busLocation.latitude, lng: busLocation.longitude }}
          label="🚌"
        />
      )}
      {studentPickup && (
        <Marker
          position={{ lat: studentPickup.latitude, lng: studentPickup.longitude }}
          label="🎒"
        />
      )}
    </GoogleMap>
  );
}
