"use client"

import { useState, useEffect } from "react"
import { getStudentTrips, Trip } from "@/lib/student"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getStudentTrips()
      .then(setTrips)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="p-4 text-gray-700">Loading trips…</p>
  if (error) return <p className="p-4 text-red-600">{error}</p>

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Your Trip History</h1>
      
      {trips.length === 0 ? (
        <p className="text-gray-500">No trips recorded yet.</p>
      ) : (
        trips.map((t, i) => {
          const start = t.startTime ? new Date(t.startTime) : null
          const end   = t.endTime   ? new Date(t.endTime)   : null

          return (
            <Card key={i}>
              <CardHeader>
                <CardTitle>
                  {start ? start.toLocaleString() : "Unknown Start"} –{" "}
                  {end ? end.toLocaleTimeString() : "Unknown End"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-700 space-y-1">
                <p><strong>IP:</strong> {t.ipAddress || "Unknown"}</p>
                <p><strong>Device:</strong> {t.device || "Unknown"}</p>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
