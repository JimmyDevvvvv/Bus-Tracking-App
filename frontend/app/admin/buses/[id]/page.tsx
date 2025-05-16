'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchWithAdminAuth } from '@/lib/adminAuth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Toaster, toast } from 'sonner';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  BusIcon,
  Pencil,
  Trash2,
  Power,
  PowerOff
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// API response wrapper (optional)
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Populated bus & user shapes
interface DriverInfo {
  _id: string;
  name: string;
}
interface UserInfo {
  _id: string;
  name: string;
}
interface Bus {
  _id: string;
  bus_id: string;
  busNumber: string;
  model: string;
  capacity: number;
  licensePlate: string;
  year: number;
  status: 'active' | 'maintenance' | 'retired' | 'inactive';
  driver_id?: DriverInfo | null;
  assignedStudentIds?: UserInfo[];
  createdAt: string;
  updatedAt: string;
}

export default function ViewBusDetails() {
  const params = useParams();
  const router = useRouter();
  const busId = params.id as string;

  // State
  const [bus, setBus] = useState<Bus | null>(null);
  const [studentsList, setStudentsList] = useState<UserInfo[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  // Fetch bus details
  useEffect(() => {
    if (!busId) return;
    setLoading(true);
    fetchWithAdminAuth(`/admin/bus/${busId}`)
      .then(res => res.json())
      .then((data: ApiResponse<{ bus: Bus }>) => {
        if (!data.data?.bus) throw new Error(data.error || 'No bus returned');
        const b = data.data.bus;
        setBus(b);
        setSelectedStudents(b.assignedStudentIds?.map(s => s._id) || []);
      })
      .catch(err => {
        setError(err.message);
        toast.error(err.message);
      })
      .finally(() => setLoading(false));
  }, [busId]);

  // Fetch all students
  useEffect(() => {
    fetchWithAdminAuth('/admin/users?role=student')
      .then(res => res.json())
      .then((data: ApiResponse<{ users: UserInfo[] }>) => {
        setStudentsList(data.data?.users || []);
      })
      .catch(() => toast.error('Failed to load student list'));
  }, []);

  // Toggle active/inactive
  const handleToggleStatus = async () => {
    if (!bus) return;
    const curr = bus.status;
    if (curr !== 'active' && curr !== 'inactive') {
      toast.warning(`Cannot toggle from "${curr}"`);
      return;
    }
    const next = curr === 'active' ? 'inactive' : 'active';
    setIsTogglingStatus(true);
    try {
      const res = await fetchWithAdminAuth(`/admin/bus/${bus._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle status');
      setBus(prev => (prev ? { ...prev, status: next } : prev));
      toast.success(`Bus ${next}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Delete bus
  const handleDeleteBus = async () => {
    if (!bus) return;
    setIsDeleting(true);
    try {
      const res = await fetchWithAdminAuth(`/admin/bus/${bus._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Delete failed');
      toast.success('Deleted');
      router.push('/admin/buses');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Save assignments
  const handleSaveAssignments = async () => {
    if (!bus) return;
    setLoading(true);
    try {
      const res = await fetchWithAdminAuth(`/admin/bus/${bus._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedStudentIds: selectedStudents })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setBus(prev =>
        prev
          ? {
              ...prev,
              assignedStudentIds: studentsList.filter(s => selectedStudents.includes(s._id))
            }
          : prev
      );
      toast.success('Assignments saved');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Render status badge
  const renderStatusDot = (status: string) => {
    let dot = 'bg-gray-400',
      text = 'text-gray-700',
      bg = 'bg-gray-100',
      label = status.charAt(0).toUpperCase() + status.slice(1);
    if (status === 'active') dot = 'bg-green-500', text = 'text-green-700', bg = 'bg-green-100';
    if (status === 'inactive')
      dot = 'bg-yellow-500', text = 'text-yellow-700', bg = 'bg-yellow-100';
    if (status === 'maintenance')
      dot = 'bg-orange-500', text = 'text-orange-700', bg = 'bg-orange-100';
    if (status === 'retired') dot = 'bg-red-500', text = 'text-red-700', bg = 'bg-red-100';
    return (
      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs', bg, text)}>
        <span className={cn('w-2 h-2 mr-1 rounded-full', dot)} />
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }
  if (error || !bus) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={() => router.push('/admin/buses')}>
          <ArrowLeft /> Back
        </Button>
        <Alert className="mt-6">
          <AlertCircle /> <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Bus not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Toaster position="top-right" richColors />

      {/* Header Actions */}
      <div className="flex justify-between mb-6">
        <Button variant="outline" onClick={() => router.push('/admin/buses')}>
          <ArrowLeft /> Back
        </Button>
        <div className="space-x-2">
          <Button onClick={() => setShowAssign(v => !v)}>
            {showAssign ? 'Hide Assignments' : 'Show Assignments'}
          </Button>
          <Button
            variant={bus.status === 'active' ? 'secondary' : 'default'}
            onClick={handleToggleStatus}
            disabled={isTogglingStatus}
          >
            {isTogglingStatus ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : bus.status === 'active' ? (
              <PowerOff />
            ) : (
              <Power />
            )}
            {bus.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
          <Button variant="outline" onClick={() => router.push(`/admin/buses/${bus._id}/edit`)}>
            <Pencil /> Edit
          </Button>
          <Button variant="destructive" onClick={() => setIsAlertOpen(true)}>
            <Trash2 /> Delete
          </Button>
        </div>
      </div>

      {/* Bus Info */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between">
            <CardTitle>{bus.busNumber}</CardTitle>
            <span className="text-sm text-muted-foreground">ID: {bus.bus_id}</span>
          </div>
          <CardDescription>
            {bus.model} ({bus.year}) • {renderStatusDot(bus.status)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><strong>License Plate:</strong> {bus.licensePlate}</div>
          <div><strong>Capacity:</strong> {bus.capacity}</div>
          <div><strong>Created:</strong> {format(new Date(bus.createdAt), 'PPpp')}</div>
          <div><strong>Updated:</strong> {format(new Date(bus.updatedAt), 'PPpp')}</div>
        </CardContent>
      </Card>

      {/* Assign Students */}
      {showAssign && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Assign Students</CardTitle>
            <CardDescription>Select one or more students:</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              multiple
              value={selectedStudents}
              onChange={e =>
                setSelectedStudents(Array.from(e.target.selectedOptions).map(o => o.value))
              }
              className="w-full h-40 border rounded p-2"
            >
              {studentsList.map(s => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleSaveAssignments} disabled={loading}>
              {loading ? 'Saving…' : 'Save Assignments'}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bus?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBus} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
