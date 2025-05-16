'use client';

import { Button } from '@/components/ui/button'
import { fetchWithAdminAuth } from '@/lib/adminAuth'
import { assignStudentsToBus } from '@/lib/bus'
import { Loader2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface UserInfo {
  _id: string
  name: string
  assignedBusId?: string | null
  email?: string
}

export default function AssignStudentsPage() {
  const { id: busId } = useParams() as { id: string }
  const router = useRouter()

  const [students, setStudents] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadUnassignedStudents() {
      setLoading(true)
      try {
        // note: fetchWithAdminAuth prepends '/api' for you
        const res = await fetchWithAdminAuth('/admin/users?role=student')
        if (!res.ok) throw new Error('Failed to load students')
        const { users } = await res.json()
        // only those not already on a bus
        setStudents(users.filter((s: UserInfo) => !s.assignedBusId))
      } catch (err: any) {
        toast.error(err.message || 'Failed to load students')
      } finally {
        setLoading(false)
      }
    }
    loadUnassignedStudents()
  }, [])

  const filtered = students.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      !!s.email && s.email.toLowerCase().includes(search.toLowerCase())
  )

  const toggleSelect = (id: string) => {
    setSelected(sel =>
      sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]
    )
  }

  const handleAssign = async () => {
    setSaving(true)
    try {
      await assignStudentsToBus(busId, selected)
      toast.success('Students assigned successfully')
      router.push(`/admin/buses/${busId}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign students')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Assign Students to Bus</h1>

      <input
        type="text"
        placeholder="Search by name or email…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-4 w-full p-2 border rounded"
      />

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">No unassigned students found.</p>
      ) : (
        <form
          onSubmit={e => {
            e.preventDefault()
            handleAssign()
          }}
        >
          <ul className="mb-4">
            {filtered.map(stu => (
              <li
                key={stu._id}
                className="flex items-center gap-2 py-1 cursor-pointer"
                onClick={() => toggleSelect(stu._id)}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(stu._id)}
                  readOnly
                  className="accent-blue-600"
                />
                <span>{stu.name}</span>
                {stu.email && (
                  <span className="text-muted-foreground">({stu.email})</span>
                )}
              </li>
            ))}
          </ul>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={saving || selected.length === 0}
            >
              {saving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Assign Selected ({selected.length})
            </Button>

            <Button
              variant="outline"
              type="button"
              onClick={() => router.push(`/admin/buses/${busId}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
