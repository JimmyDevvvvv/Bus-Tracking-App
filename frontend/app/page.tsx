"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import Link from "next/link"
import { Search, ArrowRight, Map, Bell, Bus, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    // Check auth status and redirect
    if (isAuthenticated()) {
      router.push("/dashboard")
    } else {
      router.push("/home")
    }
  }, [router])

  // Display a loading state while redirecting
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-12 w-12 text-primary"
        >
          <path d="M19 17h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2" />
          <path d="M14 17v6" />
          <path d="M10 17v6" />
          <path d="M6 22h12" />
          <path d="M2 11V9a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v2" />
        </svg>
        <div className="mt-4 text-xl font-medium">Loading...</div>
      </div>
    </div>
  )
}

const features = [
  {
    title: "Real-Time Tracking",
    description: "See buses move on the map in real-time with accurate GPS positioning and ETA predictions.",
    icon: Map,
  },
  {
    title: "Smart Notifications",
    description: "Get personalized alerts when your bus is approaching your stop or if there are delays.",
    icon: Bell,
  },
  {
    title: "Route Planning",
    description: "Find the fastest routes with AI-powered suggestions based on your travel history and preferences.",
    icon: Bus,
  },
]

const stats = [
  { value: "50+", label: "Campus Routes" },
  { value: "200+", label: "Buses Tracked" },
  { value: "10K+", label: "Daily Users" },
  { value: "99.9%", label: "Uptime" },
]

function BusMapAnimation() {
  return (
    <div className="absolute inset-0 opacity-20">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
          </pattern>
          <linearGradient id="route" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(74,144,226,0.2)" />
            <stop offset="100%" stopColor="rgba(74,144,226,0.8)" />
          </linearGradient>
          <linearGradient id="route2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,193,7,0.2)" />
            <stop offset="100%" stopColor="rgba(255,193,7,0.8)" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Animated route lines */}
        <path
          d="M-100,200 C100,100 300,300 500,200 S700,100 900,200 S1100,300 1300,200"
          stroke="url(#route)"
          strokeWidth="3"
          fill="none"
          strokeDasharray="10,10"
          strokeLinecap="round"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="20" dur="1s" repeatCount="indefinite" />
        </path>

        <path
          d="M-100,400 C100,500 300,300 500,400 S700,500 900,400 S1100,300 1300,400"
          stroke="url(#route2)"
          strokeWidth="3"
          fill="none"
          strokeDasharray="10,10"
          strokeLinecap="round"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="20" dur="1.5s" repeatCount="indefinite" />
        </path>

        <path
          d="M200,-100 C100,100 300,300 200,500 S100,700 200,900"
          stroke="url(#route)"
          strokeWidth="3"
          fill="none"
          strokeDasharray="10,10"
          strokeLinecap="round"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="20" dur="2s" repeatCount="indefinite" />
        </path>

        {/* Bus dots */}
        <circle cx="300" cy="200" r="5" fill="#4A90E2">
          <animate attributeName="cx" from="0" to="1300" dur="10s" repeatCount="indefinite" />
        </circle>
        <circle cx="700" cy="400" r="5" fill="#FFC107">
          <animate attributeName="cx" from="1300" to="0" dur="15s" repeatCount="indefinite" />
        </circle>
        <circle cx="200" cy="300" r="5" fill="#4A90E2">
          <animate attributeName="cy" from="0" to="900" dur="12s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  )
}
