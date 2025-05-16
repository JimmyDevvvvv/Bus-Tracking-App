"use client"

import { useEffect, useState } from "react"
import { getToken, fetchWithAuth } from "@/lib/auth"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Bell } from "lucide-react"
import { BusTracker } from "@/components/BusTracker"  // your map + socket component

interface UserPayload {
  name?: string
  role?: string
  assignedBusId?: string
  pickupLocation?: { latitude: number; longitude: number }
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserPayload>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Decode name/role from token
    const token = getToken()
    if (token) {
      try {
        const p = JSON.parse(atob(token.split(".")[1]))
        setUser(u => ({ ...u, name: p.name, role: p.role }))
      } catch {}
    }

    // Fetch /auth/me to get bus & pickup
    fetchWithAuth("/auth/me")
      .then(r => r.json())
      .then(data => {
        if (data.success && data.user) {
          setUser(u => ({
            ...u,
            assignedBusId: data.user.assignedBusId,
            pickupLocation: data.user.pickupLocation,
          }))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // While loading
  if (loading) {
    return <div className="p-4 text-center">Loading dashboard…</div>
  }

  const { name, assignedBusId, pickupLocation } = user

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {name ?? "User"}!
        </p>
      </header>

      {/* If bus & pickup exist, show live map tracker */}
      {assignedBusId && pickupLocation ? (
        <div className="h-80 w-full rounded-lg overflow-hidden">
          <BusTracker
            busId={assignedBusId}
            studentPickup={{
              latitude: pickupLocation.latitude,
              longitude: pickupLocation.longitude,
            }}
          />
        </div>
      ) : null}

      {/* Status cards */}
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
              {assignedBusId
                ? `Bus ID: ${assignedBusId}`
                : "No bus is currently assigned to you"}
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
                  {assignedBusId ? "Campus Loop" : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">ETA</span>
                <span className="text-muted-foreground">
                  {assignedBusId ? "Calculating…" : "N/A"}
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
            <div className="text-2xl font-bold">
              {assignedBusId ? "—:—" : "--:--"}
            </div>
            <p className="text-sm text-muted-foreground">
              {assignedBusId
                ? "Fetching live ETA…"
                : "No upcoming arrivals"}
            </p>
            <div className="space-y-2">
              <div className="h-[4px] w-full rounded-full bg-muted">
                <div className="h-full w-0 rounded-full bg-primary" />
              </div>
              <div className="flex justify-between text-xs">
                <span>Bus Position</span>
                <span>Your Stop</span>
              </div>
            </div>
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
                <p className="text-sm font-medium">Welcome to BusTracker!</p>
                <p className="text-sm text-muted-foreground">
                  {assignedBusId
                    ? "Your bus is on the way."
                    : "Set up your profile to get started."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
