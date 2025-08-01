// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth, getToken } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import Link from "next/link";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
  DirectionsService,
  DirectionsRenderer,
} from "@react-google-maps/api";

interface UserPayload {
  name?: string;
  role?: string;
  assignedBusId?: string;
  pickupLocation?: { latitude: number; longitude: number };
}
interface BusLocation {
  latitude: number;
  longitude: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserPayload>({});
  const [busLocation, setBusLocation] = useState<BusLocation | null>(null);
  const [loading, setLoading] = useState(true);

  // store the route result
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);

  // load Google Maps JS API
  const { isLoaded: mapLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  // 1️⃣ fetch user / assignedBusId & pickup
  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser((u) => ({ ...u, name: payload.name, role: payload.role }));
      } catch {}
    }
    fetchWithAuth("/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser((u) => ({
            ...u,
            assignedBusId: data.user.assignedBusId,
            pickupLocation: data.user.pickupLocation,
          }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // 2️⃣ poll bus location every 20s
  useEffect(() => {
    if (!user.assignedBusId) return;
    let cancelled = false;
    const fetchLoc = async () => {
      try {
        const res = await fetchWithAuth(
          `/bus/${user.assignedBusId}/location`
        );
        const json = await res.json();
        if (json.success && !cancelled) {
          setBusLocation(json.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchLoc();
    const iv = setInterval(fetchLoc, 20_000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [user.assignedBusId]);

  // 3️⃣ once we have both bus & pickup, ask Google for routing
  useEffect(() => {
    if (
      mapLoaded &&
      busLocation &&
      user.pickupLocation &&
      !directions
    ) {
      const svc = new window.google.maps.DirectionsService();
      svc.route(
        {
          origin: {
            lat: busLocation.latitude,
            lng: busLocation.longitude,
          },
          destination: {
            lat: user.pickupLocation.latitude,
            lng: user.pickupLocation.longitude,
          },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result) {
            setDirections(result);
          } else {
            console.error("Directions request failed:", status);
          }
        }
      );
    }
  }, [
    mapLoaded,
    busLocation,
    user.pickupLocation,
    directions,
  ]);

  if (loading) {
    return <div className="p-4 text-center">Loading dashboard…</div>;
  }

  const { name, assignedBusId, pickupLocation } = user;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {name ?? "User"}!
        </p>
      </header>

      {/* LIVE MAP + ROUTE */}
      {assignedBusId &&
        pickupLocation &&
        busLocation &&
        mapLoaded && (
          <div className="h-80 w-full rounded-lg overflow-hidden">
            {loadError ? (
              <div className="p-4 text-red-500">Map failed to load</div>
            ) : (
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={{
                  lat: busLocation.latitude,
                  lng: busLocation.longitude,
                }}
                zoom={13}
              >
                {/* bus marker */}
                <Marker
                  position={{
                    lat: busLocation.latitude,
                    lng: busLocation.longitude,
                  }}
                  label="🚌"
                />
                {/* pickup marker */}
                <Marker
                  position={{
                    lat: pickupLocation.latitude,
                    lng: pickupLocation.longitude,
                  }}
                  label="🎒"
                />
                {/* render the driving route */}
                {directions && (
                  <DirectionsRenderer
                    options={{
                      directions,
                      suppressMarkers: true,
                      polylineOptions: {
                        strokeColor: "#3b82f6",
                        strokeWeight: 5,
                      },
                    }}
                  />
                )}
              </GoogleMap>
            )}
          </div>
        )}

      {/* INFO CARDS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>My Bus</CardTitle>
            <CardDescription>Your assigned bus info</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-2xl font-bold">
              {assignedBusId ?? "Not Assigned"}
            </div>
            <p className="text-sm text-muted-foreground">
              {assignedBusId
                ? `Bus ID: ${assignedBusId}`
                : "No bus is currently assigned to you"}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Status</span>
                <span>{assignedBusId ? "On Route" : "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Route</span>
                <span>{assignedBusId ? "Campus Loop" : "N/A"}</span>
              </div>
            </div>
          </CardContent>
          {assignedBusId && (
            <Link href={`/dashboard/chat/${assignedBusId}`}>
              <Button>Message Driver</Button>
            </Link>
          )}
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Next Arrival</CardTitle>
            <CardDescription>
              Estimated arrival time at your stop
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* real ETA from Google’s response */}
            <div className="text-2xl font-bold">
              {directions
                ? directions.routes[0].legs[0].duration?.text
                : "--:--"}
            </div>
            <p className="text-sm text-muted-foreground">
              {directions
                ? "ETA to pickup"
                : "Calculating…"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Recent alerts and messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-2">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Bus Updates</p>
                <p className="text-sm text-muted-foreground">
                  {directions
                    ? `ETA: ${directions.routes[0].legs[0].duration?.text}`
                    : "Ready when bus is visible"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
