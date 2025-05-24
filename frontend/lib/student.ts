// lib/student.ts
import { fetchWithAuth } from "./auth"

export interface StudentProfile {
  _id: string
  name: string
  email: string
  role: "student"
  profilePicture?: string
  pickupLocation?: { address?: string }
  dropoffLocation?: { address?: string }
}

export interface Trip {
  startTime: string
  endTime: string
  ipAddress: string
  device: string
}

// Fetch the student profile
export const getStudentProfile = async (): Promise<StudentProfile> => {
  const res = await fetchWithAuth("/student/profile")
  const data = await res.json()
  if (!data.success) throw new Error(data.error || "Failed to load profile")
  return data.user as StudentProfile
}

// Update student profile
export const updateStudentProfile = async (updates: {
  name?: string
  email?: string
  pickupLocation?: { address: string }
  dropoffLocation?: { address: string }
}): Promise<StudentProfile> => {
  const body = new FormData()
  if (updates.name) body.append("name", updates.name)
  if (updates.email) body.append("email", updates.email)
  if (updates.pickupLocation)
    body.append("pickupLocation", JSON.stringify(updates.pickupLocation))
  if (updates.dropoffLocation)
    body.append("dropoffLocation", JSON.stringify(updates.dropoffLocation))

  const res = await fetchWithAuth("/student/profile", {
    method: "PATCH",
    body,
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || "Failed to update profile")
  return data.user as StudentProfile
}

// Fetch and normalize trips
export const getStudentTrips = async (): Promise<Trip[]> => {
  const res = await fetchWithAuth("/student/trips")
  const data = await res.json()
  if (!data.success) throw new Error(data.error || "Failed to load trips")

  const rawTrips = data.trips as any[]

  const normalized: Trip[] = rawTrips.map((log) => ({
    startTime: log.startTime || log.date || "",  // fallback if format changes
    endTime: log.endTime || log.date || "",
    ipAddress: log.ipAddress || "Unknown",
    device: log.device || "Unknown"
  }))

  return normalized
}
