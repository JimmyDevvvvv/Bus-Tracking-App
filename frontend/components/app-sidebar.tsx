"use client";

import { useSidebar } from "@/components/sidebar-provider";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Map,
  Bus,
  Bell,
  User,
  Settings,
  Menu,
  History,
  LayoutDashboard,
  Shield,
  Users,
  LocateFixed,
} from "lucide-react";
import { useState, useEffect } from "react";
import { fetchWithAuth, isAuthenticated } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { usePathname } from "next/navigation";

export function AppSidebar() {
  const [mounted, setMounted] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const { isOpen, toggleSidebar } = useSidebar();
  const pathname = usePathname() || "/";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isAuthenticated()) return;

    fetchWithAuth("/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.user?.profilePicture) setProfilePic(data.user.profilePicture);
          if (data.user?.role) setRole(data.user.role);
        }
      })
      .catch(console.error);
  }, [mounted]);

  if (!mounted || !isAuthenticated()) return null;

  const routes =
    role === "admin"
      ? [
          { name: "Dashboard", path: "/admin", icon: Shield },
          { name: "Reports", path: "/admin/reports", icon: Bell },
          { name: "Users", path: "/admin/users", icon: User },
          { name: "Buses", path: "/admin/buses", icon: Bus },
          { name: "Profile", path: "/profile", icon: User },
          { name: "Settings", path: "/admin/settings", icon: Settings },
        ]
      : role === "driver"
      ? [
          { name: "Dashboard", path: "/driver", icon: LayoutDashboard },
          { name: "Students", path: "/driver/students", icon: Users },
          { name: "Live Tracking", path: "/driver/location", icon: LocateFixed },
          { name: "Profile", path: "/profile", icon: User },
          { name: "Settings", path: "/settings", icon: Settings },
        ]
      : [
          { name: "Trips", path: "/trips", icon: History },
          { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
          { name: "Routes", path: "/routes", icon: Map },
          { name: "Notifications", path: "/notifications", icon: Bell },
          { name: "Profile", path: "/profile", icon: User },
          { name: "Settings", path: "/settings", icon: Settings },
        ];

  return (
    <div
      className={cn(
        "h-screen sticky top-0 bg-background/80 backdrop-blur-md border-r border-border transition-width duration-300 flex flex-col",
        isOpen ? "w-64" : "w-20"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className={cn("flex items-center", !isOpen && "justify-center w-full")}>
          <Bus className="h-8 w-8 text-primary" />
          {isOpen && <span className="ml-2 text-xl font-bold">BusTracker</span>}
        </div>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded hover:bg-accent/50 transition-colors"
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-1">
        {routes.map((r) => {
          const active = pathname.startsWith(r.path);
          return (
            <Link
              key={r.path}
              href={r.path}
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                !isOpen && "justify-center"
              )}
            >
              <r.icon className="h-5 w-5" />
              {isOpen && <span className="ml-3">{r.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4">
        {isOpen ? (
          <div className="flex items-center space-x-3">
            {profilePic ? (
              <img
                src={profilePic}
                alt="Profile"
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center" />
            )}
            <SignOutButton className="flex-1 justify-start" />
          </div>
        ) : (
          <SignOutButton
            variant="ghost"
            showIcon
            size="icon"
            className="flex items-center justify-center w-full rounded-md hover:bg-accent hover:text-accent-foreground"
          />
        )}
      </div>
    </div>
  );
}
