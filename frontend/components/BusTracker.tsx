// components/BusTracker.tsx
"use client";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useBusLocation } from '@/lib/useBusLocation';
import { useEffect, useState } from 'react';

type BusTrackerProps = {
  busId: string;
  studentPickup: {
    latitude: number;
    longitude: number;
  };
};

export function BusTracker({ busId, studentPickup }: BusTrackerProps) {
  // studentPickup = {latitude,longitude}
  const busLoc = useBusLocation(busId);
  const [eta, setEta] = useState<string|null>(null);

  // fetch ETA from Google Distance Matrix
  useEffect(() => {
    if (busLoc) {
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric
         &origins=${busLoc.latitude},${busLoc.longitude}
         &destinations=${studentPickup.latitude},${studentPickup.longitude}
         &key=${key}`
      )
      .then(r => r.json())
      .then(d => {
        const element = d.rows[0]?.elements[0];
        if (element?.duration?.text) setEta(element.duration.text);
      })
      .catch(console.error);
    }
  }, [busLoc, studentPickup]);

  return (
    <div className="h-96 w-full">
      <MapContainer
        center={[studentPickup.latitude, studentPickup.longitude]}
        zoom={13} style={{ height:'100%', width:'100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {busLoc && (
          <Marker position={[busLoc.latitude, busLoc.longitude]}>
            <Popup>Bus here</Popup>
          </Marker>
        )}
        <Marker position={[studentPickup.latitude, studentPickup.longitude]}>
          <Popup>Your stop {eta && `(ETA: ${eta})`}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
