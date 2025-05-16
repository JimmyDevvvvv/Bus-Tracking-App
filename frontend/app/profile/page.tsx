"use client"

import { useState, useEffect } from "react"
import { fetchWithAuth, updateProfile } from "@/lib/auth"
import { LocationPicker, Place } from "@/components/LocationPicker"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User as UserIcon, MapPin, Bus } from "lucide-react"
import { motion } from "framer-motion"

interface UserProfile {
  _id: string
  name: string
  email: string
  role: "student" | "driver" | "admin"
  profilePicture?: string
  pickupLocation?: Place
  dropoffLocation?: Place

  sessionLogs?: any[]
}

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // form state
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [pickup, setPickup] = useState<Place | null>(null)
  const [dropoff, setDropoff] = useState<Place | null>(null)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  // load profile
  useEffect(() => {
    fetchWithAuth("/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user)
          setEditName(data.user.name)
          setEditEmail(data.user.email)
          setPreviewUrl(data.user.profilePicture || null)
          if (data.user.pickupLocation) setPickup(data.user.pickupLocation as Place)
          if (data.user.dropoffLocation) setDropoff(data.user.dropoffLocation as Place)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    if (f) setPreviewUrl(URL.createObjectURL(f))
  }

  const handleSave = async () => {
    setSaveError(null)
    setSaveSuccess(null)
    setSaving(true)

    const { success, user: updated, error } = await updateProfile({
      name: editName,
      email: editEmail,
      profilePicture: file || undefined,
      pickupLocation: pickup || undefined,
      dropoffLocation: dropoff || undefined,
    })

    setSaving(false)
    if (success && updated) {
      setUser(updated)
      setSaveSuccess("Profile saved!")
      setFile(null)
      setPreviewUrl(updated.profilePicture || null)
    } else {
      setSaveError(error || "Could not save profile")
    }
  }

  if (loading) {
    return <div className="p-4 text-center">Loading your profile…</div>
  }
  if (!user) {
    return <div className="p-4 text-red-600 text-center">Could not load profile.</div>
  }

  // build map embed URL
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  let mapSrc: string | null = null
  if (pickup && dropoff && key) {
    mapSrc =
      `https://www.google.com/maps/embed/v1/directions?key=${key}` +
      `&origin=${pickup.latitude},${pickup.longitude}` +
      `&destination=${dropoff.latitude},${dropoff.longitude}` +
      `&zoom=14`
  } else if (pickup && key) {
    mapSrc =
      `https://www.google.com/maps/embed/v1/place?key=${key}` +
      `&q=${pickup.latitude},${pickup.longitude}&zoom=15`
  } else if (dropoff && key) {
    mapSrc =
      `https://www.google.com/maps/embed/v1/place?key=${key}` +
      `&q=${dropoff.latitude},${dropoff.longitude}&zoom=15`
  }

  return (
    <div className="h-full flex flex-col">
      {/* HEADER */}
      <div className="p-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">Manage your profile & preferences</p>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT CARD + MAP */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card>
                <CardContent className="pt-6 flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4">
                    {previewUrl ? (
                      <AvatarImage src={previewUrl} alt={user.name} />
                    ) : (
                      <AvatarFallback>
                        {user.name.split(" ").map((w) => w[0]).join("")}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <h2 className="text-xl font-bold">{user.name}</h2>
                  <Badge className="mt-2 capitalize">{user.role}</Badge>
                  <div className="w-full mt-6 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" /> {user.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />{" "}
                      {user.pickupLocation?.address || "No pickup set"}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />{" "}
                      {user.dropoffLocation?.address || "No drop-off set"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Bus className="h-4 w-4 text-muted-foreground" />{" "}
                      {user.sessionLogs?.length ?? 0} trips
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {mapSrc && (
              <iframe
                title="pickup/dropoff map"
                width="100%"
                height="200"
                className="rounded-md border-0"
                loading="lazy"
                src={mapSrc}
              />
            )}
          </div>

          {/* SETTINGS PANEL */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="settings">
              <TabsList className="w-full">
                <TabsTrigger value="settings" className="flex-1">
                  Settings
                </TabsTrigger>
              </TabsList>
              <TabsContent value="settings" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {saveError && <p className="text-red-600">{saveError}</p>}
                    {saveSuccess && <p className="text-green-600">{saveSuccess}</p>}

                    {/* Profile picture uploader */}
                    <div className="space-y-2">
                      <Label htmlFor="pic">Profile Picture</Label>
                      <Input id="pic" type="file" accept="image/*" onChange={handleFileChange} />
                    </div>

                    {/* Name & Email */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                      />
                    </div>

                    {/* Pickup & Drop-off pickers */}
                    <LocationPicker label="Pickup Location" value={pickup ?? null} onSelect={setPickup} />
                  

                    <Button onClick={handleSave} disabled={saving} className="w-full">
                      {saving ? "Saving…" : "Save Changes"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
