"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Navigation, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type Bus = {
  id: string
  number: string
  route: string
  routeId: string
  eta: number
  status: string
  capacity: string
  location: { lat: number; lng: number }
  isFavorite: boolean
}

type Stop = {
  id: string
  name: string
  eta: number
  location: { lat: number; lng: number }
}

type MapProps = {
  buses: Bus[]
  selectedBus: string | null
  setSelectedBus: (id: string | null) => void
  selectedRoute?: string | null
  stops?: Stop[]
  showAllRoutes?: boolean // Add this new prop
}

// Mock route data for visualization
const ROUTE_DATA = {
  "route-1": {
    coordinates: [
      [-74.006, 40.7128], // Start point
      [-74.005, 40.714],
      [-74.003, 40.715],
      [-74.001, 40.716],
      [-73.998, 40.717],
      [-73.996, 40.718], // End point
    ],
    color: "#4A90E2",
    stops: [
      { id: "stop-1", name: "Student Center", location: { lat: 40.7128, lng: -74.006 } },
      { id: "stop-2", name: "Library", location: { lat: 40.714, lng: -74.005 } },
      { id: "stop-3", name: "Science Building", location: { lat: 40.716, lng: -74.001 } },
      { id: "stop-4", name: "Dormitories", location: { lat: 40.718, lng: -73.996 } },
    ],
  },
  "route-2": {
    coordinates: [
      [-74.006, 40.7128], // Start point
      [-74.007, 40.714],
      [-74.009, 40.715],
      [-74.011, 40.716],
      [-74.013, 40.717], // End point
    ],
    color: "#10b981",
    stops: [
      { id: "stop-5", name: "Main Gate", location: { lat: 40.7128, lng: -74.006 } },
      { id: "stop-6", name: "Engineering Building", location: { lat: 40.714, lng: -74.007 } },
      { id: "stop-7", name: "Research Center", location: { lat: 40.716, lng: -74.011 } },
      { id: "stop-8", name: "North Dormitories", location: { lat: 40.717, lng: -74.013 } },
    ],
  },
  "route-3": {
    coordinates: [
      [-74.006, 40.7128], // Start point
      [-74.004, 40.711],
      [-74.002, 40.709],
      [-74.0, 40.707],
      [-73.998, 40.705], // End point
    ],
    color: "#FFC107",
    stops: [
      { id: "stop-9", name: "South Gate", location: { lat: 40.7128, lng: -74.006 } },
      { id: "stop-10", name: "Business School", location: { lat: 40.711, lng: -74.004 } },
      { id: "stop-11", name: "Arts Center", location: { lat: 40.707, lng: -74.0 } },
      { id: "stop-12", name: "Student Housing", location: { lat: 40.705, lng: -73.998 } },
    ],
  },
  "route-4": {
    coordinates: [
      [-74.006, 40.7128], // Start point
      [-74.008, 40.711],
      [-74.01, 40.709],
      [-74.012, 40.707],
      [-74.014, 40.705], // End point
    ],
    color: "#ef4444",
    stops: [
      { id: "stop-13", name: "East Entrance", location: { lat: 40.7128, lng: -74.006 } },
      { id: "stop-14", name: "Cafeteria", location: { lat: 40.711, lng: -74.008 } },
      { id: "stop-15", name: "Gymnasium", location: { lat: 40.707, lng: -74.012 } },
      { id: "stop-16", name: "West Parking", location: { lat: 40.705, lng: -74.014 } },
    ],
  },
}

// Function to calculate position along a route
const calculatePositionAlongRoute = (coordinates: [number, number][], progress: number): [number, number] => {
  if (coordinates.length < 2) return coordinates[0]

  // Ensure progress is between 0 and 1
  const normalizedProgress = Math.max(0, Math.min(1, progress))

  // Calculate total route length
  let totalDistance = 0
  const segmentDistances: number[] = []

  for (let i = 0; i < coordinates.length - 1; i++) {
    const dist = calculateDistance(coordinates[i], coordinates[i + 1])
    segmentDistances.push(dist)
    totalDistance += dist
  }

  // Find position based on progress
  const targetDistance = totalDistance * normalizedProgress
  let coveredDistance = 0

  for (let i = 0; i < segmentDistances.length; i++) {
    if (coveredDistance + segmentDistances[i] >= targetDistance) {
      // This is the segment where our point lies
      const segmentProgress = (targetDistance - coveredDistance) / segmentDistances[i]
      return interpolatePoints(coordinates[i], coordinates[i + 1], segmentProgress)
    }
    coveredDistance += segmentDistances[i]
  }

  // Fallback to last point
  return coordinates[coordinates.length - 1]
}

// Calculate distance between two points
const calculateDistance = (point1: [number, number], point2: [number, number]): number => {
  const [lng1, lat1] = point1
  const [lng2, lat2] = point2

  // Simple Euclidean distance - for more accuracy, you could use the Haversine formula
  return Math.sqrt(Math.pow(lng2 - lng1, 2) + Math.pow(lat2 - lat1, 2))
}

// Interpolate between two points
const interpolatePoints = (point1: [number, number], point2: [number, number], progress: number): [number, number] => {
  const [lng1, lat1] = point1
  const [lng2, lat2] = point2

  const lng = lng1 + (lng2 - lng1) * progress
  const lat = lat1 + (lat2 - lat1) * progress

  return [lng, lat]
}

// Let's fix the function signature to include the new showAllRoutes prop
export default function Map({
  buses,
  selectedBus,
  setSelectedBus,
  selectedRoute,
  stops,
  showAllRoutes = false,
}: MapProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<{ [key: string]: any }>({})
  const popupsRef = useRef<{ [key: string]: any }>({})
  const stopMarkersRef = useRef<any[]>([])
  const userMarkerRef = useRef<any>(null)
  const routeRef = useRef<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapboxJsLoaded, setMapboxJsLoaded] = useState(false)
  const [mapboxCssLoaded, setMapboxCssLoaded] = useState(false)
  const { theme } = useTheme()
  const animationFrameRef = useRef<number | null>(null)
  const busAnimationProgressRef = useRef<{ [key: string]: number }>({})

  // Load Mapbox scripts
  useEffect(() => {
    if (typeof window === "undefined") return

    let scriptElement: HTMLScriptElement | null = null
    let styleElement: HTMLLinkElement | null = null

    // Function to load Mapbox
    const loadMapbox = () => {
      // Check if already loaded
      if (window.mapboxgl) {
        setMapboxJsLoaded(true)
        setMapboxCssLoaded(true)
        return
      }

      // Load CSS
      styleElement = document.createElement("link")
      styleElement.href = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
      styleElement.rel = "stylesheet"
      styleElement.onload = () => setMapboxCssLoaded(true)
      document.head.appendChild(styleElement)

      // Load JS
      scriptElement = document.createElement("script")
      scriptElement.src = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"
      scriptElement.async = true
      scriptElement.onload = () => setMapboxJsLoaded(true)
      document.head.appendChild(scriptElement)
    }

    loadMapbox()

    // Cleanup function
    return () => {
      if (scriptElement && document.head.contains(scriptElement)) {
        document.head.removeChild(scriptElement)
      }
      if (styleElement && document.head.contains(styleElement)) {
        document.head.removeChild(styleElement)
      }
    }
  }, [])

  // Initialize map when scripts are loaded
  useEffect(() => {
    // Only proceed if all conditions are met
    if (!mapboxJsLoaded || !mapboxCssLoaded || !mapContainerRef.current) return

    // Safety check for window and mapboxgl
    if (typeof window === "undefined" || !window.mapboxgl) {
      console.error("Mapbox GL JS is not available")
      return
    }

    try {
      // Set access token
      window.mapboxgl.accessToken =
        "pk.eyJ1IjoiYWJkbzAiLCJhIjoiY2x5dDF4MjkwMGRtMTJqb3Q3MG81dGJpeCJ9.LRT9kWKN_D5kHOdH4o6qbA"

      // Create map
      const map = new window.mapboxgl.Map({
        container: mapContainerRef.current,
        style: theme === "dark" ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11",
        center: [-74.006, 40.7128], // NYC coordinates
        zoom: 14,
        attributionControl: false,
      })

      // Handle map load event
      map.on("load", () => {
        console.log("Map loaded successfully")
        setMapLoaded(true)

        // Add source and layer for route
        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [],
            },
          },
        })

        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#4A90E2",
            "line-width": 5,
            "line-opacity": 0.8,
            "line-blur": 1,
          },
        })

        // If we have a selected route, show it
        if (selectedRoute && ROUTE_DATA[selectedRoute]) {
          updateRoute(selectedRoute)
        }
      })

      // Add controls
      map.addControl(new window.mapboxgl.AttributionControl(), "bottom-left")
      map.addControl(new window.mapboxgl.NavigationControl(), "top-right")

      // Store map reference
      mapRef.current = map

      // Error handling
      map.on("error", (e) => {
        console.error("Mapbox error:", e.error)
      })

      // Cleanup function
      return () => {
        if (mapRef.current) {
          mapRef.current.remove()
          mapRef.current = null
        }

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    } catch (error) {
      console.error("Error initializing map:", error)
    }
  }, [mapboxJsLoaded, mapboxCssLoaded, theme, selectedRoute])

  // Animate buses along routes
  const animateBuses = useCallback(() => {
    if (!mapRef.current || !window.mapboxgl) return

    buses.forEach((bus) => {
      if (!bus.routeId || !ROUTE_DATA[bus.routeId]) return

      // Initialize progress if not already set
      if (busAnimationProgressRef.current[bus.id] === undefined) {
        busAnimationProgressRef.current[bus.id] = Math.random() // Start at random position
      }

      // Update progress based on status
      if (bus.status === "moving") {
        busAnimationProgressRef.current[bus.id] += 0.001 // Speed factor
        if (busAnimationProgressRef.current[bus.id] > 1) {
          busAnimationProgressRef.current[bus.id] = 0
        }
      }

      // Calculate new position
      const routeCoordinates = ROUTE_DATA[bus.routeId].coordinates
      const [lng, lat] = calculatePositionAlongRoute(routeCoordinates, busAnimationProgressRef.current[bus.id])

      // Update marker position
      if (markersRef.current[bus.id]) {
        markersRef.current[bus.id].setLngLat([lng, lat])
      }
    })

    animationFrameRef.current = requestAnimationFrame(animateBuses)
  }, [buses])

  // Start animation when map and buses are loaded
  useEffect(() => {
    if (mapLoaded && buses.length > 0) {
      animateBuses()
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [mapLoaded, buses, animateBuses])

  // Update bus markers
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.mapboxgl) return

    const map = mapRef.current
    const existingMarkerIds = Object.keys(markersRef.current)

    // Add or update markers
    buses.forEach((bus) => {
      const markerElement = document.createElement("div")
      markerElement.className = "bus-marker"
      markerElement.style.width = "36px"
      markerElement.style.height = "36px"
      markerElement.style.borderRadius = "50%"
      markerElement.style.display = "flex"
      markerElement.style.alignItems = "center"
      markerElement.style.justifyContent = "center"
      markerElement.style.cursor = "pointer"
      markerElement.style.transition = "all 0.3s ease"
      markerElement.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)"

      // Set color based on status
      const bgColor =
        bus.status === "moving"
          ? "rgba(34, 197, 94, 0.2)"
          : bus.status === "stopped"
            ? "rgba(234, 179, 8, 0.2)"
            : "rgba(239, 68, 68, 0.2)"

      const borderColor = bus.status === "moving" ? "#22c55e" : bus.status === "stopped" ? "#eab308" : "#ef4444"

      markerElement.style.backgroundColor = bgColor
      markerElement.style.border = `2px solid ${borderColor}`

      // Inner content
      const innerElement = document.createElement("div")
      innerElement.style.backgroundColor = theme === "dark" ? "#1e293b" : "#ffffff"
      innerElement.style.borderRadius = "50%"
      innerElement.style.padding = "6px"
      innerElement.style.display = "flex"
      innerElement.style.alignItems = "center"
      innerElement.style.justifyContent = "center"
      innerElement.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.1)"
      innerElement.innerHTML = `<span style="color: ${borderColor}; font-weight: bold; font-size: 11px;">${bus.number}</span>`
      markerElement.appendChild(innerElement)

      // Create popup with enhanced styling
      const popup = new window.mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false,
        className: "custom-popup",
      }).setHTML(`
        <div style="padding: 12px; font-family: system-ui, sans-serif; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${bus.number}: ${bus.route}</div>
          <div style="font-size: 12px; color: #64748b; display: flex; align-items: center; gap: 4px;">
            <span style="color: ${borderColor}; font-weight: bold;">●</span>
            <span>Status: ${bus.status.charAt(0).toUpperCase() + bus.status.slice(1)}</span>
          </div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
            ETA: ${bus.eta === 0 ? "<span style='color: #22c55e; font-weight: bold;'>Arriving now</span>" : `<span style='font-weight: bold;'>${bus.eta} min</span>`}
          </div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
            Capacity: ${bus.capacity.charAt(0).toUpperCase() + bus.capacity.slice(1)}
          </div>
        </div>
      `)

      // Get initial position from route or current location
      let initialPosition: [number, number]
      if (bus.routeId && ROUTE_DATA[bus.routeId]) {
        // Initialize animation progress if not set
        if (busAnimationProgressRef.current[bus.id] === undefined) {
          busAnimationProgressRef.current[bus.id] = Math.random()
        }

        initialPosition = calculatePositionAlongRoute(
          ROUTE_DATA[bus.routeId].coordinates,
          busAnimationProgressRef.current[bus.id],
        )
      } else {
        initialPosition = [bus.location.lng, bus.location.lat]
      }

      if (markersRef.current[bus.id]) {
        // Update existing marker
        markersRef.current[bus.id].setLngLat(initialPosition)
        popupsRef.current[bus.id] = popup
      } else {
        // Create new marker
        const marker = new window.mapboxgl.Marker(markerElement).setLngLat(initialPosition).setPopup(popup).addTo(map)

        marker.getElement().addEventListener("click", () => {
          setSelectedBus(bus.id)
        })

        // Add pulse animation for selected bus
        if (selectedBus === bus.id && markerElement) {
          // Safely add the pulse class
          try {
            markerElement.classList.add("pulse")
            markerElement.style.transform = "scale(1.1)"
            markerElement.style.boxShadow = `0 0 0 8px ${borderColor}33, 0 0 0 16px ${borderColor}11`
          } catch (error) {
            console.error("Error applying pulse animation:", error)
          }
        }

        markersRef.current[bus.id] = marker
        popupsRef.current[bus.id] = popup
      }

      // Show popup for selected bus
      if (selectedBus === bus.id && markersRef.current[bus.id]) {
        try {
          markersRef.current[bus.id].togglePopup()
        } catch (error) {
          console.error("Error toggling popup:", error)
        }
      }
    })

    // Remove markers that no longer exist
    existingMarkerIds.forEach((id) => {
      if (!buses.find((bus) => bus.id === id)) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
        delete popupsRef.current[id]
      }
    })
  }, [buses, selectedBus, setSelectedBus, mapLoaded, theme])

  // Update stop markers
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.mapboxgl) return

    const map = mapRef.current

    // Remove existing stop markers
    stopMarkersRef.current.forEach((marker) => marker.remove())
    stopMarkersRef.current = []

    // Get stops from selected route or from props
    let stopsToShow: any[] = []

    if (selectedRoute && ROUTE_DATA[selectedRoute]) {
      stopsToShow = ROUTE_DATA[selectedRoute].stops
    } else if (stops) {
      stopsToShow = stops
    } else if (selectedBus) {
      const bus = buses.find((b) => b.id === selectedBus)
      if (bus && bus.routeId && ROUTE_DATA[bus.routeId]) {
        stopsToShow = ROUTE_DATA[bus.routeId].stops
      }
    }

    // Add stop markers
    stopsToShow.forEach((stop) => {
      const el = document.createElement("div")
      el.className = "stop-marker"
      el.style.width = "16px"
      el.style.height = "16px"
      el.style.borderRadius = "50%"
      el.style.backgroundColor = "#ef4444"
      el.style.border = "2px solid white"
      el.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.3)"

      const marker = new window.mapboxgl.Marker(el)
        .setLngLat([stop.location.lng, stop.location.lat])
        .setPopup(
          new window.mapboxgl.Popup({
            offset: 25,
            closeButton: false,
            closeOnClick: false,
          }).setHTML(`
            <div style="padding: 8px; font-family: system-ui, sans-serif;">
              <div style="font-weight: bold;">${stop.name}</div>
              ${stop.eta ? `<div style="font-size: 12px; color: #64748b;">ETA: ${stop.eta} min</div>` : ""}
            </div>
          `),
        )
        .addTo(map)

      stopMarkersRef.current.push(marker)
    })
  }, [mapLoaded, selectedRoute, selectedBus, buses, stops])

  // Update user location marker
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !userLocation || !window.mapboxgl) return

    const map = mapRef.current

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat])
    } else {
      const el = document.createElement("div")
      el.className = "user-marker"
      el.style.width = "24px"
      el.style.height = "24px"
      el.style.borderRadius = "50%"
      el.style.backgroundColor = "#4A90E2"
      el.style.border = "4px solid white"
      el.style.boxShadow = "0 0 0 2px rgba(74, 144, 226, 0.5), 0 4px 8px rgba(0, 0, 0, 0.2)"

      // Add pulse animation
      const pulse = document.createElement("div")
      pulse.style.position = "absolute"
      pulse.style.top = "-8px"
      pulse.style.left = "-8px"
      pulse.style.right = "-8px"
      pulse.style.bottom = "-8px"
      pulse.style.borderRadius = "50%"
      pulse.style.border = "2px solid #4A90E2"
      pulse.style.animation = "pulse 2s infinite"
      el.appendChild(pulse)

      // Add keyframes for pulse animation
      const style = document.createElement("style")
      style.textContent = `
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
      `
      document.head.appendChild(style)

      userMarkerRef.current = new window.mapboxgl.Marker(el).setLngLat([userLocation.lng, userLocation.lat]).addTo(map)

      // Center map on user location with smooth animation
      map.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 15,
        speed: 1.5,
        curve: 1.5,
      })
    }
  }, [userLocation, mapLoaded])

  // Update route display
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !selectedRoute || !ROUTE_DATA[selectedRoute]) return

    updateRoute(selectedRoute)

    routeRef.current = selectedRoute
  }, [selectedRoute, mapLoaded])

  // Update route when a bus is selected
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !selectedBus) return

    const selectedBusData = buses.find((bus) => bus.id === selectedBus)
    if (selectedBusData && selectedBusData.routeId && ROUTE_DATA[selectedBusData.routeId]) {
      updateRoute(selectedBusData.routeId)
    }
  }, [selectedBus, buses, mapLoaded])

  // Add a new effect to display all routes when showAllRoutes is true
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return

    if (showAllRoutes) {
      try {
        // Display all routes
        Object.keys(ROUTE_DATA).forEach((routeId) => {
          updateRoute(routeId)
        })

        // Fit map to show all routes
        if (window.mapboxgl) {
          const bounds = new window.mapboxgl.LngLatBounds()

          // Extend bounds to include all route coordinates
          Object.values(ROUTE_DATA).forEach((route) => {
            route.coordinates.forEach((coord: [number, number]) => {
              bounds.extend(coord)
            })
          })

          // Fit map to bounds with padding
          mapRef.current.fitBounds(bounds, {
            padding: 50,
            maxZoom: 14,
            duration: 1000,
          })
        }
      } catch (error) {
        console.error("Error displaying all routes:", error)
      }
    }
  }, [mapLoaded, showAllRoutes])

  // Function to update route
  const updateRoute = (routeId: string) => {
    if (!mapRef.current || !ROUTE_DATA[routeId]) return

    const map = mapRef.current
    const routeData = ROUTE_DATA[routeId]

    // Wait for map to be loaded
    if (!map.isStyleLoaded()) {
      map.once("load", () => updateRouteSource(routeData, routeId))
    } else {
      updateRouteSource(routeData, routeId)
    }
  }

  // Helper function to update route source
  const updateRouteSource = (routeData: any, routeId: string) => {
    if (!mapRef.current) return

    const map = mapRef.current

    try {
      // Create a unique source and layer ID for each route
      const sourceId = `route-source-${routeId}`
      const layerId = `route-layer-${routeId}`

      // Check if the source already exists
      if (!map.getSource(sourceId)) {
        // Add a new source for this route
        map.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: routeData.coordinates,
            },
          },
        })

        // Add a new layer for this route
        map.addLayer({
          id: layerId,
          type: "line",
          source: sourceId,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": routeData.color,
            "line-width": 5,
            "line-opacity": 0.8,
            "line-blur": 1,
          },
        })
      } else {
        // Update existing source
        const source = map.getSource(sourceId)
        if (source) {
          source.setData({
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: routeData.coordinates,
            },
          })

          // Update the line color
          map.setPaintProperty(layerId, "line-color", routeData.color)
        }
      }

      // If this is the selected route, fit the map to show it
      if (routeId === selectedRoute && window.mapboxgl) {
        const bounds = new window.mapboxgl.LngLatBounds()
        routeData.coordinates.forEach((coord: [number, number]) => bounds.extend(coord))

        map.fitBounds(bounds, {
          padding: 80,
          maxZoom: 15,
          duration: 1000,
        })
      }
    } catch (error) {
      console.error(`Error updating route ${routeId}:`, error)
    }
  }

  // Get user location
  const getUserLocation = () => {
    setIsLocating(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setIsLocating(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          setIsLocating(false)
        },
      )
    } else {
      console.error("Geolocation is not supported by this browser.")
      setIsLocating(false)
    }
  }

  return (
    <div className="relative h-full w-full">
      <div
        ref={mapContainerRef}
        className="absolute inset-0 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden"
      />

      {(!mapboxJsLoaded || !mapboxCssLoaded || !mapLoaded) && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-lg">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="secondary"
            size="icon"
            className="bg-background/80 backdrop-blur-sm shadow-lg h-12 w-12 rounded-full"
            onClick={getUserLocation}
            disabled={isLocating}
          >
            <Navigation className={cn("h-5 w-5", isLocating && "animate-spin")} />
          </Button>
        </motion.div>
      </div>

      {/* Map legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-background/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-border">
        <div className="text-xs font-medium mb-2">Bus Status</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs">Moving</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-xs">Stopped</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs">Delayed</span>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div>
            <span className="text-xs">Bus Stop</span>
          </div>
        </div>
      </div>
    </div>
  )
}
