"use client"

import { useSidebar } from "@/components/sidebar-provider"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Bus, Home, Map, Bell, User, Settings, Menu, LogOut } from "lucide-react"
import { useState, useEffect } from "react"
import { authService } from "@/lib/services/authService"

export function AppSidebar() {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const role = authService.getUserRole()
    setUserRole(role)
  }, [])

  const { isOpen, toggleSidebar } = useSidebar()

  const getRoutesByRole = (role: string | null) => {
    const baseRoutes = [
      {
        name: "Home",
        path: "/",
        icon: Home,
      }
    ]

    const roleRoutes = {
      admin: [
        {
          name: "Dashboard",
          path: "/dashboard/admin",
          icon: Map,
        },
        {
          name: "Routes",
          path: "/routes",
          icon: Bus,
        },
        {
          name: "Settings",
          path: "/settings",
          icon: Settings,
        }
      ],
      driver: [
        {
          name: "Dashboard",
          path: "/dashboard/driver",
          icon: Map,
        },
        {
          name: "Routes",
          path: "/routes",
          icon: Bus,
        }
      ],
      student: [
        {
          name: "Dashboard",
          path: "/dashboard/student",
          icon: Map,
        },
        {
          name: "Track",
          path: "/track",
          icon: Bus,
        }
      ]
    }

    return [...baseRoutes, ...(role && roleRoutes[role] || []), {
      name: "Profile",
      path: "/profile",
      icon: User,
    }]
  }

  const handleLogout = () => {
    authService.logout()
    router.push('/login')
  }

  if (!mounted) return null

  const routes = getRoutesByRole(userRole)

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
          onClick={handleLogout}
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
