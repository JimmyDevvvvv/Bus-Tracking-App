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
  ThumbsUp,
  CheckCircle,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import LiveBusMap from "@/components/LiveBusMap";
import clsx from "clsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";


// track the driver’s live coords


// load the Google Maps JS API
// const { isLoaded: mapLoaded, loadError } = useJsApiLoader({
//   googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
// });


const LiveMap = dynamic(() => import("@/components/ui/DriverMap"), {
  ssr: false,
});

interface Driver {
  name: string;
  email: string;
  role: string;
}

interface Student {
  id: string;
  name: string;
  profilePicture?: string;
  pickupLocation?: { latitude: number; longitude: number };
}

interface BusInfo {
  bus_id: string;
  driver: Driver;
  students: Student[];
  areaServed: string[];
}

export default function DriverDashboard() {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [busInfo, setBusInfo] = useState<BusInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocoded, setGeocoded] = useState<
  Record<string, { lat: number; lng: number }>
>({});
  const [showProgress, setShowProgress] = useState(false);
  const [busLocation, setBusLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const { isLoaded: mapLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });
  const [selectedEmergency, setSelectedEmergency] = useState<null | {
    title: string;
    icon: string;
  }>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);


  useEffect(() => {
    if (!busInfo?.bus_id) return;
    const watcher = navigator.geolocation.watchPosition(
      pos => {
        setBusLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      err => console.error(err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watcher);
  }, [busInfo]);


  useEffect(() => {
  if (!busInfo?.bus_id) return;

  const watcher = navigator.geolocation.watchPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      setBusLocation({ latitude, longitude });
      // (optional) POST to your backend here
    },
    err => console.error("Geolocation error:", err),
    { enableHighAccuracy: true }
  );

  return () => navigator.geolocation.clearWatch(watcher);
}, [busInfo]);

useEffect(() => {
  if (mapLoaded && students.length) {
    const geocoder = new window.google.maps.Geocoder();
    students.forEach((s) => {
      if (
        typeof s.pickupLocation === "string" &&
        !geocoded[s.id]
      ) {
        geocoder.geocode(
          { address: s.pickupLocation },
          (results, status) => {
            if (status === "OK" && results && results[0]) {
              setGeocoded((g) => ({
                ...g,
                [s.id]: {
                  lat: results[0].geometry.location.lat(),
                  lng: results[0].geometry.location.lng(),
                },
              }));
            }
          }
        );
      }
    });
  }
}, [mapLoaded, students]);

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
        console.log("students Data:", studentData);
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

  const handleEmergencyClick = (title: string, icon: string) => {
    setSelectedEmergency({ title, icon });
    setShowConfirmModal(true);
  };

  const handleSendNotification = async () => {
    if (!messageInput.trim() || !selectedEmergency) return;

    setIsSending(true);
    try {
      const res = await fetchWithAuth("/driver/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedEmergency.title,
          message: messageInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Notification sent successfully!");
      } else {
        alert("Failed to send notification.");
      }
    } catch (e) {
      console.error(e);
      alert("Error while sending notification.");
    } finally {
      setIsSending(false);
      setShowConfirmModal(false);
      setMessageInput("");
      setSelectedEmergency(null);
    }
  };

  const closeModal = () => {
    setSelectedEmergency(null);
    setShowConfirmModal(false);
    setMessageInput("");
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-muted-foreground">Loading Dashboard...</p>
        </motion.div>
      </div>
    );
  }

  const glowingBtn = (bg: string, shadow: string, glowClass?: string) =>
    clsx(
      "w-12 h-12 rounded-full flex items-center justify-center text-white text-lg transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl",
      bg,
      `hover:shadow-[0_0_25px_${shadow}]`,
      glowClass
    );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
        {/* Header Section */}
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="p-6">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex justify-between items-center"
            >
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Driver Dashboard
                </h1>
                <p className="text-muted-foreground mt-2">Welcome back to your command center</p>
              </div>
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl px-6 py-3 shadow-lg border border-slate-200 dark:border-slate-700"
              >
                <User className="text-primary w-10 h-10 p-2 bg-primary/10 rounded-full" />
                <div>
                  <p className="text-sm font-semibold">{driver?.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{driver?.role}</p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Bell className="text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>Notifications</TooltipContent>
                </Tooltip>
              </motion.div>
            </motion.div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 p-6">
          {/* Left Sidebar - Bus Info & Students */}
          <div className="lg:w-80 space-y-6">
            {/* My Bus Card */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="rounded-3xl shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Bus className="mr-3 h-6 w-6 text-blue-500" /> My Bus
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {busInfo ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Bus ID:</span>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {busInfo.bus_id}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Area:</span>
                        <span className="text-sm font-medium">{busInfo.areaServed?.join(", ") || "N/A"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Students:</span>
                        <span className="text-sm font-bold text-green-600">{busInfo.students?.length || 0}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLocationUpdate}
                        className="w-full mt-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Update Location
                      </Button>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground py-6">
                      <Bus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No assigned bus</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* My Students Card */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="rounded-3xl shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Users className="mr-3 h-6 w-6 text-green-500" /> My Students
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto space-y-3 custom-scrollbar">
                  {students.length > 0 ? (
                    students.map((s, index) => (
                      <motion.div
                        key={s.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <Avatar className="w-10 h-10 ring-2 ring-green-100 dark:ring-green-900">
                          <AvatarImage
                            src={s.profilePicture || undefined}
                            alt={s.name}
                          />
                          <AvatarFallback className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {s.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{s.name}</span>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-6">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No students assigned</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Emergency Actions Card */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="rounded-3xl shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <AlertTriangle className="mr-3 h-6 w-6 text-orange-500" /> Emergency Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={clsx(
                          glowingBtn(
                            "bg-gradient-to-br from-green-600 to-green-700",
                            "#22c55e",
                            "emergency-glow-green"
                          ),
                          "w-full h-16"
                        )}
                        onClick={() => handleEmergencyClick("All Clear", "👍")}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <ThumbsUp className="w-5 h-5" />
                          <span className="text-xs">All Clear</span>
                        </div>
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent>All Clear – Everything is fine</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={clsx(
                          glowingBtn(
                            "bg-gradient-to-br from-yellow-600 to-orange-600",
                            "#f59e0b",
                            "emergency-glow-orange"
                          ),
                          "w-full h-16"
                        )}
                        onClick={() => handleEmergencyClick("Traffic Jam", "⚡")}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xl">⚡</span>
                          <span className="text-xs">Traffic</span>
                        </div>
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent>Traffic Jam</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={clsx(
                          glowingBtn(
                            "bg-gradient-to-br from-red-600 to-red-700",
                            "#ef4444",
                            "emergency-glow-red"
                          ),
                          "w-full h-16"
                        )}
                        onClick={() => handleEmergencyClick("Accident", "🚑")}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xl">🚑</span>
                          <span className="text-xs">Accident</span>
                        </div>
                      </motion.button>
                    </TooltipTrigger>  
                    <TooltipContent>Accident</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={clsx(
                          glowingBtn(
                            "bg-gradient-to-br from-blue-600 to-blue-700",
                            "#3b82f6",
                            "emergency-glow-blue"
                          ),
                          "w-full h-16"
                        )}
                        onClick={() => handleEmergencyClick("Bus Delayed", "⏱")}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xl">⏱</span>
                          <span className="text-xs">Delayed</span>
                        </div>
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent>Bus Delayed</TooltipContent>
                  </Tooltip>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 space-y-6">
            {/* Live Map Section */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="rounded-3xl shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <MapPin className="mr-3 h-6 w-6 text-purple-500" /> Live Location Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="rounded-2xl overflow-hidden shadow-inner h-96">
                            {loadError && <div className="p-4 text-red-500">Map failed to load</div>}

                                              {/* {!mapLoaded ? (
                                                <div className="flex h-full items-center justify-center">
                                                  <Loader2 className="animate-spin text-primary" />
                                                </div>
                                              ) : busLocation ? (
                                                <GoogleMap
                                                  mapContainerStyle={{ width: "100%", height: "100%" }}
                                                  center={{ lat: busLocation.latitude, lng: busLocation.longitude }}
                                                  zoom={15}
                                                >
                                                  <Marker
                                                    position={{
                                                      lat: busLocation.latitude,
                                                      lng: busLocation.longitude,
                                                    }}
                                                    label="🚌"
                                                  />
                                                </GoogleMap>
                                              ) : (
                                                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                                  Waiting for position…
                                                </div>
                                              )} */}












                                              <CardContent className="p-6">
  <div className="rounded-2xl overflow-hidden shadow-inner h-96">
    {loadError && <div className="p-4 text-red-500">Map failed to load</div>}

    {!mapLoaded ? (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    ) : (
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        // center on the bus if available, else first student pickup, else (0,0)
        center={{
          lat:
            busLocation?.latitude ??
            students[0]?.pickupLocation?.latitude ??
            0,
          lng:
            busLocation?.longitude ??
            students[0]?.pickupLocation?.longitude ??
            0,
        }}
        zoom={13}
      >
        {/* 🚌 Bus live marker */}
        {busLocation && (
            <Marker
              position={{
                lat: Number(busLocation.latitude),
                lng: Number(busLocation.longitude),
              }}
              label="🚌"
            />
        )}

        {/* 🎒 Student pickup markers */}
        {students.map((s) =>
          geocoded[s.id] ? (
            <Marker
              key={s.id}
              position={geocoded[s.id]}
              label="🎒"
            />
          ) : null
        )}
      </GoogleMap>
    )}
  </div>
</CardContent>


                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Analytics and Performance Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Trip Analytics */}
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="rounded-3xl shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 hover:shadow-2xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Clock className="mr-3 h-6 w-6 text-cyan-500" /> Trip Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl p-3">
                        <div className="text-2xl font-bold text-cyan-600">{students.length}</div>
                        <div className="text-xs text-muted-foreground">Total Stops</div>
                      </div>
                      <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3">
                        <div className="text-2xl font-bold text-green-600">{students.length}</div>
                        <div className="text-xs text-muted-foreground">Picked Up</div>
                      </div>
                      <div className="text-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-3">
                        <div className="text-2xl font-bold text-purple-600">45</div>
                        <div className="text-xs text-muted-foreground">Minutes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Performance Overview */}
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Card
                  onClick={() => setShowProgress((prev) => !prev)}
                  className="cursor-pointer rounded-3xl shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <BarChart2 className="mr-3 h-6 w-6 text-pink-500" /> Performance Overview
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
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Weekly Completion</span>
                              <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">72%</span>
                            </div>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: "72%" }}
                              transition={{ duration: 2, ease: "easeInOut" }}
                              className="h-4 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 shadow-lg relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            </motion.div>
                            <div className="grid grid-cols-3 gap-2 mt-4">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-pink-500" />
                                <span className="text-xs text-muted-foreground">On Time</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-purple-500" />
                                <span className="text-xs text-muted-foreground">Delayed</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                                <span className="text-xs text-muted-foreground">Cancelled</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Right Sidebar - Calendar & Schedule */}
          <div className="lg:w-80">
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="rounded-3xl shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <CalendarIcon className="mr-3 h-6 w-6 text-indigo-500" /> Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Calendar
                    mode="single"
                    selected={new Date()}
                    className="rounded-xl border-0 shadow-sm bg-slate-50 dark:bg-slate-700"
                  />
                  <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Next trip:</p>
                    <p className="font-semibold text-sm">{new Date().toDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Enhanced Emergency Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 border border-slate-200 dark:border-slate-700"
            >
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{selectedEmergency?.icon}</div>
                <h2 className="text-2xl font-bold mb-2">{selectedEmergency?.title}</h2>
                <p className="text-sm text-muted-foreground">
                  Send an emergency notification to all your students
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    placeholder="Enter your message for students and parents..."
                    className="w-full p-4 text-sm border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 resize-none h-32 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                    {messageInput.length}/500
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={closeModal}
                    className="flex-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={isSending || !messageInput.trim()}
                    onClick={handleSendNotification}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    {isSending ? "Sending..." : "Send Alert"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Enhanced Global Styles */}
        <style jsx global>{`
          .emergency-glow-orange {
            box-shadow: 0 0 15px rgba(245, 158, 11, 0.5), 0 0 30px rgba(245, 158, 11, 0.3), 0 0 45px rgba(245, 158, 11, 0.1);
          }
          .emergency-glow-red {
            box-shadow: 0 0 15px rgba(239, 68, 68, 0.5), 0 0 30px rgba(239, 68, 68, 0.3), 0 0 45px rgba(239, 68, 68, 0.1);
          }
          .emergency-glow-blue {
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.3), 0 0 45px rgba(59, 130, 246, 0.1);
          }
          .emergency-glow-green {
            box-shadow: 0 0 15px rgba(34, 197, 94, 0.5), 0 0 30px rgba(34, 197, 94, 0.3), 0 0 45px rgba(34, 197, 94, 0.1);
          }
          
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.5);
            border-radius: 3px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(156, 163, 175, 0.7);
          }
        `}</style>
      </div>
    </TooltipProvider>
  );
}