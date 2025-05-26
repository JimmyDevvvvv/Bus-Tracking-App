"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import SlideOver from "@/components/ui/slide-over";
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
      return "border-blue-500";
    case "late":
      return "border-red-600";
    case "absent":
      return "border-zinc-500";
    default:
      return "";
  }
}

function getRingColor(status: string) {
  switch (status) {
    case "on time":
      return "ring-blue-500";
    case "late":
      return "ring-red-600";
    case "absent":
      return "ring-zinc-500";
    default:
      return "";
  }
}

export default function DriverStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [slideOpen, setSlideOpen] = useState(false);

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

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold animate-fade-in">Student Management</h1>
          <Input
            placeholder="Search by name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="grid gap-4">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground">No students found.</p>
          ) : (
            filtered.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`relative p-4 rounded-xl border-l-4 ${getBorderColor(
                  student.status
                )} bg-[rgba(255,255,255,0.03)] backdrop-blur-md border border-white/10 shadow hover:shadow-xl hover:scale-[1.01] transition-all duration-300 cursor-pointer`}
                onClick={() => {
                  setSelectedStudent(student);
                  setSlideOpen(true);
                }}
              >
                <div className="flex items-center gap-4">
                  <Avatar className={`w-12 h-12 ring-2 ring-offset-2 ${getRingColor(student.status)}`}>
                    <AvatarImage src={student.profilePicture || undefined} alt={student.name} />
                    <AvatarFallback>
                      {student.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <p className="text-lg font-semibold">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>

                  <div className="text-right space-y-1 text-xs">
                    <div className="flex items-center gap-1 justify-end">
                      <Clock className="h-4 w-4" /> {student.pickupTime}
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      <DoorOpen className="h-4 w-4" /> {student.pickupLocation}
                    </div>
                    <div
                      className={`font-semibold text-xs ${
                        student.status === "on time"
                          ? "neon-on-time"
                          : student.status === "late"
                          ? "neon-late"
                          : "neon-absent"
                      }`}
                    >
                      {student.status}
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-primary px-0 hover:underline flex gap-1 items-center justify-end"
                        >
                          <MessageSquare className="h-4 w-4" /> Message
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Send quick message</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

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
                className="space-y-6 p-6 bg-muted/40 rounded-xl shadow-inner"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={selectedStudent.profilePicture || undefined} alt={selectedStudent.name} />
                    <AvatarFallback>
                      {selectedStudent.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xl font-semibold">{selectedStudent.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                  </div>
                </div>

                <div className="grid gap-2 text-sm">
                  <p>
                    <strong>Pickup Time:</strong> {selectedStudent.pickupTime}
                  </p>
                  <p>
                    <strong>Pickup Location:</strong> {selectedStudent.pickupLocation}
                  </p>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium mb-1">
                      Set Status:
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
                      className="w-full rounded px-3 py-2 text-sm bg-background border border-input shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="on time">✅ On Time</option>
                      <option value="late">🟥 Late</option>
                      <option value="absent">⚪ Absent</option>
                    </select>
                  </div>
                </div>

                <div className="w-full h-36 rounded-lg bg-gray-200 text-sm flex items-center justify-center text-muted-foreground">
                  <MapPin className="mr-2 h-4 w-4" /> Pickup Location Preview
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-4 w-full bg-primary text-white py-2 rounded shadow hover:bg-primary/90"
                >
                  Send Quick Message
                </motion.button>
              </motion.div>
            </SlideOver>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .neon-on-time {
          color: #4fc3f7;
          text-shadow: 0 0 5px #4fc3f7, 0 0 10px #4fc3f7, 0 0 20px #4fc3f7, 0 0 40px #81d4fa;
        }
        .neon-late {
          color: #ff5252;
          text-shadow: 0 0 5px #ff5252, 0 0 10px #ff1744, 0 0 20px #f44336, 0 0 40px #ff8a80;
        }
        .neon-absent {
          color: #b0bec5;
          text-shadow: 0 0 3px #b0bec5, 0 0 6px #90a4ae, 0 0 10px #cfd8dc;
        }
      `}</style>
    </TooltipProvider>
  );
}
