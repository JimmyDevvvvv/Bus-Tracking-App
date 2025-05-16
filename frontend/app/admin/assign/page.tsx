"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { fetchWithAuth } from "@/lib/auth"

interface Bus { _id: string; busNumber: string }
interface Student { _id: string; name: string }

export default function AssignPage() {
  const [buses, setBuses] = useState<Bus[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [busId, setBusId] = useState<string>("")
  const [selected, setSelected] = useState<string[]>([])
  const [msg, setMsg] = useState<string | null>(null)

  // Fetch all buses and all students
  useEffect(() => {
    fetchWithAuth("/bus")        // you’ll need endpoints to list buses & students
      .then(r => r.json()).then(d => d.buses && setBuses(d.buses))
    fetchWithAuth("/admin/users?role=student")
      .then(r => r.json()).then(d => d.users && setStudents(d.users))
  }, [])

  const toggleStudent = (id: string) =>
    setSelected(sel =>
      sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]
    )

  const handleSubmit = async () => {
    setMsg(null)
    const res = await fetchWithAuth("/bus/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ busId, studentIds: selected }),
    })
    const json = await res.json()
    if (json.success) setMsg("✅ Assigned successfully!")
    else setMsg(`❌ ${json.error || "Failed"}`)
  }

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Assign Students to Bus</h1>

      <div className="space-y-2">
        <Label>Bus</Label>
        <select
          className="w-full border p-2"
          value={busId}
          onChange={e => setBusId(e.target.value)}
        >
          <option value="">— select bus —</option>
          {buses.map(b => (
            <option key={b._id} value={b._id}>
              {b.busNumber}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Students</Label>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto border p-2">
          {students.map(s => (
            <button
              key={s._id}
              type="button"
              onClick={() => toggleStudent(s._id)}
              className={`p-1 border rounded ${
                selected.includes(s._id)
                  ? "bg-primary/20 border-primary"
                  : ""
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={!busId || !selected.length}>
        Assign
      </Button>

      {msg && <p className="mt-2">{msg}</p>}
    </div>
  )
}
