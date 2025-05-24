"use client";

import { useEffect, useState } from "react";
import { getToken, fetchWithAuth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell } from "lucide-react";
import dynamic from "next/dynamic";
import { io } from "socket.io-client";

const BusTracker = dynamic(() => import("@/components/BusTracker"), { ssr: false });

interface UserPayload {
  name?: string;
  role?: string;
  assignedBusId?: string;
  pickupLocation?: { latitude: number; longitude: number };
  dropoffLocation?: { latitude: number; longitude: number };
  route?: string;
}

interface BusLocation {
  latitude: number;
  longitude: number;
}

function calculateETA(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  const avgSpeed = 30 * 1000 / 3600;
  const seconds = d / avgSpeed;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} mins`;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserPayload>({});
  const [busLocation, setBusLocation] = useState<BusLocation | null>(null);
  const [eta, setEta] = useState<string>("Calculating…");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const p = JSON.parse(atob(token.split(".")[1]));
        setUser(u => ({ ...u, name: p.name, role: p.role }));
      } catch {}
    }

    Promise.all([
      fetchWithAuth("/api/student/profile").then(r => r.json()),
      fetchWithAuth("/api/student/route").then(r => r.json()),
    ])
    .then(([profileData, routeData]) => {
      if (profileData.success && profileData.user) {
        setUser(u => ({
          ...u,
          assignedBusId: profileData.user.assignedBusId,
          pickupLocation: profileData.user.pickupLocation,
          dropoffLocation: profileData.user.dropoffLocation,
        }));
      }
      if (routeData.success && routeData.route) {
        setUser(u => ({ ...u, route: routeData.route }));
      }
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user.assignedBusId) return;

    const socket = io("http://localhost:5002");
    socket.emit("join-bus-room", { busId: user.assignedBusId });

    if (user.role === "student") {
      navigator.geolocation.watchPosition(
        pos => {
          const latitude = pos.coords.latitude;
          const longitude = pos.coords.longitude;
          socket.emit("location-update", {
            busId: user.assignedBusId,
            latitude,
            longitude,
          });
        },
        err => console.error("Geolocation error:", err),
        { enableHighAccuracy: true }
      );
    }

    socket.on("bus-location", data => {
      if (data.latitude && data.longitude) {
        const newLoc = { latitude: data.latitude, longitude: data.longitude };
        setBusLocation(newLoc);

        if (user.pickupLocation) {
          const est = calculateETA(
            newLoc.latitude,
            newLoc.longitude,
            user.pickupLocation.latitude,
            user.pickupLocation.longitude
          );
          setEta(est);
        }
      }
    });

    socket.on("connect_error", err => {
      console.error("Socket.IO error:", err);
    });

    return () => {
      socket.disconnect();
    };
  }, [user.assignedBusId, user.role, user.pickupLocation]);

  if (loading) {
    return <div className="p-4 text-center">Loading dashboard…</div>;
  }

  const { name, assignedBusId, pickupLocation, route } = user;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {name ?? "User"}!</p>
      </header>

      {assignedBusId && pickupLocation && busLocation ? (
        <div className="h-80 w-full rounded-lg overflow-hidden">
          <div style={{ height: "320px", width: "100%", borderRadius: "0.5rem", overflow: "hidden" }}>
            <BusTracker
              busId={assignedBusId}
              busLocation={busLocation}
              studentPickup={pickupLocation}
            />
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>My Bus</CardTitle>
            <CardDescription>Your assigned bus information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-2xl font-bold">
              {assignedBusId ?? "Not Assigned"}
            </div>
            <p className="text-sm text-muted-foreground">
              {assignedBusId ? `Bus ID: ${assignedBusId}` : "No bus is currently assigned to you"}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Status</span>
                <span className="text-muted-foreground">
                  {assignedBusId ? "On Route" : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Route</span>
                <span className="text-muted-foreground">
                  {assignedBusId ? route ?? "Loading…" : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">ETA</span>
                <span className="text-muted-foreground">
                  {assignedBusId && pickupLocation && busLocation ? eta : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Next Arrival</CardTitle>
            <CardDescription>Estimated arrival time at your stop</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-2xl font-bold">{assignedBusId && pickupLocation && busLocation ? eta : "--:--"}</div>
            <p className="text-sm text-muted-foreground">
              {assignedBusId ? "Live ETA updated regularly." : "No upcoming arrivals"}
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
                  {assignedBusId && pickupLocation && busLocation ? `Your bus ETA: ${eta}` : "Set up your profile to get started."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
