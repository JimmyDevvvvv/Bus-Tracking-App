"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import Link from "next/link"
import { Search, ArrowRight, Map, Bell, Bus, ChevronDown } from "lucide-react"

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="relative min-h-screen overflow-hidden animated-bg">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/80" />
        <BusMapAnimation />
      </div>

      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl"
        >
          <motion.div
            className="relative inline-block mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            {/* Gradient glow behind logo */}
            <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-primary/20 to-highlight/20 blur-xl" />
            <Bus className="h-16 w-16 text-primary mx-auto" />
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-highlight mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Track Your Bus in Real-Time
          </motion.h1>

          <motion.p
            className="mt-6 text-xl text-muted-foreground max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Never miss your campus bus again. Get real-time updates, routes, and notifications.
          </motion.p>

          <motion.div
            className="mt-12 flex flex-col md:flex-row gap-4 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Button asChild size="lg" className="text-lg px-8 h-14 btn-premium">
              <Link href="/dashboard">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 h-14 btn-premium">
              Learn More
              <ChevronDown className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>

          <motion.div
            className="mt-16 max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <div className="relative">
              <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-primary/10 to-highlight/10 blur-md" />
              <div className="relative glass rounded-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Search for a stop or route..."
                  className="pl-12 h-14 bg-transparent border-none focus-visible:ring-primary"
                />
                <Button
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-12 px-6 rounded-full"
                >
                  Search
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl depth-scroll"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
              className="glass p-8 rounded-2xl card-premium border-primary/10 hover:border-primary/30"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="bg-primary/10 p-3 rounded-xl w-fit mb-6">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats section */}
        <motion.div
          className="mt-24 w-full max-w-5xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.8 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.3 + index * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <h3 className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</h3>
                <p className="text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
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
