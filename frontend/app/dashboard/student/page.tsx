"use client";

import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { MapPin, Bus, Clock, Navigation, Bell, Search, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

export default function StudentDashboard() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Redirect if not authenticated or not a student
    if (!isLoading && (!user || user.role !== "student")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
          <p className="text-muted-foreground">Track buses and manage your routes</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">Welcome, {user.name}</span>
          <Button variant="outline" onClick={logout}>Logout</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Next Bus</CardTitle>
            <CardDescription>Arriving soon at your stop</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 rounded-full mr-3">
                  <Bus className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Campus Loop</p>
                  <p className="text-sm text-muted-foreground">Arrives in 5 min</p>
                </div>
              </div>
              <Button size="sm" variant="outline">Track</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Favorite Stop</CardTitle>
            <CardDescription>Your preferred bus stop</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 rounded-full mr-3">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Student Center</p>
                  <p className="text-sm text-muted-foreground">2 active routes</p>
                </div>
              </div>
              <Button size="sm" variant="outline">Change</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Schedule</CardTitle>
            <CardDescription>Today's bus schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 rounded-full mr-3">
                  <CalendarClock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">3 Trips Today</p>
                  <p className="text-sm text-muted-foreground">Next at 3:30 PM</p>
                </div>
              </div>
              <Button size="sm" variant="outline">View</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Notifications</CardTitle>
            <CardDescription>Recent alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 rounded-full mr-3">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">2 New Alerts</p>
                  <p className="text-sm text-muted-foreground">Route changes</p>
                </div>
              </div>
              <Button size="sm" variant="outline">View</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Live Bus Tracking</CardTitle>
            <CardDescription>Track buses in real-time</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] flex items-center justify-center bg-muted/30 border-2 border-dashed">
            <div className="text-center">
              <Navigation className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Map View</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Interactive map showing real-time locations of all buses on campus.
              </p>
              <Button className="mt-4">Enable Live Tracking</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Routes</CardTitle>
            <CardDescription>Currently running buses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search routes..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              {[
                { name: "Campus Loop", status: "On time", eta: 5 },
                { name: "North Express", status: "Delayed", eta: 15 },
                { name: "South Route", status: "On time", eta: 10 },
                { name: "East Shuttle", status: "On time", eta: 8 }
              ].filter(route => route.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((route, index) => (
                <div key={index} className="flex items-center p-3 rounded-md border">
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">{route.name}</p>
                      <Badge variant={route.status === "On time" ? "outline" : "destructive"}>
                        {route.status}
                      </Badge>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Arrives in {route.eta} min</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Track
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Bus Schedule</CardTitle>
          <CardDescription>Plan your trips for the week</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="today" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="today" className="flex-1">Today</TabsTrigger>
              <TabsTrigger value="tomorrow" className="flex-1">Tomorrow</TabsTrigger>
              <TabsTrigger value="week" className="flex-1">This Week</TabsTrigger>
            </TabsList>
            <TabsContent value="today">
              <div className="space-y-4">
                {[
                  { time: "8:30 AM", route: "Campus Loop", from: "Dormitories", to: "Main Building" },
                  { time: "1:15 PM", route: "East Shuttle", from: "Science Center", to: "Library" },
                  { time: "5:45 PM", route: "North Express", from: "Main Building", to: "Dormitories" }
                ].map((trip, index) => (
                  <div key={index} className="flex items-center border-b pb-4">
                    <div className="bg-primary/10 p-3 rounded-full mr-4">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <p className="font-medium">{trip.time}</p>
                        <Badge>{trip.route}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        From {trip.from} to {trip.to}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">Remind</Button>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="tomorrow">
              <div className="flex items-center justify-center py-12 text-center">
                <div className="max-w-md">
                  <CalendarClock className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Future Schedule</h3>
                  <p className="text-sm text-muted-foreground">
                    Your scheduled trips for tomorrow will appear here.
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="week">
              <div className="flex items-center justify-center py-12 text-center">
                <div className="max-w-md">
                  <CalendarClock className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Weekly Schedule</h3>
                  <p className="text-sm text-muted-foreground">
                    Your weekly schedule will appear here.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 