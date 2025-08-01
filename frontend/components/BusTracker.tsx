"use client";

import React from "react";
import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%",
  minHeight: "350px",
  borderRadius: "0.75rem",
};

interface Props {
  busId: string;
  busLocation: { latitude: number; longitude: number };
  studentPickup: { latitude: number; longitude: number };
}

const BusTrackerGoogle: React.FC<Props> = ({ busId, busLocation, studentPickup }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!, // Add this to .env
  });

  const path = [
    { lat: busLocation.latitude, lng: busLocation.longitude },
    { lat: studentPickup.latitude, lng: studentPickup.longitude },
  ];

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={path[0]}
      zoom={14}
    >
      <Marker position={path[0]} label="Bus" />
      <Marker position={path[1]} label="Pickup" />
      <Polyline path={path} options={{ strokeColor: "#4285F4" }} />
    </GoogleMap>
  ) : (
    <div>Loading map...</div>
  );
};

export default BusTrackerGoogle;
