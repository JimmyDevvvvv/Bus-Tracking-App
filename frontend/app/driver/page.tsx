"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Bus,
  Users,
  MapPin,
  AlertTriangle,
  Clock,
  Calendar as CalendarIcon,
  BarChart2,
  Bell,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import clsx from "clsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const LiveMap = dynamic(() => import("@/components/ui/DriverMap"), { ssr: false });

interface Driver {
  name: string;
  email: string;
  role: string;
}

interface Student {
  id: string;
  name: string;
}

interface BusInfo {
  bus_id: string;
  driver: {
    name: string;
    email: string;
    role: string;
  };
  students: Student[];
  areaServed: string[];
}

export default function DriverDashboard() {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [busInfo, setBusInfo] = useState<BusInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [driverRes, busRes, studentRes] = await Promise.all([
          fetchWithAuth("/driver/me"),
          fetchWithAuth("/driver/my-bus-info"),
          fetchWithAuth("/driver/students"),
        ]);

        const driverData = await driverRes.json();
        const busData = await busRes.json();
        const studentData = await studentRes.json();

        if (driverData.success) setDriver(driverData.driver);
        if (busData.success) setBusInfo(busData);
        if (studentData.success) setStudents(studentData.students);
      } catch (err) {
        console.error("Failed to fetch driver data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLocationUpdate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetchWithAuth("/driver/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude, longitude }),
          });
          const data = await res.json();
          if (data.success) {
            alert("Location updated!");
          }
        } catch (e) {
          console.error("Failed to update location", e);
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const glowingBtn = (bg: string, shadow: string, glowClass?: string) =>
    clsx(
      "w-12 h-12 rounded-full flex items-center justify-center text-white text-lg transition duration-300 ease-in-out hover:scale-[1.1]",
      bg,
      `hover:shadow-[0_0_20px_${shadow}]`,
      glowClass
    );

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Driver Dashboard</h1>
          <div className="flex items-center gap-4">
            <User className="text-primary" />
            <div>
              <p className="text-sm font-medium">{driver?.name}</p>
              <p className="text-xs text-muted-foreground">{driver?.role}</p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Bell className="text-muted-foreground hover:text-primary cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bus className="mr-2 h-5 w-5 text-primary" /> My Bus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {busInfo ? (
                <>
                  <div>Bus ID: <Badge>{busInfo.bus_id}</Badge></div>
                  <div>Area: {busInfo.areaServed?.join(", ") || "N/A"}</div>
                  <div>Students: {busInfo.students?.length || 0}</div>
                  <Button variant="outline" size="sm" onClick={handleLocationUpdate}>
                    Update Location
                  </Button>
                </>
              ) : (
                <div className="text-muted-foreground">No assigned bus</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary" /> My Students
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-40 overflow-y-auto space-y-1">
              {students.length > 0 ? (
                students.map((s) => <div key={s.id}>• {s.name}</div>)
              ) : (
                <div className="text-muted-foreground">No students assigned</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-primary" /> Emergency
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className={glowingBtn("bg-yellow-900", "#f59e0b", "emergency-glow-orange")}>⚡</button>
                </TooltipTrigger>
                <TooltipContent>Traffic Jam</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className={glowingBtn("bg-red-900", "#ef4444", "emergency-glow-red")}>🚑</button>
                </TooltipTrigger>
                <TooltipContent>Accident</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className={glowingBtn("bg-blue-900", "#3b82f6", "emergency-glow-blue")}>⏱</button>
                </TooltipTrigger>
                <TooltipContent>Bus Delayed</TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5 text-primary" /> Live Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LiveMap />
              </CardContent>
            </Card>
          </motion.div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="mr-2 h-5 w-5 text-primary" /> Upcoming Trips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar mode="single" selected={new Date()} className="rounded-md border" />
              <p className="mt-2 text-xs text-muted-foreground">
                Next trip on: <strong>{new Date().toDateString()}</strong>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-primary" /> Trip Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div>Total Stops: {students.length}</div>
              <div>Total Picked: {students.length}</div>
              <div>Trip Duration: 00:45 mins</div>
            </CardContent>
          </Card>

          <Card onClick={() => setShowProgress((prev) => !prev)} className="cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart2 className="mr-2 h-5 w-5 text-primary" /> Trip Completion
              </CardTitle>
            </CardHeader>
            <AnimatePresence>
              {showProgress && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <CardContent>
                    <p className="text-sm mb-2">72% of trips completed this week</p>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "72%" }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                      className="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500 shadow-[0_0_12px_2px_rgba(59,130,246,0.7)]"
                    />
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>

        {/* Global Styles */}
        <style jsx global>{`
          .emergency-glow-orange {
            box-shadow: 0 0 10px #f59e0b, 0 0 20px #f59e0b, 0 0 30px #f59e0b;
          }
          .emergency-glow-red {
            box-shadow: 0 0 10px #ef4444, 0 0 20px #ef4444, 0 0 30px #ef4444;
          }
          .emergency-glow-blue {
            box-shadow: 0 0 10px #3b82f6, 0 0 20px #3b82f6, 0 0 30px #3b82f6;
          }
        `}</style>
      </div>
    </TooltipProvider>
  );
}
