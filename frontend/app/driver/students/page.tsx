// File: /app/driver/students/page.tsx

"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import StudentCard from "./StudentCard";
import MessageModal from "./MessageModal";

interface Student {
  id: string;
  name: string;
  pickupTime: string;
  pickupLocation: string;
}

export default function DriverStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // TODO: Replace with API call
    const mockData: Student[] = [
      { id: "1", name: "Ali Mokhtar", pickupTime: "7:45 AM", pickupLocation: "Gate A" },
      { id: "2", name: "Nada Hamdy", pickupTime: "7:50 AM", pickupLocation: "Gate B" },
      { id: "3", name: "Karim El Sharkawy", pickupTime: "8:00 AM", pickupLocation: "Main Parking" },
    ];
    setStudents(mockData);
  }, []);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">My Students</h1>
      <Input
        placeholder="Search by name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map((student) => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <StudentCard
              student={student}
              onMessage={() => {
                setSelectedStudent(student);
                setModalOpen(true);
              }}
            />
          </motion.div>
        ))}
      </div>

      {selectedStudent && (
        <MessageModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          student={selectedStudent}
        />
      )}
    </div>
  );
}
