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
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

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
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [buses, setBuses] = useState<typeof BUSES>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBus, setSelectedBus] = useState<string | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterRoute, setFilterRoute] = useState<string | null>(null)
  const { toast } = useToast()
  const [showAllRoutes, setShowAllRoutes] = useState(true)
  const [showMap, setShowMap] = useState(true)

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect based on user role
      if (user.role === "admin") {
        router.push("/dashboard/admin")
      } else if (user.role === "driver") {
        router.push("/dashboard/driver")
      } else if (user.role === "student") {
        router.push("/dashboard/student")
      }
    } else if (!isLoading && !user) {
      // Redirect to login if not authenticated
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    setMounted(true)

    const timer = setTimeout(() => {
      setBuses(BUSES)
      setLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!buses.length) return

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
    }, 10000)

    return () => clearInterval(interval)
  }, [buses])

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

  const filteredBuses = useMemo(() => {
    return buses.filter((bus) => {
      const matchesSearch =
        bus.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bus.route.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = filterStatus ? bus.status === filterStatus : true

      const matchesRoute = filterRoute ? bus.routeId === filterRoute : true

      return matchesSearch && matchesStatus && matchesRoute
    })
  }, [buses, searchQuery, filterStatus, filterRoute])

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
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p>Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}
