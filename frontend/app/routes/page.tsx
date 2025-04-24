"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Bus, MapPin, ChevronRight, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import Map from "@/components/map"

// Mock data for routes
const ROUTES = [
  {
    id: "route-1",
    name: "Main Campus Loop",
    color: "#4A90E2",
    stops: [
      { id: "stop-1", name: "Student Center", eta: 3, location: { lat: 40.7128, lng: -74.006 } },
      { id: "stop-2", name: "Library", eta: 7, location: { lat: 40.714, lng: -74.005 } },
      { id: "stop-3", name: "Science Building", eta: 12, location: { lat: 40.716, lng: -74.001 } },
      { id: "stop-4", name: "Dormitories", eta: 15, location: { lat: 40.718, lng: -73.996 } },
      { id: "stop-5", name: "Sports Complex", eta: 18, location: { lat: 40.717, lng: -73.998 } },
    ],
    buses: ["A1", "A2"],
    frequency: "Every 10 minutes",
  },
  {
    id: "route-2",
    name: "North Campus Express",
    color: "#10b981",
    stops: [
      { id: "stop-6", name: "Main Gate", eta: 2, location: { lat: 40.7128, lng: -74.006 } },
      { id: "stop-7", name: "Engineering Building", eta: 6, location: { lat: 40.714, lng: -74.007 } },
      { id: "stop-8", name: "Research Center", eta: 9, location: { lat: 40.716, lng: -74.011 } },
      { id: "stop-9", name: "North Dormitories", eta: 14, location: { lat: 40.717, lng: -74.013 } },
    ],
    buses: ["B1", "B2"],
    frequency: "Every 15 minutes",
  },
  {
    id: "route-3",
    name: "South Campus Shuttle",
    color: "#FFC107",
    stops: [
      { id: "stop-10", name: "South Gate", eta: 5, location: { lat: 40.7128, lng: -74.006 } },
      { id: "stop-11", name: "Business School", eta: 8, location: { lat: 40.711, lng: -74.004 } },
      { id: "stop-12", name: "Arts Center", eta: 11, location: { lat: 40.707, lng: -74.0 } },
      { id: "stop-13", name: "Student Housing", eta: 16, location: { lat: 40.705, lng: -73.998 } },
    ],
    buses: ["C1"],
    frequency: "Every 20 minutes",
  },
  {
    id: "route-4",
    name: "East-West Connector",
    color: "#ef4444",
    stops: [
      { id: "stop-14", name: "East Entrance", eta: 4, location: { lat: 40.7128, lng: -74.006 } },
      { id: "stop-15", name: "Cafeteria", eta: 7, location: { lat: 40.711, lng: -74.008 } },
      { id: "stop-16", name: "Gymnasium", eta: 10, location: { lat: 40.707, lng: -74.012 } },
      { id: "stop-17", name: "West Parking", eta: 13, location: { lat: 40.705, lng: -74.014 } },
    ],
    buses: ["D1", "D2", "D3"],
    frequency: "Every 12 minutes",
  },
]

// Mock data for buses on routes
const BUSES_ON_ROUTES = [
  {
    id: "bus-1",
    number: "A1",
    route: "Main Campus Loop",
    routeId: "route-1",
    eta: 3,
    status: "moving",
    capacity: "medium",
    location: { lat: 40.7128, lng: -74.006 },
    isFavorite: true,
  },
  {
    id: "bus-2",
    number: "B2",
    route: "North Campus Express",
    routeId: "route-2",
    eta: 7,
    status: "moving",
    capacity: "low",
    location: { lat: 40.7138, lng: -74.008 },
    isFavorite: false,
  },
  {
    id: "bus-3",
    number: "C1",
    route: "South Campus Shuttle",
    routeId: "route-3",
    eta: 12,
    status: "stopped",
    capacity: "high",
    location: { lat: 40.7118, lng: -74.003 },
    isFavorite: false,
  },
  {
    id: "bus-4",
    number: "D1",
    route: "East-West Connector",
    routeId: "route-4",
    eta: 15,
    status: "delayed",
    capacity: "medium",
    location: { lat: 40.7135, lng: -74.009 },
    isFavorite: true,
  },
]

export default function Routes() {
  const [mounted, setMounted] = useState(false)
  const [routes, setRoutes] = useState(ROUTES)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoute, setSelectedRoute] = useState<string | null>("route-1")
  const [showMap, setShowMap] = useState(true) // Default to showing map
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)

    // Simulate loading delay for optimization demo
    const timer = setTimeout(() => {
      setLoading(false)
    }, 600)

    return () => clearTimeout(timer)
  }, [])

  // Memoized filtered routes for better performance
  const filteredRoutes = useMemo(() => {
    return routes.filter(
      (route) =>
        route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.stops.some((stop) => stop.name.toLowerCase().includes(searchQuery.toLowerCase())),
    )
  }, [routes, searchQuery])

  const selectedRouteData = routes.find((route) => route.id === selectedRoute)

  // Get stops for the selected route
  const selectedRouteStops = useMemo(() => {
    if (!selectedRoute) return []
    const route = routes.find((r) => r.id === selectedRoute)
    return route ? route.stops : []
  }, [selectedRoute, routes])

  if (!mounted) return null

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Routes & Stops</h1>
            <p className="text-muted-foreground">View all bus routes and stops</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search routes or stops..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => setShowMap(!showMap)}>
              {showMap ? "Hide Map" : "Show Map"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0">
        <div className={cn("overflow-auto", showMap ? "lg:col-span-1 border-r" : "lg:col-span-1")}>
          <div className="p-4 space-y-4">
            <AnimatePresence>
              {filteredRoutes.map((route) => (
                <motion.div
                  key={route.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  layout
                >
                  <Card
                    className={cn(
                      "overflow-hidden transition-all duration-200 cursor-pointer hover:border-primary/50 card-premium",
                      selectedRoute === route.id && "border-primary shadow-lg shadow-primary/20",
                    )}
                    onClick={() => setSelectedRoute(route.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-12 rounded-full" style={{ backgroundColor: route.color }} />
                        <div className="flex-1">
                          <h3 className="font-bold">{route.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Bus className="h-3 w-3" />
                            <span>{route.buses.join(", ")}</span>
                            <span>•</span>
                            <span>{route.frequency}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredRoutes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-muted/50 p-4 rounded-full mb-4">
                  <Bus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No routes found</h3>
                <p className="text-muted-foreground">Try adjusting your search</p>
              </div>
            )}
          </div>
        </div>

        <div className={cn("overflow-auto", showMap ? "lg:col-span-2" : "lg:col-span-2")}>
          {showMap ? (
            <div className="h-[calc(100vh-150px)]">
              <Map
                buses={BUSES_ON_ROUTES}
                selectedBus={null}
                setSelectedBus={() => {}}
                selectedRoute={selectedRoute}
                stops={selectedRouteStops}
              />
            </div>
          ) : (
            selectedRouteData && (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">{selectedRouteData.name}</h2>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-sm">
                      {selectedRouteData.buses.length} Buses
                    </Badge>
                    <Badge variant="outline" className="text-sm">
                      {selectedRouteData.stops.length} Stops
                    </Badge>
                    <Badge variant="outline" className="text-sm">
                      {selectedRouteData.frequency}
                    </Badge>
                  </div>
                </div>

                <div className="relative pl-6 pb-6">
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
                    style={{ backgroundColor: selectedRouteData.color }}
                  />

                  <AnimatePresence>
                    {selectedRouteData.stops.map((stop, index) => (
                      <motion.div
                        key={stop.id}
                        className="mb-8 last:mb-0 relative"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div
                          className="absolute left-0 top-0 w-5 h-5 rounded-full border-4 transform -translate-x-[10px]"
                          style={{
                            backgroundColor: "var(--background)",
                            borderColor: selectedRouteData.color,
                          }}
                        />

                        <div className="glass rounded-lg p-4 ml-4 hover:border-primary/50 transition-all duration-200">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-lg">{stop.name}</h3>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className={cn("font-medium", stop.eta <= 5 ? "text-primary" : "")}>
                                {stop.eta} min
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>Stop #{index + 1}</span>

                            {index === 0 && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Starting Point
                              </Badge>
                            )}

                            {index === selectedRouteData.stops.length - 1 && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                End Point
                              </Badge>
                            )}
                          </div>

                          <div className="mt-3 flex gap-2">
                            <Button variant="outline" size="sm" className="btn-premium">
                              Set Reminder
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowMap(true)}
                              className="btn-premium"
                            >
                              View on Map
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
