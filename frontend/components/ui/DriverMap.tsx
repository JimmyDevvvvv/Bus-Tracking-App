"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import L from "leaflet";

const busIcon = new L.Icon({
  iconUrl: "/bus-icon.png", // Optional: Add custom bus icon
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export default function DriverMap() {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        console.error("Error getting location:", err);
      }
    );
  }, []);

  if (!position) return <div className="text-sm text-muted-foreground">Getting location…</div>;

  return (
    <MapContainer center={position} zoom={15} style={{ height: "200px", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={position} icon={busIcon}>
        <Popup>You are here</Popup>
      </Marker>
    </MapContainer>
  );
}
