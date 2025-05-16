// pages/trips.tsx (or app/trips/page.tsx)
"use client"

import { useState, useEffect } from "react"
import { getStudentTrips } from "@/lib/student"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface Trip {
  startTime: string
  endTime: string
  ipAddress: string
  device: string
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    getStudentTrips()
      .then(setTrips)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading trips…</p>
  if (error)   return <p className="text-red-600">{error}</p>

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Your Trip History</h1>
      {trips.length === 0 ? (
        <p className="text-gray-500">No trips recorded yet.</p>
      ) : (
        trips.map((t, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>
                {new Date(t.startTime).toLocaleString()} – {new Date(t.endTime).toLocaleTimeString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700">
              <p><strong>IP:</strong> {t.ipAddress}</p>
              <p><strong>Device:</strong> {t.device}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
