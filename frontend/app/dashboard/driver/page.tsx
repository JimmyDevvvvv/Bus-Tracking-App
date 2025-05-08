"use client";

import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Users, MapPin, Navigation, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function DriverDashboard() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated or not a driver
    if (!isLoading && (!user || user.role !== "driver")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <div className="p-8">Loading...</div>;
  }

  const handleToggleActive = () => {
    setIsActive(!isActive);
    // In a real app, this would update the driver's status in the backend
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Driver Dashboard</h1>
          <p className="text-muted-foreground">Manage your bus routes and track your progress</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">Welcome, {user.name}</span>
          <Button variant="outline" onClick={logout}>Logout</Button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8 p-4 border rounded-lg bg-card">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${isActive ? 'bg-green-500/20' : 'bg-muted'}`}>
            <div className={`h-4 w-4 rounded-full ${isActive ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
          </div>
          <div>
            <h3 className="font-medium">Your Status</h3>
            <p className="text-sm text-muted-foreground">
              {isActive ? 'You are currently on duty' : 'You are currently off duty'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="active-mode" checked={isActive} onCheckedChange={handleToggleActive} />
          <Label htmlFor="active-mode">
            {isActive ? 'Active' : 'Inactive'}
          </Label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Current Route</CardTitle>
            <CardDescription>
              {isActive 
                ? 'You are currently driving this route' 
                : 'Assigned route when you become active'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Campus Loop</h3>
                <Badge variant={isActive ? "default" : "outline"}>
                  {isActive ? "In Progress" : "Assigned"}
                </Badge>
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Start Time:</span>
                  </div>
                  <span className="font-medium">8:00 AM</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Passengers:</span>
                  </div>
                  <span className="font-medium">12 / 40</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Next Stop:</span>
                  </div>
                  <span className="font-medium">Student Center</span>
                </div>
              </div>
              <Button className="w-full" disabled={!isActive}>
                {isActive ? "Navigate to Next Stop" : "Start Route"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Route Stops</CardTitle>
            <CardDescription>Stops on your current route</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {["Main Gate", "Library", "Student Center", "Science Building", "Dormitories", "Sports Complex"].map((stop, index) => (
                <div key={index} className="flex items-center p-2 rounded-md border">
                  <div className="flex-shrink-0 mr-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${index === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium">{stop}</p>
                    <p className="text-xs text-muted-foreground">
                      {index < 2 ? 'Completed' : index === 2 ? 'Current' : 'Upcoming'}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" disabled={index < 2 || index > 2}>
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Messages & Alerts</CardTitle>
            <CardDescription>Important notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-500">Traffic Alert</h4>
                    <p className="text-sm">Heavy traffic on Main Street. Consider alternate route.</p>
                    <p className="text-xs text-muted-foreground mt-1">10 minutes ago</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card border rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="font-medium">Pickup Request</h4>
                    <p className="text-sm">Student requested pickup at Science Building.</p>
                    <p className="text-xs text-muted-foreground mt-1">25 minutes ago</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card border rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="font-medium">Schedule Update</h4>
                    <p className="text-sm">Tomorrow's route start time changed to 7:30 AM.</p>
                    <p className="text-xs text-muted-foreground mt-1">1 hour ago</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Tracking</CardTitle>
          <CardDescription>Your current location and route</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center bg-muted/30 border-2 border-dashed">
          <div className="text-center">
            <Navigation className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Map View</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Live map showing your current location and route will appear here when you are active.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 