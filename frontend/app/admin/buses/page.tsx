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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  User as UserIcon,
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
  assignedStudentIds?: string[];
  createdAt: string;
}
interface Student {
  _id: string;
  name: string;
}

export default function BusManagement() {
  const router = useRouter();

  // state
  const [buses, setBuses] = useState<Bus[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredBuses, setFilteredBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<keyof Omit<Bus, 'driver'> | 'driver_id' | '_id'>('busNumber');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // delete dialog
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [busToDelete, setBusToDelete] = useState<Bus | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // status toggle spinner
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);

  // assign‐students dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [busToAssign, setBusToAssign] = useState<Bus | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // load buses + students
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [bRes, sRes] = await Promise.all([
          fetchWithAdminAuth('/admin/buses'),
          fetchWithAdminAuth('/admin/users?role=student'),
        ]);
        if (!bRes.ok || !sRes.ok) throw new Error('Failed to load buses or students');
        const { buses } = await bRes.json();
        const { users: students } = await sRes.json();
        setBuses(buses);
        setStudents(students);
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // filtering/sorting
  useEffect(() => {
    let result = [...buses];
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(b =>
        b.busNumber.toLowerCase().includes(s) ||
        b.model.toLowerCase().includes(s) ||
        b.licensePlate.toLowerCase().includes(s)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }
    result.sort((a, b) => {
      const aVal = sortField === 'driver_id' ? a.driver_id?.name : (a as any)[sortField];
      const bVal = sortField === 'driver_id' ? b.driver_id?.name : (b as any)[sortField];
      let cmp = 0;
      if (typeof aVal === 'number') cmp = aVal - (bVal as number);
      else cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''));
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    setFilteredBuses(result);
  }, [buses, searchTerm, statusFilter, sortField, sortDirection]);

  const handleSort = (field: keyof Bus | 'driver_id' | '_id') => {
    if (field === sortField) setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // delete
  const initiateDeleteBus = (bus: Bus) => {
    setBusToDelete(bus);
    setIsAlertOpen(true);
  };
  const performDeleteBus = async () => {
    if (!busToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetchWithAdminAuth(`/admin/bus/${busToDelete._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setBuses(bs => bs.filter(b => b._id !== busToDelete._id));
      toast.success('Deleted');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsDeleting(false);
      setIsAlertOpen(false);
      setBusToDelete(null);
    }
  };

  // status toggle
  const handleToggleStatus = async (bus: Bus) => {
    if (!['active','inactive'].includes(bus.status)) {
      return toast.warning(`Cannot toggle from ${bus.status}`);
    }
    const next = bus.status === 'active' ? 'inactive' : 'active';
    setTogglingStatusId(bus._id);
    try {
      const res = await fetchWithAdminAuth(`/admin/bus/${bus._id}`, {
        method: 'PUT',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error('Status update failed');
      setBuses(bs => bs.map(b => b._id===bus._id ? { ...b, status: next } : b));
      toast.success(`Now ${next}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setTogglingStatusId(null);
    }
  };

  // open assign dialog
  const openAssign = (bus: Bus) => {
    setBusToAssign(bus);
    setSelectedStudents(bus.assignedStudentIds || []);
    setAssignDialogOpen(true);
  };
  // save assignment
  const saveAssign = async () => {
    if (!busToAssign) return;
    setIsAssigning(true);
    try {
      const res = await fetchWithAdminAuth(`/admin/bus/${busToAssign._id}`, {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ assignedStudentIds: selectedStudents }),
      });
      if (!res.ok) throw new Error('Assign failed');
      setBuses(bs => bs.map(b =>
        b._id===busToAssign._id
          ? { ...b, assignedStudentIds: selectedStudents }
          : b
      ));
      toast.success('Assigned!');
      setAssignDialogOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsAssigning(false);
    }
  };

  // status badge helper
  const renderStatusDot = (status:string) => {
    const map:{[k:string]:string[]} = {
      active:['bg-green-500','Active'],
      inactive:['bg-yellow-500','Inactive'],
      maintenance:['bg-orange-500','Maintenance'],
      retired:['bg-red-500','Retired'],
    };
    const [dot,text] = map[status]||['bg-gray-400',status];
    return (
      <span className={cn(dot,'inline-block h-2 w-2 rounded-full mr-1')} />
      /* plus text if desired */
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">
      <Loader2 className="animate-spin h-10 w-10 text-primary" />
    </div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Toaster position="top-right" richColors />

      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={()=>router.push('/admin')}><ArrowLeft/></Button>
          <div>
            <h1 className="text-3xl font-bold">Bus Management</h1>
            <p className="text-muted-foreground">Manage all buses in the system.</p>
          </div>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin/buses/new"><Plus/>Add New Bus</Link>
        </Button>
      </div>

      {/* filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search buses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search #, model, plate…"
                value={searchTerm}
                onChange={e=>setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Status"/></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Status</SelectLabel>
                  {['all','active','inactive','maintenance','retired'].map(s=>(
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }} className="gap-2">
              <RefreshCw/>Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* table */}
      <Card>
        <CardHeader>
          <CardTitle>Buses</CardTitle>
          <CardDescription>
            {`Total: ${filteredBuses.length} buses`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={()=>handleSort('busNumber')}>
                    Bus# {sortField==='busNumber'? (sortDirection==='asc'?<ArrowUp/>:<ArrowDown/>):null}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Model</TableHead>
                  <TableHead className="hidden lg:table-cell">Plate</TableHead>
                  <TableHead className="hidden sm:table-cell">Cap</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Driver</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuses.map(bus=>(
                  <TableRow key={bus._id} className="hover:bg-muted/50">
                    <TableCell>{bus.busNumber}</TableCell>
                    <TableCell className="hidden md:table-cell">{bus.model}</TableCell>
                    <TableCell className="hidden lg:table-cell">{bus.licensePlate}</TableCell>
                    <TableCell className="hidden sm:table-cell">{bus.capacity}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {renderStatusDot(bus.status)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {bus.driver_id?.name || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" disabled={togglingStatusId===bus._id}>
                            {togglingStatusId===bus._id? <Loader2 className="animate-spin h-4 w-4"/> : <MoreHorizontal/>}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator/>
                          <DropdownMenuItem onClick={()=>router.push(`/admin/buses/${bus._id}`)}>
                            <Eye className="mr-2 h-4 w-4"/>View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={()=>router.push(`/admin/buses/${bus._id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4"/>Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={()=>openAssign(bus)}>
                            <UserIcon className="mr-2 h-4 w-4"/>Assign Students
                          </DropdownMenuItem>
                          {(bus.status==='active'||bus.status==='inactive') && (
                            <DropdownMenuItem onClick={()=>handleToggleStatus(bus)}>
                              {bus.status==='active'?<PowerOff className="mr-2 h-4 w-4"/>:<Power className="mr-2 h-4 w-4"/>}
                              {bus.status==='active'?'Deactivate':'Activate'}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator/>
                          <DropdownMenuItem onClick={()=>initiateDeleteBus(bus)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4"/>Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* delete dialog */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete bus&nbsp;
              <strong>{busToDelete?.busNumber}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={performDeleteBus}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground"
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* assign students dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={()=>setAssignDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Students to {busToAssign?.busNumber}</DialogTitle>
          </DialogHeader>
          <div>
            <label className="block mb-2 font-medium">Students</label>
            <select
              multiple
              className="w-full border rounded p-2"
              value={selectedStudents}
              onChange={e => {
                const options = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedStudents(options);
              }}
              size={Math.min(8, students.length)}
            >
              {students.map(s => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={()=>setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveAssign} disabled={isAssigning}>
              {isAssigning?'Saving…':'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
