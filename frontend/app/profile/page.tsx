"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, MapPin, Clock, Bus, History, Award } from "lucide-react"
import { motion } from "framer-motion"

// Mock data for favorite routes
const FAVORITE_ROUTES = [
  {
    id: "fav-1",
    name: "Main Campus Loop",
    stops: ["Student Center", "Library"],
    color: "#0070f3",
  },
  {
    id: "fav-2",
    name: "North Campus Express",
    stops: ["Main Gate", "Engineering Building"],
    color: "#10b981",
  },
]

// Mock data for recent trips
const RECENT_TRIPS = [
  {
    id: "trip-1",
    route: "Main Campus Loop",
    from: "Student Center",
    to: "Library",
    date: "Today, 2:30 PM",
    color: "#0070f3",
  },
  {
    id: "trip-2",
    route: "North Campus Express",
    from: "Engineering Building",
    to: "Research Center",
    date: "Yesterday, 10:15 AM",
    color: "#10b981",
  },
  {
    id: "trip-3",
    route: "South Campus Shuttle",
    from: "Business School",
    to: "Arts Center",
    date: "Mar 15, 4:45 PM",
    color: "#f59e0b",
  },
]

// Mock data for achievements
const ACHIEVEMENTS = [
  {
    id: "ach-1",
    name: "Early Bird",
    description: "Used the bus before 8 AM",
    icon: Clock,
    unlocked: true,
    progress: 100,
  },
  {
    id: "ach-2",
    name: "Campus Explorer",
    description: "Visited all campus stops",
    icon: MapPin,
    unlocked: false,
    progress: 75,
  },
  {
    id: "ach-3",
    name: "Eco Warrior",
    description: "Used the bus 50 times",
    icon: Bus,
    unlocked: false,
    progress: 60,
  },
]

export default function Profile() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">Manage your profile and preferences</p>
          </div>
          <Button>Edit Profile</Button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src="/placeholder.svg" alt="Profile" />
                      <AvatarFallback>JS</AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold">John Smith</h2>
                    <p className="text-muted-foreground">Computer Science</p>
                    <Badge className="mt-2">Student</Badge>

                    <div className="w-full mt-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">john.smith@university.edu</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">North Campus Dormitories</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bus className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">87 trips taken</span>
                      </div>
                    </div>

                    <div className="w-full mt-6 pt-6 border-t">
                      <h3 className="font-semibold mb-3">Favorite Routes</h3>
                      <div className="space-y-3">
                        {FAVORITE_ROUTES.map((route) => (
                          <div key={route.id} className="flex items-center gap-3">
                            <div className="w-2 h-8 rounded-full" style={{ backgroundColor: route.color }} />
                            <div>
                              <p className="font-medium">{route.name}</p>
                              <p className="text-xs text-muted-foreground">{route.stops.join(" → ")}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="lg:col-span-2">
            <Tabs defaultValue="trips">
              <TabsList className="w-full">
                <TabsTrigger value="trips" className="flex-1">
                  Recent Trips
                </TabsTrigger>
                <TabsTrigger value="achievements" className="flex-1">
                  Achievements
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex-1">
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="trips" className="mt-6 space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Trip History
                </h3>

                {RECENT_TRIPS.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-full rounded-full" style={{ backgroundColor: trip.color }} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{trip.route}</h4>
                              <span className="text-xs text-muted-foreground">{trip.date}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{trip.from}</span>
                              <span className="text-sm text-muted-foreground">→</span>
                              <span className="text-sm">{trip.to}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                <Button variant="outline" className="w-full">
                  View All Trips
                </Button>
              </TabsContent>

              <TabsContent value="achievements" className="mt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
                  <Award className="h-5 w-5" />
                  Your Achievements
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ACHIEVEMENTS.map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className={achievement.unlocked ? "border-primary/50" : ""}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${achievement.unlocked ? "bg-primary/20" : "bg-muted"}`}>
                              <achievement.icon
                                className={`h-5 w-5 ${achievement.unlocked ? "text-primary" : "text-muted-foreground"}`}
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{achievement.name}</h4>
                              <p className="text-sm text-muted-foreground">{achievement.description}</p>

                              <div className="mt-3">
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-primary" style={{ width: `${achievement.progress}%` }} />
                                </div>
                                <div className="flex justify-between mt-1">
                                  <span className="text-xs text-muted-foreground">{achievement.progress}%</span>
                                  {achievement.unlocked && <span className="text-xs text-primary">Completed</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" defaultValue="John Smith" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" defaultValue="john.smith@university.edu" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Default Location</Label>
                      <Input id="location" defaultValue="North Campus Dormitories" />
                    </div>
                    <Button>Save Changes</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="default-route">Default Route</Label>
                      <select id="default-route" className="w-full p-2 rounded-md border">
                        <option>Main Campus Loop</option>
                        <option>North Campus Express</option>
                        <option>South Campus Shuttle</option>
                        <option>East-West Connector</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="default-stop">Default Stop</Label>
                      <select id="default-stop" className="w-full p-2 rounded-md border">
                        <option>Student Center</option>
                        <option>Library</option>
                        <option>Science Building</option>
                        <option>Dormitories</option>
                      </select>
                    </div>
                    <Button>Save Preferences</Button>
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
