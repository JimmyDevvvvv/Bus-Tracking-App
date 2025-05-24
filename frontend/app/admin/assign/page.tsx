"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { fetchWithAuth } from "@/lib/auth"
import { toast } from "sonner"

interface Bus {
  _id: string
  busNumber: string
}

interface Student {
  _id: string
  name: string
  email?: string
}

export default function AssignPage() {
  const [buses, setBuses] = useState<Bus[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [busId, setBusId] = useState<string>("")
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Fetch buses and students
  useEffect(() => {
    const load = async () => {
      try {
        const [busRes, studentRes] = await Promise.all([
          fetchWithAuth("/admin/buses"),
          fetchWithAuth("/admin/users?role=student"),
        ])
        const busData = await busRes.json()
        const studentData = await studentRes.json()

        if (busData?.buses) setBuses(busData.buses)
        if (studentData?.users) setStudents(studentData.users)
      } catch (err) {
        toast.error("❌ Failed to load buses or students")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const toggleStudent = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleAssign = async () => {
    setSubmitting(true)
    try {
      const res = await fetchWithAuth(`/admin/buses/assign-students/${busId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: selected }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`✅ Assigned ${selected.length} students to bus`)
        setSelected([])
      } else {
        toast.error(`❌ ${data.error || "Assignment failed"}`)
      }
    } catch (err) {
      console.error(err)
      toast.error("❌ Error assigning students")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-4">Loading buses and students...</div>

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Assign Students to a Bus</h1>

      {/* BUS SELECTION */}
      <div className="space-y-2">
        <Label htmlFor="bus">Select a Bus</Label>
        <select
          id="bus"
          value={busId}
          onChange={e => setBusId(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option value="">— Choose a Bus —</option>
          {buses.map(b => (
            <option key={b._id} value={b._id}>
              {b.busNumber}
            </option>
          ))}
        </select>
      </div>

      {/* STUDENT PICKER */}
      <div className="space-y-2">
        <Label>Select Students</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-auto border rounded p-2">
          {students.map(s => (
            <button
              key={s._id}
              type="button"
              onClick={() => toggleStudent(s._id)}
              className={`text-left px-3 py-2 border rounded transition duration-150 ${
                selected.includes(s._id)
                  ? "bg-blue-100 border-blue-500"
                  : "hover:bg-muted"
              }`}
            >
              <strong>{s.name}</strong>
              <br />
              <span className="text-xs text-muted-foreground">{s.email}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SUBMIT */}
      <Button
        onClick={handleAssign}
        disabled={!busId || selected.length === 0 || submitting}
      >
        {submitting ? "Assigning..." : "Assign Students"}
      </Button>
    </div>
  )
}
