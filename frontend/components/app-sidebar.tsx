"use client"

import { useSidebar } from "@/components/sidebar-provider"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Bus, Home, Map, Bell, User, Settings, Menu, LogOut } from "lucide-react"
import { useState, useEffect } from "react"

export function AppSidebar() {
  // Add client-side only rendering
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  // Only access the context after component is mounted on the client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Now we can safely use the context
  const { isOpen, toggleSidebar } = useSidebar()

  const routes = [
    {
      name: "Home",
      path: "/",
      icon: Home,
    },
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: Map,
    },
    {
      name: "Routes",
      path: "/routes",
      icon: Bus,
    },
    {
      name: "Notifications",
      path: "/notifications",
      icon: Bell,
    },
    {
      name: "Profile",
      path: "/profile",
      icon: User,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ]

  return (
    <div
      className={cn(
        "h-screen bg-background/80 backdrop-blur-md border-r border-border transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-20",
      )}
    >
      <div className="flex items-center justify-between p-4">
        <div className={cn("flex items-center", !isOpen && "justify-center w-full")}>
          <Bus className="h-8 w-8 text-primary" />
          {isOpen && <span className="ml-2 text-xl font-bold">BusTracker</span>}
        </div>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className={cn(!isOpen && "hidden")}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-3 py-2">
        <nav className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.path}
              href={route.path}
              className={cn(
                "flex items-center px-3 py-3 text-sm rounded-md transition-colors",
                pathname === route.path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                !isOpen && "justify-center",
              )}
            >
              <route.icon className={cn("h-5 w-5", pathname === route.path && "text-primary")} />
              {isOpen && <span className="ml-3">{route.name}</span>}
            </Link>
          ))}
        </nav>
      </div>

      <div className="absolute bottom-4 w-full px-3">
        <Button
          variant="ghost"
          className={cn(
            "flex items-center w-full px-3 py-3 text-sm rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            !isOpen && "justify-center",
          )}
        >
          <LogOut className="h-5 w-5" />
          {isOpen && <span className="ml-3">Logout</span>}
        </Button>
      </div>
    </div>
  )
}
