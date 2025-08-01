import { fetchWithAdminAuth } from "./adminAuth"

// lib/bus.ts
export interface Bus {
    _id: string
    bus_id: string
    busNumber: string
    model: string
    capacity: number
    licensePlate: string
    year: number
    status: 'active' | 'maintenance' | 'retired' | 'inactive'
    driver_id?: { _id: string; name: string } | null
    studentsAssigned?: { _id: string; name: string }[]
    createdAt: string
    updatedAt: string
  }
  
  /** Throw if not OK, extracting JSON/text */
  async function assertOk(res: Response) {
    if (res.ok) return
    let msg = `Error ${res.status}`
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const body = await res.json().catch(() => ({}))
      msg = (body.error as string) || (body.message as string) || msg
    } else {
      msg = (await res.text()) || msg
    }
    throw new Error(msg)
  }
  
  /** Fetch single bus (you might not need this in this page) */
  export async function fetchBus(busId: string): Promise<Bus> {
    const res = await fetch(`/api/admin/bus/${busId}`, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' },
    })
    await assertOk(res)
    const { bus } = await res.json()
    return bus
  }
  
  /** Assign an array of student IDs to a bus */
  export async function assignStudentsToBus(
    busId: string,
    studentIds: string[]
  ): Promise<void> {
    const res = await fetchWithAdminAuth(`/bus/${busId}/assign-students`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ studentIds }),
    })
    if (!res.ok) {
      let msg = `Error ${res.status}`
      try {
        const body = await res.json()
        msg = body.error || body.message || msg
      } catch {}
      throw new Error(msg)
    }
  }