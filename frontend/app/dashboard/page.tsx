"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";

export default function DashboardPage() {
  const [userData, setUserData] = useState({
    name: "User",
    role: "student"
  });

  useEffect(() => {
    // Get user data from token
    const token = getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.name) {
          setUserData({
            name: payload.name,
            role: payload.role || "student"
          });
        }
      } catch (error) {
        console.error("Error parsing token:", error);
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Welcome back, {userData.name}!
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>My Bus</CardTitle>
            <CardDescription>Your assigned bus information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Not Assigned</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No bus is currently assigned to you
            </p>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <div className="font-medium">Status</div>
                <div className="text-gray-500 dark:text-gray-400">N/A</div>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <div className="font-medium">Route</div>
                <div className="text-gray-500 dark:text-gray-400">N/A</div>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <div className="font-medium">Driver</div>
                <div className="text-gray-500 dark:text-gray-400">N/A</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Next Arrival</CardTitle>
            <CardDescription>Estimated arrival time at your stop</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--:--</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No upcoming arrivals
            </p>
            <div className="mt-4 space-y-2">
              <div className="h-[4px] w-full rounded-full bg-gray-100 dark:bg-gray-800">
                <div className="h-full w-0 rounded-full bg-primary"></div>
              </div>
              <div className="flex text-xs justify-between">
                <div>Current Location</div>
                <div>Your Stop</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Recent alerts and messages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-primary"
                  >
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Welcome to BusTracker!</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Set up your profile to get started
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 