'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Toaster, toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';

// Interface for API responses
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  users?: T[];
  bus?: unknown;
}

// Interface for driver/student data for dropdowns
interface UserInfo {
  _id: string;
  name: string;
}

export default function AddNewBus() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    busNumber: '',
    model: '',
    capacity: '',
    licensePlate: '',
    year: '',
    status: 'active', // Default status
    fuelType: 'diesel', // Default fuel type
    driver_id: '',
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
  const [fetchingUsers, setFetchingUsers] = useState(true);

  // Fetch drivers (and students if needed)
  useEffect(() => {
    const fetchUsers = async () => {
      setFetchingUsers(true);
      try {
        // Fetch Drivers
        const driverRes = await fetchWithAdminAuth('/admin/users?role=driver&isActive=true');
        if (!driverRes.ok) throw new Error('Failed to fetch drivers');
        const driverData = await driverRes.json();
        setDrivers(driverData.users || []);

        // Fetch Students
      } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error('Failed to load user data');
        toast.error(typedError.message || 'Failed to load user data for selection.');
      } finally {
        setFetchingUsers(false);
      }
    };
    fetchUsers();
  }, []);

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

    // Prepare data for API (ensure correct types)
    const payload = {
      ...formData,
      capacity: formData.capacity ? parseInt(formData.capacity, 10) : undefined,
      year: formData.year ? parseInt(formData.year, 10) : undefined,
      // Convert "__NONE__" back to null for the API
      driver_id: formData.driver_id === '__NONE__' ? null : formData.driver_id || null,
    };

    try {
      const response = await fetchWithAdminAuth('/admin/bus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create bus');
      }

      toast.success(`Bus ${result.bus.busNumber} created successfully!`);
      router.push('/admin/buses'); // Redirect to bus list on success
    } catch (error: unknown) {
      const typedError = error instanceof Error ? error : new Error('An unexpected error occurred');
      toast.error(typedError.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Toaster position="top-right" richColors />
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Add New Bus</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Bus Details</CardTitle>
            <CardDescription>Enter the information for the new bus.</CardDescription>
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="driver_id">Assign Driver</Label>
                <Select
                  name="driver_id"
                  value={formData.driver_id}
                  onValueChange={value => handleSelectChange('driver_id', value)}
                  disabled={loading || fetchingUsers}
                >
                  <SelectTrigger id="driver_id">
                    <SelectValue
                      placeholder={
                        fetchingUsers ? 'Loading drivers...' : 'Select a driver (optional)'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">-- Unassigned --</SelectItem>
                    {drivers.length > 0 ? (
                      drivers.map(driver => (
                        <SelectItem key={driver._id} value={driver._id}>
                          {driver.name}
                        </SelectItem>
                      ))
                    ) : (
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
                  placeholder="e.g., Route A, North Campus Loop"
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                    <SelectItem value="cng">CNG (Compressed Natural Gas)</SelectItem>
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
                  placeholder="Any additional notes about the bus..."
                  disabled={loading}
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
                  placeholder="Optional ID for GPS tracker"
                  disabled={loading}
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
                  disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
                  />
                  <Label htmlFor="hasUSBCharging" className="cursor-pointer">
                    Has USB Charging Ports
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="weekendService"
                    name="weekendService"
                    checked={formData.weekendService}
                    onCheckedChange={checked => handleCheckboxChange('weekendService', checked)}
                    disabled={loading}
                  />
                  <Label htmlFor="weekendService" className="cursor-pointer">
                    Provides Weekend Service
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
            <Button type="submit" disabled={loading || fetchingUsers}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                'Create Bus'
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
