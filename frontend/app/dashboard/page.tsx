// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getToken, fetchWithAuth } from "@/lib/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Bell } from "lucide-react";
import dynamic from "next/dynamic";
import { io } from "socket.io-client";
import LiveBusMap from "@/components/LiveBusMap";
import { Button } from "@/components/ui/button";
import router from "next/router";

import Link from "next/link";
import { useRouter } from "next/navigation";

const BusTracker = dynamic(() => import("@/components/BusTracker"), { ssr: false });

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

function calculateETA(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  const avgSpeed = (30 * 1000) / 3600;
  const minutes = Math.ceil((d / avgSpeed) / 60);
  return `${minutes} mins`;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserPayload>({});
  const [busLocation, setBusLocation] = useState<BusLocation | null>(null);
  const [eta, setEta] = useState<string>("Calculating…");
  const [loading, setLoading] = useState(true);

  // 1️⃣ Fetch student info
  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser(u => ({ ...u, name: payload.name, role: payload.role }));
      } catch {}
    }

    fetchWithAuth("/auth/me")
      .then(r => r.json())
      .then(data => {
        if (data.success && data.user) {
          setUser(u => ({
            ...u,
            assignedBusId: data.user.assignedBusId,
            pickupLocation: data.user.pickupLocation,
          }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // 2️⃣ Socket + live tracking
  useEffect(() => {
    if (!user.assignedBusId) return;

    const socket = io("http://localhost:5002");
    socket.emit("join-bus-room", { busId: user.assignedBusId });

    // student does NOT emit own, only driver does that
    socket.on("bus-location", data => {
      if (data.latitude != null && data.longitude != null) {
        const loc = { latitude: data.latitude, longitude: data.longitude };
        setBusLocation(loc);

        // recalc ETA if pickup known
        if (user.pickupLocation) {
          setEta(calculateETA(
            loc.latitude,
            loc.longitude,
            user.pickupLocation.latitude,
            user.pickupLocation.longitude
          ));
        }
      }
    });

    socket.on("connect_error", console.error);
    return () => { socket.disconnect(); };
  }, [user.assignedBusId, user.pickupLocation]);

  if (loading) {
    return <div className="p-4 text-center">Loading dashboard…</div>;
  }

  const { name, assignedBusId, pickupLocation } = user;
console.log("bus location:", busLocation);
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {name ?? "User"}!
        </p>
      </header>

      {/* LIVE MAP via BusTracker */}
      {assignedBusId && pickupLocation && (
  <div className="h-80 w-full rounded-lg overflow-hidden">
    <LiveBusMap
      busId={assignedBusId}
      emitLive={false}     // student only listens
      studentPickup={pickupLocation}
    />
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
              <div className="flex justify-between">
                <span>ETA</span>
                <span>
                  {assignedBusId && pickupLocation && busLocation
                    ? eta
                    : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
                      
                      <Link href={`/dashboard/chat/${assignedBusId}`}>
                          <Button>Message Driver</Button>
                        </Link>
                    
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Next Arrival</CardTitle>
            <CardDescription>
              Estimated arrival time at your stop
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-2xl font-bold">
              {assignedBusId && pickupLocation && busLocation ? eta : "--:--"}
            </div>
            <p className="text-sm text-muted-foreground">
              {assignedBusId
                ? "Live ETA updated regularly."
                : "No upcoming arrivals"}
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
                  {assignedBusId && pickupLocation && busLocation
                    ? `Your bus ETA: ${eta}`
                    : "Set up your profile to get started."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
