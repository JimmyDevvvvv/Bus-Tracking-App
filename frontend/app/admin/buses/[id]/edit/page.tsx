'use client';

import React from 'react';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchWithAdminAuth } from '@/lib/adminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Toaster, toast } from 'sonner';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

// Interface for API responses
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Interfaces
interface UserInfo {
  _id: string;
  name: string;
}

interface BusFormData {
  busNumber: string;
  model: string;
  capacity: string; // Keep as string for form input
  licensePlate: string;
  year: string; // Keep as string for form input
  status: 'active' | 'maintenance' | 'retired' | 'inactive';
  fuelType?: string;
  driver_id: string; // Store as string, handle __NONE__ and null conversion
  notes?: string;
  isAccessible?: boolean;
  hasWifi?: boolean;
  hasUSBCharging?: boolean;
  trackingDeviceId?: string;
  campusRoute?: string;
  operatingHours?: string;
  weekendService?: boolean;
  // assignedStudentIds?: string[]; // Example if using multi-select
}

export default function EditBusPage() {
  const router = useRouter();
  const params = useParams();
  const busId = params.id as string;

  const [formData, setFormData] = useState<BusFormData>({
    // Initialize with default structure
    busNumber: '',
    model: '',
    capacity: '',
    licensePlate: '',
    year: '',
    status: 'active',
    fuelType: 'diesel',
    driver_id: '__NONE__', // Default to unassigned special value
    notes: '',
    isAccessible: false,
    hasWifi: false,
    hasUSBCharging: false,
    trackingDeviceId: '',
    campusRoute: '',
    operatingHours: '',
    weekendService: false,
  });

  const [drivers, setDrivers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial bus data and drivers
  useEffect(() => {
    if (!busId) return;

    const fetchData = async () => {
      setInitialLoading(true);
      setError(null);
      try {
        // Fetch Bus Data
        const busRes = await fetchWithAdminAuth(`/admin/bus/${busId}`);
        const busData = await busRes.json();
        if (!busRes.ok) {
          throw new Error(busData.error || 'Failed to fetch bus data');
        }

        // Fetch Drivers
        const driverRes = await fetchWithAdminAuth('/admin/users?role=driver&isActive=true');
        if (!driverRes.ok) throw new Error('Failed to fetch drivers');
        const driverResponse = await driverRes.json();
        setDrivers(driverResponse.users || []);

        // Pre-fill form data
        setFormData({
          busNumber: busData.bus.busNumber || '',
          model: busData.bus.model || '',
          capacity: busData.bus.capacity?.toString() || '',
          licensePlate: busData.bus.licensePlate || '',
          year: busData.bus.year?.toString() || '',
          status: busData.bus.status || 'active',
          fuelType: busData.bus.fuelType || 'diesel',
          // Set driver_id to the ID or __NONE__ if null/undefined
          driver_id: busData.bus.driver_id?._id || '__NONE__',
          notes: busData.bus.notes || '',
          isAccessible: busData.bus.isAccessible || false,
          hasWifi: busData.bus.hasWifi || false,
          hasUSBCharging: busData.bus.hasUSBCharging || false,
          trackingDeviceId: busData.bus.trackingDeviceId || '',
          campusRoute: busData.bus.campusRoute || '',
          operatingHours: busData.bus.operatingHours || '',
          weekendService: busData.bus.weekendService || false,
        });
      } catch (error: unknown) {
        const typedError =
          error instanceof Error ? error : new Error('An unexpected error occurred');
        toast.error(typedError.message || 'Failed to load data.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [busId]);

  // eslint-disable-next-line no-undef
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean | 'indeterminate') => {
    if (checked !== 'indeterminate') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Prepare payload with corrected types for the API
    const apiPayload = {
      busNumber: formData.busNumber,
      model: formData.model,
      licensePlate: formData.licensePlate,
      status: formData.status,
      fuelType: formData.fuelType,
      notes: formData.notes,
      isAccessible: formData.isAccessible,
      hasWifi: formData.hasWifi,
      hasUSBCharging: formData.hasUSBCharging,
      trackingDeviceId: formData.trackingDeviceId,
      campusRoute: formData.campusRoute,
      operatingHours: formData.operatingHours,
      weekendService: formData.weekendService,
      // Convert types and handle optional/null fields explicitly
      capacity: formData.capacity ? parseInt(formData.capacity, 10) : undefined,
      year: formData.year ? parseInt(formData.year, 10) : undefined,
      driver_id: formData.driver_id === '__NONE__' ? null : formData.driver_id || null,
      // assignedStudentIds: formData.assignedStudentIds // Add if handling student assignments
    };

    // Remove undefined fields before sending to avoid overwriting with undefined
    // Keep null for driver_id if it's explicitly set to unassigned
    Object.keys(apiPayload).forEach(key => {
      const typedKey = key as keyof typeof apiPayload;
      if (apiPayload[typedKey] === undefined) {
        delete apiPayload[typedKey];
      }
    });

    try {
      const response = await fetchWithAdminAuth(`/admin/bus/${busId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload), // Use the correctly typed payload
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update bus');
      }

      toast.success(`Bus ${result.bus.busNumber} updated successfully!`);

      router.push(`/admin/buses/${busId}`); // Go back to detail view
    } catch (error: unknown) {
      const typedError = error instanceof Error ? error : new Error('An unexpected error occurred');
      toast.error(typedError.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
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
          <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Error</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Toaster position="top-right" richColors />
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()} // Go back to previous page (likely details)
          aria-label="Go Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Edit Bus</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Bus Details</CardTitle>
            <CardDescription>Update the information for bus {formData.busNumber}.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1 */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="busNumber">
                  Bus Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="busNumber"
                  name="busNumber"
                  value={formData.busNumber}
                  onChange={handleChange}
                  required
                  disabled={loading || initialLoading}
                />
              </div>
              <div>
                <Label htmlFor="model">
                  Model <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                  disabled={loading || initialLoading}
                />
              </div>
              <div>
                <Label htmlFor="licensePlate">
                  License Plate <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="licensePlate"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleChange}
                  required
                  disabled={loading || initialLoading}
                />
              </div>
              <div>
                <Label htmlFor="capacity">
                  Capacity <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                  min="1"
                  disabled={loading || initialLoading}
                />
              </div>
              <div>
                <Label htmlFor="year">
                  Year <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  disabled={loading || initialLoading}
                />
              </div>
              <div>
                <Label htmlFor="driver_id">Assign Driver</Label>
                <Select
                  name="driver_id"
                  value={formData.driver_id}
                  onValueChange={value => handleSelectChange('driver_id', value)}
                  disabled={loading || initialLoading}
                >
                  <SelectTrigger id="driver_id">
                    <SelectValue placeholder="Select a driver (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">-- Unassigned --</SelectItem>
                    {drivers.map(driver => (
                      <SelectItem key={driver._id} value={driver._id}>
                        {driver.name}
                      </SelectItem>
                    ))}
                    {drivers.length === 0 && (
                      <SelectItem value="NO_DRIVERS" disabled>
                        No active drivers found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="campusRoute">Campus Route</Label>
                <Input
                  id="campusRoute"
                  name="campusRoute"
                  value={formData.campusRoute}
                  onChange={handleChange}
                  placeholder="e.g., Route A"
                  disabled={loading || initialLoading}
                />
              </div>
            </div>
            {/* Column 2 */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  name="status"
                  value={formData.status}
                  onValueChange={value => handleSelectChange('status', value)}
                  disabled={loading || initialLoading}
                  required
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fuelType">
                  Fuel Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  name="fuelType"
                  value={formData.fuelType}
                  onValueChange={value => handleSelectChange('fuelType', value)}
                  disabled={loading || initialLoading}
                  required
                >
                  <SelectTrigger id="fuelType">
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="gasoline">Gasoline</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="cng">CNG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional notes..."
                  disabled={loading || initialLoading}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="trackingDeviceId">Tracking Device ID</Label>
                <Input
                  id="trackingDeviceId"
                  name="trackingDeviceId"
                  value={formData.trackingDeviceId}
                  onChange={handleChange}
                  placeholder="Optional tracker ID"
                  disabled={loading || initialLoading}
                />
              </div>
              <div>
                <Label htmlFor="operatingHours">Operating Hours</Label>
                <Input
                  id="operatingHours"
                  name="operatingHours"
                  value={formData.operatingHours}
                  onChange={handleChange}
                  placeholder="e.g., 7:00 AM - 9:00 PM"
                  disabled={loading || initialLoading}
                />
              </div>
              {/* Checkboxes */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isAccessible"
                    name="isAccessible"
                    checked={formData.isAccessible}
                    onCheckedChange={checked => handleCheckboxChange('isAccessible', checked)}
                    disabled={loading || initialLoading}
                  />
                  <Label htmlFor="isAccessible" className="cursor-pointer">
                    Wheelchair Accessible
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasWifi"
                    name="hasWifi"
                    checked={formData.hasWifi}
                    onCheckedChange={checked => handleCheckboxChange('hasWifi', checked)}
                    disabled={loading || initialLoading}
                  />
                  <Label htmlFor="hasWifi" className="cursor-pointer">
                    Has Wi-Fi
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasUSBCharging"
                    name="hasUSBCharging"
                    checked={formData.hasUSBCharging}
                    onCheckedChange={checked => handleCheckboxChange('hasUSBCharging', checked)}
                    disabled={loading || initialLoading}
                  />
                  <Label htmlFor="hasUSBCharging" className="cursor-pointer">
                    Has USB Charging
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="weekendService"
                    name="weekendService"
                    checked={formData.weekendService}
                    onCheckedChange={checked => handleCheckboxChange('weekendService', checked)}
                    disabled={loading || initialLoading}
                  />
                  <Label htmlFor="weekendService" className="cursor-pointer">
                    Weekend Service
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || initialLoading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
