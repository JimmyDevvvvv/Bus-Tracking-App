"use client"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Clock, MapPin, Bus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Map from "@/components/map"
import { BusCard } from "@/components/bus-card"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// Mock data for buses
const BUSES = [
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
    number: "A2",
    route: "Main Campus Loop",
    routeId: "route-1",
    eta: 8,
    status: "moving",
    capacity: "low",
    location: { lat: 40.713, lng: -74.003 },
    isFavorite: false,
  },
  {
    id: "bus-3",
    number: "B1",
    route: "North Campus Express",
    routeId: "route-2",
    eta: 5,
    status: "moving",
    capacity: "low",
    location: { lat: 40.7138, lng: -74.008 },
    isFavorite: false,
  },
  {
    id: "bus-4",
    number: "B2",
    route: "North Campus Express",
    routeId: "route-2",
    eta: 12,
    status: "stopped",
    capacity: "medium",
    location: { lat: 40.7142, lng: -74.01 },
    isFavorite: true,
  },
  {
    id: "bus-5",
    number: "C1",
    route: "South Campus Shuttle",
    routeId: "route-3",
    eta: 7,
    status: "stopped",
    capacity: "high",
    location: { lat: 40.7118, lng: -74.003 },
    isFavorite: false,
  },
  {
    id: "bus-6",
    number: "D1",
    route: "East-West Connector",
    routeId: "route-4",
    eta: 2,
    status: "moving",
    capacity: "medium",
    location: { lat: 40.7125, lng: -74.007 },
    isFavorite: true,
  },
  {
    id: "bus-7",
    number: "D2",
    route: "East-West Connector",
    routeId: "route-4",
    eta: 15,
    status: "delayed",
    capacity: "high",
    location: { lat: 40.7135, lng: -74.009 },
    isFavorite: false,
  },
  {
    id: "bus-8",
    number: "D3",
    route: "East-West Connector",
    routeId: "route-4",
    eta: 20,
    status: "moving",
    capacity: "low",
    location: { lat: 40.714, lng: -74.012 },
    isFavorite: false,
  },
]

// Mock data for stops
const STOPS = [
  { id: "stop-1", name: "Student Center", eta: 3, location: { lat: 40.7128, lng: -74.006 } },
  { id: "stop-2", name: "Library", eta: 7, location: { lat: 40.714, lng: -74.005 } },
  { id: "stop-3", name: "Science Building", eta: 12, location: { lat: 40.716, lng: -74.001 } },
  { id: "stop-4", name: "Dormitories", eta: 15, location: { lat: 40.718, lng: -73.996 } },
]

export default function Dashboard() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [buses, setBuses] = useState<typeof BUSES>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBus, setSelectedBus] = useState<string | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterRoute, setFilterRoute] = useState<string | null>(null)
  const { toast } = useToast()

  // Now let's update the Dashboard component to show all routes

  // First, add a new state variable for showing all routes
  // Add this with the other state variables (around line 120):
  const [showAllRoutes, setShowAllRoutes] = useState(true)
  const [showMap, setShowMap] = useState(true) // Default to showing map

  // Simulate data loading with delay for optimization demo
  useEffect(() => {
    setMounted(true)

    const timer = setTimeout(() => {
      setBuses(BUSES)
      setLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  // Simulate bus movement
  useEffect(() => {
    if (!buses.length) return

    // Simulate bus movement
    const interval = setInterval(() => {
      setBuses((prev) =>
        prev.map((bus) => ({
          ...bus,
          location: {
            lat: bus.location.lat + (Math.random() - 0.5) * 0.0005,
            lng: bus.location.lng + (Math.random() - 0.5) * 0.0005,
          },
          eta: Math.max(0, bus.status === "moving" ? bus.eta - 1 : bus.eta),
        })),
      )
    }, 10000) // Slower update interval for better performance

    return () => clearInterval(interval)
  }, [buses])

  // Show notification when bus arrives
  useEffect(() => {
    const arrivingBus = buses.find((bus) => bus.eta === 0 && bus.status !== "delayed")
    if (arrivingBus) {
      toast({
        title: `Bus ${arrivingBus.number} has arrived!`,
        description: `At ${arrivingBus.route} stop`,
        variant: "default",
      })
    }
  }, [buses, toast])

  // Update selected route when a bus is selected
  useEffect(() => {
    if (selectedBus) {
      const bus = buses.find((b) => b.id === selectedBus)
      if (bus) {
        setSelectedRoute(bus.routeId)
      }
    }
  }, [selectedBus, buses])

  const toggleFavorite = (id: string) => {
    setBuses((prev) => prev.map((bus) => (bus.id === id ? { ...bus, isFavorite: !bus.isFavorite } : bus)))
  }

  // Memoized filtered buses for better performance
  const filteredBuses = useMemo(() => {
    return buses.filter((bus) => {
      // Apply search filter
      const matchesSearch =
        bus.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bus.route.toLowerCase().includes(searchQuery.toLowerCase())

      // Apply status filter
      const matchesStatus = filterStatus ? bus.status === filterStatus : true

      // Apply route filter
      const matchesRoute = filterRoute ? bus.routeId === filterRoute : true

      return matchesSearch && matchesStatus && matchesRoute
    })
  }, [buses, searchQuery, filterStatus, filterRoute])

  // Get unique routes for filter dropdown
  const uniqueRoutes = useMemo(() => {
    const routeMap = {}
    buses.forEach((bus) => {
      if (!routeMap[bus.routeId]) {
        routeMap[bus.routeId] = { id: bus.routeId, name: bus.route }
      }
    })
    return Object.values(routeMap)
  }, [buses])

  if (!mounted) return null

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Live Bus Tracker</h1>
            <p className="text-muted-foreground">Track buses in real-time across campus</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by bus number or route..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2">
                  <h4 className="mb-2 text-sm font-medium">Filter by Status</h4>
                  <div className="space-y-1">
                    <DropdownMenuItem
                      className={cn(filterStatus === null && "bg-muted")}
                      onClick={() => setFilterStatus(null)}
                    >
                      All Statuses
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={cn(filterStatus === "moving" && "bg-muted")}
                      onClick={() => setFilterStatus("moving")}
                    >
                      Moving
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={cn(filterStatus === "stopped" && "bg-muted")}
                      onClick={() => setFilterStatus("stopped")}
                    >
                      Stopped
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={cn(filterStatus === "delayed" && "bg-muted")}
                      onClick={() => setFilterStatus("delayed")}
                    >
                      Delayed
                    </DropdownMenuItem>
                  </div>

                  <h4 className="mt-4 mb-2 text-sm font-medium">Filter by Route</h4>
                  <div className="space-y-1">
                    <DropdownMenuItem
                      className={cn(filterRoute === null && "bg-muted")}
                      onClick={() => setFilterRoute(null)}
                    >
                      All Routes
                    </DropdownMenuItem>
                    {uniqueRoutes.map((route) => (
                      <DropdownMenuItem
                        key={route.id}
                        className={cn(filterRoute === route.id && "bg-muted")}
                        onClick={() => setFilterRoute(route.id)}
                      >
                        {route.name}
                      </DropdownMenuItem>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" className="ml-2" onClick={() => setShowAllRoutes(!showAllRoutes)}>
              {showAllRoutes ? "Hide All Routes" : "Show All Routes"}
            </Button>
            <Button variant="outline" size="sm" className="ml-2" onClick={() => setShowMap(!showMap)}>
              {showMap ? "Hide Map" : "Show Map"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0">
        {showMap ? (
          <div className="lg:col-span-2 h-[calc(100vh-150px)]">
            {mounted && (
              <Map
                buses={buses}
                selectedBus={selectedBus}
                setSelectedBus={setSelectedBus}
                selectedRoute={selectedRoute}
                stops={STOPS}
                showAllRoutes={showAllRoutes}
              />
            )}
          </div>
        ) : null}

        <div className={cn("border-l overflow-auto", !showMap && "lg:col-span-3")}>
          <Tabs defaultValue="all">
            <div className="sticky top-0 bg-background/80 backdrop-blur-md z-10 p-4 border-b">
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">
                  All Buses
                </TabsTrigger>
                <TabsTrigger value="arriving" className="flex-1">
                  Arriving Soon
                </TabsTrigger>
                <TabsTrigger value="favorites" className="flex-1">
                  Favorites
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="p-4 space-y-4">
              {loading ? (
                // Skeleton loading state
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <Skeleton className="h-20 w-full" />
                  </div>
                ))
              ) : filteredBuses.length > 0 ? (
                <AnimatePresence>
                  {filteredBuses
                    .sort((a, b) => a.eta - b.eta)
                    .map((bus) => (
                      <motion.div
                        key={bus.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <BusCard
                          bus={bus}
                          isSelected={selectedBus === bus.id}
                          onSelect={() => setSelectedBus(bus.id)}
                          onToggleFavorite={() => toggleFavorite(bus.id)}
                        />
                      </motion.div>
                    ))}
                </AnimatePresence>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-muted/50 p-4 rounded-full mb-4">
                    <Bus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No buses found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filters</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="arriving" className="p-4 space-y-4">
              {loading ? (
                // Skeleton loading state
                Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <Skeleton className="h-20 w-full" />
                  </div>
                ))
              ) : filteredBuses.filter((bus) => bus.eta < 10).length > 0 ? (
                <AnimatePresence>
                  {filteredBuses
                    .filter((bus) => bus.eta < 10)
                    .sort((a, b) => a.eta - b.eta)
                    .map((bus) => (
                      <motion.div
                        key={bus.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <BusCard
                          bus={bus}
                          isSelected={selectedBus === bus.id}
                          onSelect={() => setSelectedBus(bus.id)}
                          onToggleFavorite={() => toggleFavorite(bus.id)}
                        />
                      </motion.div>
                    ))}
                </AnimatePresence>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-muted/50 p-4 rounded-full mb-4">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No buses arriving soon</h3>
                  <p className="text-muted-foreground">Check back in a few minutes</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="favorites" className="p-4 space-y-4">
              {loading ? (
                // Skeleton loading state
                Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <Skeleton className="h-20 w-full" />
                  </div>
                ))
              ) : filteredBuses.filter((bus) => bus.isFavorite).length > 0 ? (
                <AnimatePresence>
                  {filteredBuses
                    .filter((bus) => bus.isFavorite)
                    .sort((a, b) => a.eta - b.eta)
                    .map((bus) => (
                      <motion.div
                        key={bus.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <BusCard
                          bus={bus}
                          isSelected={selectedBus === bus.id}
                          onSelect={() => setSelectedBus(bus.id)}
                          onToggleFavorite={() => toggleFavorite(bus.id)}
                        />
                      </motion.div>
                    ))}
                </AnimatePresence>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-muted/50 p-4 rounded-full mb-4">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No favorite buses</h3>
                  <p className="text-muted-foreground">Star buses to add them to your favorites</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
