'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { fetchWithAdminAuth } from '@/lib/adminAuth';
import {
  Search,
  Plus,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Loader2,
  ArrowLeft,
  Power,
  PowerOff,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DriverInfo {
  _id: string;
  name: string;
}
interface Bus {
  _id: string;
  busNumber: string;
  model: string;
  capacity: number;
  licensePlate: string;
  year: number;
  status: 'active' | 'maintenance' | 'retired' | 'inactive';
  driver_id?: DriverInfo | null;
  createdAt: string;
}

export default function BusManagement() {
  const router = useRouter();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [filteredBuses, setFilteredBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<keyof Omit<Bus, 'driver'> | 'driver_id' | '_id'>(
    'busNumber'
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [busToDelete, setBusToDelete] = useState<Bus | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        setLoading(true);

        const response = await fetchWithAdminAuth('/admin/buses');

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch buses: ${response.status}`);
        }

        const data = await response.json();

        if (data.buses && Array.isArray(data.buses)) {
          setBuses(data.buses);
          setFilteredBuses(data.buses);
        } else if (Array.isArray(data)) {
          setBuses(data);
          setFilteredBuses(data);
        } else {
          // eslint-disable-next-line no-undef
          console.error('Invalid response format for buses:', data);
          throw new Error('Invalid response format from server');
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'An unexpected error occurred';

        // eslint-disable-next-line no-undef
        console.error('Error fetching buses:', error);
        toast.error(errorMessage || 'Failed to load buses. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();
  }, []);

  useEffect(() => {
    let result = [...buses];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        bus =>
          bus.busNumber.toLowerCase().includes(search) ||
          bus.model.toLowerCase().includes(search) ||
          bus.licensePlate.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(bus => bus.status === statusFilter);
    }

    result = result.sort((a, b) => {
      const valA = sortField === 'driver_id' ? a.driver_id?.name : a[sortField];
      const valB = sortField === 'driver_id' ? b.driver_id?.name : b[sortField];

      let comparison = 0;
      if (
        sortField === 'busNumber' ||
        sortField === 'model' ||
        sortField === 'licensePlate' ||
        sortField === 'status' ||
        sortField === 'driver_id'
      ) {
        comparison = String(valA ?? '').localeCompare(String(valB ?? ''));
      } else if (sortField === 'capacity' || sortField === 'year') {
        comparison = Number(valA ?? 0) - Number(valB ?? 0);
      } else if (sortField === 'createdAt') {
        comparison = new Date(String(valA ?? 0)).getTime() - new Date(String(valB ?? 0)).getTime();
      }

      return sortDirection === 'asc' ? comparison : comparison * -1;
    });

    setFilteredBuses(result);
  }, [buses, searchTerm, statusFilter, sortField, sortDirection]);

  const handleSort = (field: keyof Omit<Bus, 'driver'> | 'driver_id' | '_id') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field as keyof Bus | '_id');
      setSortDirection('asc');
    }
  };

  const initiateDeleteBus = (bus: Bus) => {
    setBusToDelete(bus);
    setIsAlertOpen(true);
  };

  const performDeleteBus = async () => {
    if (!busToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetchWithAdminAuth(`/admin/bus/${busToDelete._id}`, {
        method: 'DELETE',
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to delete bus');
      }

      setBuses(prevBuses => prevBuses.filter(bus => bus._id !== busToDelete._id));
      toast.success(`Bus ${busToDelete.busNumber} deleted succe
      const err = err instanceof Error ? err : new Error('An unexpected error occurred');
      ssfully.`);
      setIsAlertOpen(false);
      setBusToDelete(null);
    } catch (error: unknown) {
      // eslint-disable-next-line no-undef
      console.error('Error deleting bus:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete bus. Please try again.'
      );
      setIsAlertOpen(false);
      setBusToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderStatusDot = (status: string) => {
    let dotColor = 'bg-gray-400';
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

  const handleToggleStatus = async (busToToggle: Bus) => {
    if (!busToToggle) return;

    const currentStatus = busToToggle.status;

    if (currentStatus !== 'active' && currentStatus !== 'inactive') {
      toast.warning(`Cannot change status from ${currentStatus}.`);
      return;
    }

    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? 'Activating' : 'Deactivating';

    setTogglingStatusId(busToToggle._id);
    try {
      const response = await fetchWithAdminAuth(`/admin/bus/${busToToggle._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${actionText.toLowerCase()} bus`);
      }

      setBuses(prevBuses =>
        prevBuses.map(bus => (bus._id === busToToggle._id ? { ...bus, status: newStatus } : bus))
      );

      toast.success(
        `Bus ${busToToggle.busNumber} successfully ${newStatus === 'active' ? 'activated' : 'deactivated'}.`
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

      // eslint-disable-next-line no-undef
      console.error(`Error ${actionText.toLowerCase()} bus:`, error);
      toast.error(errorMessage || `Failed to ${actionText.toLowerCase()} bus.`);
    } finally {
      setTogglingStatusId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Toaster position="top-right" richColors />
      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin')}
            aria-label="Go to Admin Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Bus Management</h1>
            <p className="text-muted-foreground">Manage all buses in the system.</p>
          </div>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin/buses/new">
            <Plus className="h-4 w-4" />
            Add New Bus
          </Link>
        </Button>
      </div>

      {/* Filter Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search buses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by number, model, plate..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Status</SelectLabel>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bus Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Buses</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `Total: ${filteredBuses.length} buses`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('busNumber')}>
                    Bus Number{' '}
                    {sortField === 'busNumber' &&
                      (sortDirection === 'asc' ? (
                        <ArrowUp className="inline h-4 w-4" />
                      ) : (
                        <ArrowDown className="inline h-4 w-4" />
                      ))}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hidden md:table-cell"
                    onClick={() => handleSort('model')}
                  >
                    Model{' '}
                    {sortField === 'model' &&
                      (sortDirection === 'asc' ? (
                        <ArrowUp className="inline h-4 w-4" />
                      ) : (
                        <ArrowDown className="inline h-4 w-4" />
                      ))}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hidden lg:table-cell"
                    onClick={() => handleSort('licensePlate')}
                  >
                    License Plate{' '}
                    {sortField === 'licensePlate' &&
                      (sortDirection === 'asc' ? (
                        <ArrowUp className="inline h-4 w-4" />
                      ) : (
                        <ArrowDown className="inline h-4 w-4" />
                      ))}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hidden sm:table-cell"
                    onClick={() => handleSort('capacity')}
                  >
                    Capacity{' '}
                    {sortField === 'capacity' &&
                      (sortDirection === 'asc' ? (
                        <ArrowUp className="inline h-4 w-4" />
                      ) : (
                        <ArrowDown className="inline h-4 w-4" />
                      ))}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hidden md:table-cell"
                    onClick={() => handleSort('status')}
                  >
                    Status{' '}
                    {sortField === 'status' &&
                      (sortDirection === 'asc' ? (
                        <ArrowUp className="inline h-4 w-4" />
                      ) : (
                        <ArrowDown className="inline h-4 w-4" />
                      ))}
                  </TableHead>

                  <TableHead
                    className="cursor-pointer hidden lg:table-cell"
                    onClick={() => handleSort('driver_id')}
                  >
                    Driver{' '}
                    {sortField === 'driver_id' &&
                      (sortDirection === 'asc' ? (
                        <ArrowUp className="inline h-4 w-4" />
                      ) : (
                        <ArrowDown className="inline h-4 w-4" />
                      ))}
                  </TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {' '}
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredBuses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {' '}
                      No buses found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBuses
                    .filter(bus => bus && typeof bus === 'object' && bus._id)
                    .map(bus => (
                      <TableRow
                        key={bus._id}
                        className="hover:bg-muted/50 odd:bg-white even:bg-slate-50 dark:odd:bg-slate-950 dark:even:bg-slate-900"
                      >
                        <TableCell className="font-medium py-3 px-4">{bus.busNumber}</TableCell>
                        <TableCell className="hidden md:table-cell py-3 px-4">
                          {bus.model}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell py-3 px-4">
                          {bus.licensePlate}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell py-3 px-4">
                          {bus.capacity}
                        </TableCell>
                        <TableCell className="hidden md:table-cell py-3 px-4">
                          {renderStatusDot(bus.status)}
                        </TableCell>

                        <TableCell className="hidden lg:table-cell py-3 px-4">
                          {bus.driver_id?.name || 'Unassigned'}
                        </TableCell>
                        <TableCell className="text-right py-2 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                aria-haspopup="true"
                                size="icon"
                                variant="ghost"
                                disabled={togglingStatusId === bus._id}
                              >
                                {togglingStatusId === bus._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => router.push(`/admin/buses/${bus._id}`)}
                                className="cursor-pointer"
                              >
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/admin/buses/${bus._id}/edit`)}
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit Bus
                              </DropdownMenuItem>

                              {(bus.status === 'active' || bus.status === 'inactive') && (
                                <DropdownMenuItem
                                  onClick={() => handleToggleStatus(bus)}
                                  className="cursor-pointer"
                                  disabled={togglingStatusId === bus._id}
                                >
                                  {bus.status === 'active' ? (
                                    <>
                                      <PowerOff className="mr-2 h-4 w-4" /> Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <Power className="mr-2 h-4 w-4" /> Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => initiateDeleteBus(bus)}
                                className="text-destructive focus:text-destructive cursor-pointer"
                              >
                                {isDeleting && busToDelete?._id === bus._id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="mr-2 h-4 w-4" />
                                )}{' '}
                                Delete Bus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the bus{' '}
              <span className="font-semibold">
                {busToDelete?.busNumber} ({busToDelete?.licensePlate})
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={performDeleteBus}
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
