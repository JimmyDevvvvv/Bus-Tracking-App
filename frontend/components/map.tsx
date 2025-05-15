"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { useTheme } from "next-themes"

export default function Map() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapboxJsLoaded, setMapboxJsLoaded] = useState(false)
  const [mapboxCssLoaded, setMapboxCssLoaded] = useState(false)
  const { theme } = useTheme()

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
      window.mapboxgl.accessToken = "pk.eyJ1IjoiYWJkbzAiLCJhIjoiY2x5dDF4MjkwMGRtMTJqb3Q3MG81dGJpeCJ9.LRT9kWKN_D5kHOdH4o6qbA"

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
      })

      // Add navigation controls
      map.addControl(new window.mapboxgl.NavigationControl(), "top-right")
      map.addControl(new window.mapboxgl.AttributionControl(), "bottom-left")

      // Store map reference
      mapRef.current = map

      // Cleanup function
      return () => {
        if (mapRef.current) {
          mapRef.current.remove()
          mapRef.current = null
        }
      }
    } catch (error) {
      console.error("Error initializing map:", error)
    }
  }, [mapboxJsLoaded, mapboxCssLoaded, theme])

  return (
    <div className="relative h-full w-full">
      <div
        ref={mapContainerRef}
        className="absolute inset-0 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden"
        style={{ width: "100%", height: "100%" }}
      />

      {(!mapboxJsLoaded || !mapboxCssLoaded || !mapLoaded) && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-lg">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}

declare global {
  interface Window {
    mapboxgl: any
  }
}