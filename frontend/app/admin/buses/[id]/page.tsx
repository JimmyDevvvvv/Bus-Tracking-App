'use client';

import React from 'react';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchWithAdminAuth } from '@/lib/adminAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Toaster, toast } from 'sonner';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  BusIcon,
  User,
  Calendar,
  Hash,
  Tag,
  Trash2,
  Pencil,
  Fuel,
  StickyNote,
  Accessibility,
  Wifi,
  BatteryCharging,
  Route,
  Clock,
  CalendarOff,
  Power,
  PowerOff,
} from 'lucide-react';
import { format } from 'date-fns'; // For formatting dates
import { cn } from '@/lib/utils';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Interface matching the expected populated bus data
interface DriverInfo {
  _id: string;
  name: string;
}
// Define UserInfo if it's used (e.g., for assigned students)
interface UserInfo {
  _id: string;
  name: string;
}
interface Bus {
  _id: string;
  bus_id: string; // Auto-generated ID
  busNumber: string;
  model: string;
  capacity: number;
  licensePlate: string;
  year: number;
  status: 'active' | 'maintenance' | 'retired' | 'inactive';
  driver_id?: DriverInfo | null;
  assignedStudentIds?: UserInfo[]; // Now UserInfo is defined
  currentStudentCount?: number;
  createdAt: string;
  updatedAt: string;
  fuelType?: string;
  lastMaintenance?: string;
  notes?: string;
  isAccessible?: boolean;
  hasWifi?: boolean;
  hasUSBCharging?: boolean;
  trackingDeviceId?: string;
  campusRoute?: string;
  operatingHours?: string;
  weekendService?: boolean;
  // Add other fields as needed
}

export default function ViewBusDetails() {
  const params = useParams();
  const router = useRouter();
  const busId = params.id as string;

  const [bus, setBus] = useState<Bus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false); // State for activate/deactivate loading

  useEffect(() => {
    if (!busId) return;

    const fetchBus = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchWithAdminAuth(`/admin/bus/${busId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch bus details');
        }
        setBus(data.bus);
      } catch (error: unknown) {
        const typedError =
          error instanceof Error ? error : new Error('An unexpected error occurred');
        setError(typedError.message || 'An unexpected error occurred.');
        toast.error(typedError.message || 'Failed to load bus details.');
      } finally {
        setLoading(false);
      }
    };

    fetchBus();
  }, [busId]);

  const handleDeleteBus = async () => {
    if (!bus) return;
    setIsDeleting(true);
    try {
      const response = await fetchWithAdminAuth(`/admin/bus/${bus._id}`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({})); // Catch errors on empty responses

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to delete bus');
      }
      toast.success(`Bus ${bus.busNumber} deleted successfully.`);
      router.push('/admin/buses'); // Redirect to list page
    } catch (error: unknown) {
      const typedError = error instanceof Error ? error : new Error('An unexpected error occurred');
      toast.error(typedError.message || 'Failed to delete bus.');
      setIsAlertOpen(false); // Close dialog on error
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Handle Activate/Deactivate ---
  const handleToggleStatus = async () => {
    if (!bus) return;

    const currentStatus = bus.status;
    // Only allow toggling between active and inactive
    if (currentStatus !== 'active' && currentStatus !== 'inactive') {
      toast.warning(`Cannot change status from ${currentStatus}.`);
      return;
    }

    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? 'Activating' : 'Deactivating';

    setIsTogglingStatus(true);
    try {
      const response = await fetchWithAdminAuth(`/admin/bus/${bus._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${actionText.toLowerCase()} bus`);
      }

      // Update local state to reflect the change immediately
      setBus(prevBus => (prevBus ? { ...prevBus, status: newStatus } : null));
      toast.success(`Bus successfully ${newStatus === 'active' ? 'activated' : 'deactivated'}.`);
    } catch (error: unknown) {
      const typedError = error instanceof Error ? error : new Error('An unexpected error occurred');
      toast.error(typedError.message || `Failed to ${actionText.toLowerCase()} bus.`);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Use renderStatusDot from list page for consistency
  const renderStatusDot = (status: string) => {
    let dotColor = 'bg-gray-400'; // Default for outline/unknown
    let textColor = 'text-gray-700 dark:text-gray-300';
    let bgColor = 'bg-gray-100 dark:bg-gray-800';
    let text = status.charAt(0).toUpperCase() + status.slice(1);

    switch (status) {
      case 'active':
        dotColor = 'bg-green-500';
        textColor = 'text-green-700 dark:text-green-300';
        bgColor = 'bg-green-100 dark:bg-green-900';
        break;
      case 'inactive':
        dotColor = 'bg-yellow-500';
        textColor = 'text-yellow-700 dark:text-yellow-300';
        bgColor = 'bg-yellow-100 dark:bg-yellow-900';
        break;
      case 'maintenance':
        dotColor = 'bg-orange-500';
        textColor = 'text-orange-700 dark:text-orange-300';
        bgColor = 'bg-orange-100 dark:bg-orange-900';
        text = 'Maintenance';
        break;
      case 'retired':
        dotColor = 'bg-red-500';
        textColor = 'text-red-700 dark:text-red-300';
        bgColor = 'bg-red-100 dark:bg-red-900';
        break;
    }

    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
          textColor,
          bgColor
        )}
      >
        <span className={cn('h-2 w-2 rounded-full', dotColor)}></span>
        {text}
      </div>
    );
  };

  const renderFeature = (label: string, value: React.ReactNode, icon: React.ElementType) => {
    const Icon = icon;
    return (
      <div className="flex items-start space-x-3">
        <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-sm text-foreground font-medium break-words">
            {value ?? <span className="text-muted-foreground italic">Not set</span>}
          </p>
        </div>
      </div>
    );
  };

  const renderBooleanField = (
    label: string,
    value: boolean | undefined,
    icon: React.ElementType
  ) => {
    return renderFeature(label, value ? 'Yes' : 'No', icon);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/buses')}
            aria-label="Go Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Error</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Bus</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!bus) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/buses')}
            aria-label="Go Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Bus Not Found</h1>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>The requested bus could not be found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Toaster position="top-right" richColors />
      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/buses')}
            aria-label="Go Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BusIcon className="h-8 w-8" /> Bus Details
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Activate/Deactivate Button */}
          <Button
            variant={bus.status === 'active' ? 'secondary' : 'default'}
            onClick={handleToggleStatus}
            disabled={isTogglingStatus || (bus.status !== 'active' && bus.status !== 'inactive')}
            className="gap-1.5"
          >
            {isTogglingStatus ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : bus.status === 'active' ? (
              <PowerOff className="h-4 w-4" />
            ) : (
              <Power className="h-4 w-4" />
            )}
            {isTogglingStatus
              ? bus.status === 'active'
                ? 'Deactivating...'
                : 'Activating...'
              : bus.status === 'active'
                ? 'Deactivate'
                : 'Activate'}
          </Button>

          {/* Edit Button */}
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/buses/${bus._id}/edit`)}
            className="gap-1.5"
            disabled={isTogglingStatus}
          >
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          {/* Delete Button */}
          <Button
            variant="destructive"
            onClick={() => setIsAlertOpen(true)}
            className="gap-1.5"
            disabled={isTogglingStatus}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl mb-1">{bus.busNumber}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                {bus.model} ({bus.year})<span className="text-muted-foreground mx-1">|</span>
                {renderStatusDot(bus.status)}
              </CardDescription>
            </div>
            <p className="text-sm text-muted-foreground">Internal ID: {bus.bus_id}</p>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {renderFeature('License Plate', bus.licensePlate, Tag)}
          {renderFeature('Capacity', bus.capacity, User)}
          {renderFeature('Driver', bus.driver_id?.name || 'Unassigned', User)}
          {renderFeature(
            'Fuel Type',
            bus.fuelType ? bus.fuelType.charAt(0).toUpperCase() + bus.fuelType.slice(1) : 'N/A',
            Fuel
          )}
          {renderFeature('Campus Route', bus.campusRoute, Route)}
          {renderFeature('Operating Hours', bus.operatingHours, Clock)}
          {renderFeature(
            'Last Maintenance',
            bus.lastMaintenance ? format(new Date(bus.lastMaintenance), 'PP') : null,
            Calendar
          )}
          {renderFeature('Tracking Device ID', bus.trackingDeviceId, Hash)}
          {renderBooleanField('Wheelchair Accessible', bus.isAccessible, Accessibility)}
          {renderBooleanField('Wi-Fi Available', bus.hasWifi, Wifi)}
          {renderBooleanField('USB Charging', bus.hasUSBCharging, BatteryCharging)}
          {renderBooleanField('Weekend Service', bus.weekendService, CalendarOff)}
          {renderFeature('Notes', bus.notes, StickyNote)}
          {renderFeature('Date Added', format(new Date(bus.createdAt), 'PPpp'), Calendar)}
          {renderFeature('Last Updated', format(new Date(bus.updatedAt), 'PPpp'), Calendar)}
        </CardContent>
        {/* Add section for Assigned Students if needed */}
        {/* <CardFooter>
             <p>Assigned Students: {bus.assignedStudentIds?.length ?? 0}</p>
         </CardFooter> */}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the bus{' '}
              <span className="font-semibold">
                {bus?.busNumber} ({bus?.licensePlate})
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBus}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  {' '}
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...{' '}
                </>
              ) : (
                'Delete Bus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
