"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

// SlideOver component - assumed to be available
import SlideOver from "@/components/ui/slide-over"; // Add this line
import ChatWindow from "@/components/ChatWindow";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Clock,
  DoorOpen,
  MessageSquare,
  MapPin,
  Search,
  Users,
  CheckCircle,
  AlertCircle,
  XCircle,
  Send,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  pickupTime: string;
  pickupLocation: string;
  status: "on time" | "late" | "absent";
  profilePicture?: string;
}

function getBorderColor(status: string) {
  switch (status) {
    case "on time":
      return "border-l-emerald-500";
    case "late":
      return "border-l-amber-500";
    case "absent":
      return "border-l-slate-400";
    default:
      return "";
  }
}

function getRingColor(status: string) {
  switch (status) {
    case "on time":
      return "ring-emerald-500/30";
    case "late":
      return "ring-amber-500/30";
    case "absent":
      return "ring-slate-400/30";
    default:
      return "";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "on time":
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case "late":
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    case "absent":
      return <XCircle className="h-4 w-4 text-slate-400" />;
    default:
      return null;
  }
}

function getStatusGradient(status: string) {
  switch (status) {
    case "on time":
      return "from-emerald-500/10 to-green-500/5";
    case "late":
      return "from-amber-500/10 to-orange-500/5";
    case "absent":
      return "from-slate-400/10 to-slate-300/5";
    default:
      return "from-slate-100/50 to-slate-50/20";
  }
}

export default function DriverStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [slideOpen, setSlideOpen] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5002/api/driver/students", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success && data.students) {
          setStudents(
            data.students.map((s: any) => ({
              id: s.id,
              name: s.name,
              email: s.email,
              pickupTime: s.pickupTime || "--",
              pickupLocation: s.pickupLocation || "--",
              status: s.status || "absent",
              profilePicture: s.profilePicture || null,
            }))
          );
        } else {
          throw new Error(data.message || "Failed to load students.");
        }
      } catch (err) {
        console.error("Error loading students:", err);
      }
    };

    fetchStudents();
  }, []);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  const statusCounts = {
    onTime: students.filter(s => s.status === "on time").length,
    late: students.filter(s => s.status === "late").length,
    absent: students.filter(s => s.status === "absent").length,
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
        <div className="p-6 space-y-8">
          {/* Enhanced Header Section */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
          >
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Student Management
              </h1>
              <p className="text-muted-foreground mt-2">Monitor and manage your student pickups</p>
            </div>
            
            {/* Search Bar with Enhanced Design */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="relative max-w-md w-full"
            >
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Search students by name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-12 pr-4 py-3 rounded-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-primary/20"
              />
            </motion.div>
          </motion.div>

          {/* Status Overview Cards */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Students</p>
                  <p className="text-3xl font-bold text-primary">{students.length}</p>
                </div>
                <Users className="h-12 w-12 text-primary/20" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-emerald-200/20 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-1">On Time</p>
                  <p className="text-3xl font-bold text-emerald-600">{statusCounts.onTime}</p>
                </div>
                <CheckCircle className="h-12 w-12 text-emerald-500/30" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-amber-200/20 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-1">Late</p>
                  <p className="text-3xl font-bold text-amber-600">{statusCounts.late}</p>
                </div>
                <AlertCircle className="h-12 w-12 text-amber-500/30" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-400/10 to-slate-300/5 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-slate-200/20 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Absent</p>
                  <p className="text-3xl font-bold text-slate-500">{statusCounts.absent}</p>
                </div>
                <XCircle className="h-12 w-12 text-slate-400/30" />
              </div>
            </div>
          </motion.div>

          {/* Enhanced Student Cards */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-xl">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-xl text-muted-foreground">No students found</p>
                <p className="text-sm text-muted-foreground/70 mt-2">Try adjusting your search criteria</p>
              </div>
            ) : (
              filtered.map((student, index) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative p-6 rounded-3xl border-l-4 ${getBorderColor(
                    student.status
                  )} bg-gradient-to-r ${getStatusGradient(
                    student.status
                  )} backdrop-blur-sm border border-white/20 dark:border-slate-700/20 shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 cursor-pointer group`}
                  onClick={() => {
                    setSelectedStudent(student);
                    setSlideOpen(true);
                  }}
                >
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className={`w-16 h-16 ring-4 ring-offset-2 ${getRingColor(student.status)} transition-all duration-300 group-hover:scale-110`}>
                        <AvatarImage src={student.profilePicture || undefined} alt={student.name} />
                        <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary/20 to-primary/10">
                          {student.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-1 shadow-lg">
                        {getStatusIcon(student.status)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate">
                          {student.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                          student.status === "on time"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                            : student.status === "late"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}>
                          {student.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 truncate">{student.email}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 rounded-xl px-3 py-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="font-medium">Pickup:</span>
                          <span className="text-muted-foreground">{student.pickupTime}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 rounded-xl px-3 py-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-medium">Location:</span>
                          <span className="text-muted-foreground truncate">{student.pickupLocation}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              console.log("🎯 clicked send for", selectedStudent!.id);
                              router.push(`/driver/chat/${selectedStudent!.id}`);
                            }}
                            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 text-lg font-semibold"
                          >
                            <Send className="h-5 w-5" />
                            Send Quick Message
                          </motion.button>

                        </TooltipTrigger>
                        <TooltipContent>Send quick message to student</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Enhanced Slide Over */}
          <AnimatePresence>
            {slideOpen && selectedStudent && (
              <SlideOver
                title="Student Details"
                open={slideOpen}
                onClose={() => setSlideOpen(false)}
              >
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="space-y-8 p-6"
                >
                  {/* Student Header */}
                  <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl">
                    <div className="relative">
                      <Avatar className="w-16 h-16 ring-4 ring-primary/20">
                        <AvatarImage src={selectedStudent.profilePicture || undefined} alt={selectedStudent.name} />
                        <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary/20 to-primary/10">
                          {selectedStudent.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-1 shadow-lg">
                        {getStatusIcon(selectedStudent.status)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {selectedStudent.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                    </div>
                  </div>

                  {/* Student Details */}
                  <div className="space-y-6">
                    <div className="grid gap-4">
                      <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Clock className="h-5 w-5 text-primary" />
                          <span className="font-semibold">Pickup Time</span>
                        </div>
                        <p className="text-lg text-muted-foreground pl-8">{selectedStudent.pickupTime}</p>
                      </div>
                      
                      <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          <span className="font-semibold">Pickup Location</span>
                        </div>
                        <p className="text-lg text-muted-foreground pl-8">{selectedStudent.pickupLocation}</p>
                      </div>
                    </div>

                    {/* Status Update */}
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-6">
                      <label htmlFor="status" className="block text-lg font-semibold mb-4">
                        Update Status
                      </label>
                      <select
                        id="status"
                        value={selectedStudent.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as Student["status"];
                          setStudents((prev) =>
                            prev.map((s) =>
                              s.id === selectedStudent.id ? { ...s, status: newStatus } : s
                            )
                          );
                          setSelectedStudent((prev) =>
                            prev ? { ...prev, status: newStatus } : prev
                          );
                        }}
                        className="w-full rounded-2xl px-4 py-3 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      >
                        <option value="on time">✅ On Time</option>
                        <option value="late">🟨 Late</option>
                        <option value="absent">⚪ Absent</option>
                      </select>
                    </div>

                    {/* Location Preview */}
                    <div className="bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 rounded-2xl p-8">
                      <div className="flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-lg font-medium">Pickup Location Preview</p>
                          <p className="text-sm opacity-70 mt-1">Interactive map will be displayed here</p>
                        </div>
                      </div>
                    </div>
                          
                    {/* Action Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 text-lg font-semibold"
                    >
                      <Send className="h-5 w-5" />
                      Send Quick Message
                    </motion.button>
                  </div>
                </motion.div>
              </SlideOver>
            )}
          </AnimatePresence>
        </div>

        {/* Enhanced Global Styles */}
        <style jsx global>{`
          .neon-on-time {
            color: #10b981;
            text-shadow: 0 0 5px #10b981, 0 0 10px #10b981, 0 0 20px #10b981;
          }
          .neon-late {
            color: #f59e0b;
            text-shadow: 0 0 5px #f59e0b, 0 0 10px #f59e0b, 0 0 20px #f59e0b;
          }
          .neon-absent {
            color: #6b7280;
            text-shadow: 0 0 3px #6b7280, 0 0 6px #6b7280, 0 0 10px #6b7280;
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