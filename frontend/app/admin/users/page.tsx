'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AssignBusDialog from '@/app/admin/users/AssignBusDialog';

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
import { Badge } from '@/components/ui/badge';
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
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Plus,
  Loader2,
  ArrowLeft,
  Bus,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// User interface based on the backend model
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'driver' | 'student';
  createdAt: string;
  phone?: string;
  isActive: boolean;
  profilePicture?: string;
}

export default function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<keyof Omit<User, '_id'> | '_id'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // State for delete confirmation dialog
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // Loading state for delete action
const [assignDialogOpen, setAssignDialogOpen] = useState(false);
const [selectedStudent, setSelectedStudent] = useState<{ _id: string; name: string } | null>(null);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);

        // Remove the /api prefix since it's already included in the backend route
        const response = await fetchWithAdminAuth('/admin/users');

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch users: ${response.status}`);
        }

        const data = await response.json();

        // Check if users array exists in the response
        if (data.users && Array.isArray(data.users)) {
          setUsers(data.users);
          setFilteredUsers(data.users);
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (err) {
        toast.error(
          typeof err === 'object' && err !== null && 'message' in err
            ? String(err.message)
            : 'Failed to load users. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let result = [...users];

    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        user =>
          user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search)
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      result = result.filter(user => user.isActive === isActive);
    }

    // Apply sorting
    result = result.sort((a, b) => {
      // Handle potential null/undefined values if necessary for sorting fields
      const fieldA = a[sortField] ?? '';
      const fieldB = b[sortField] ?? '';

      if (sortField === 'name' || sortField === 'email' || sortField === 'role') {
        const aValue = String(fieldA).toLowerCase();
        const bValue = String(fieldB).toLowerCase();

        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      }

      // For date fields
      if (sortField === 'createdAt') {
        const aDate = new Date(String(fieldA)).getTime();
        const bDate = new Date(String(fieldB)).getTime();

        if (sortDirection === 'asc') {
          return aDate - bDate;
        } else {
          return bDate - aDate;
        }
      }

      return 0;
    });

    // Log the filtered and sorted users before setting state (for debugging if needed)

    // console.log('Applying filters/sort, result:', result);
    setFilteredUsers(result);
  }, [users, searchTerm, roleFilter, statusFilter, sortField, sortDirection]);

  // Handle sorting
  const handleSort = (field: keyof Omit<User, '_id'> | '_id') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle user activation/deactivation
  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetchWithAdminAuth(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to update user status');
      }

      if (data.success || response.ok) {
        setUsers(prevUsers => {
          const updatedUsers = prevUsers.map(user =>
            user._id === userId ? { ...user, isActive: !currentStatus } : user
          );
          return updatedUsers;
        });
        toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully.`);
      } else {
        throw new Error(data.message || 'Failed to update user status (unknown error)');
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update user status. Please try again.';
      toast.error(errorMessage);
    }
  };

  // Prepare for deletion by opening the dialog
  const initiateDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsAlertOpen(true);
  };

  // Perform the actual deletion after confirmation
  const performDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetchWithAdminAuth(`/admin/users/${userToDelete._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Failed to delete user');
      }

      setUsers(users.filter(user => user._id !== userToDelete._id));
      toast.success(`User ${userToDelete.name} deleted successfully.`);
      setIsAlertOpen(false);
      setUserToDelete(null);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete user. Please try again.';
      toast.error(errorMessage);
      setIsAlertOpen(false);
      setUserToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Render role badge with appropriate color
  const renderRoleBadge = (role: string) => {
    let variant: 'default' | 'destructive' | 'secondary' | 'outline' = 'outline';

    switch (role) {
      case 'admin':
        variant = 'destructive';
        break;
      case 'driver':
        variant = 'default';
        break;
      case 'student':
        variant = 'secondary';
        break;
    }

    return <Badge variant={variant}>{role}</Badge>;
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
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage all users of the bus tracking system.</p>
          </div>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin/users/new">
            <Plus className="h-4 w-4" />
            Add New User
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Roles</SelectLabel>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

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
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
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

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `Total: ${filteredUsers.length} users`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[100px] sm:table-cell">
                    <span className="sr-only">Image</span>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      Name
                      {sortField === 'name' &&
                        (sortDirection === 'asc' ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="hidden md:table-cell cursor-pointer"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-1">
                      Email
                      {sortField === 'email' &&
                        (sortDirection === 'asc' ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="hidden md:table-cell cursor-pointer"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center gap-1">
                      Role
                      {sortField === 'role' &&
                        (sortDirection === 'asc' ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead
                    className="hidden sm:table-cell cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-1">
                      Created At
                      {sortField === 'createdAt' &&
                        (sortDirection === 'asc' ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow key="loading-row">
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow key="empty-row">
                    <TableCell colSpan={7} className="h-24 text-center">
                      No users found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers
                    .filter(user => user && typeof user === 'object' && user._id)
                    .map(user => {
                      return (
                        <TableRow
                          key={user._id}
                          className="hover:bg-muted/50 data-[state=selected]:bg-muted odd:bg-white even:bg-slate-50 dark:odd:bg-slate-950 dark:even:bg-slate-900"
                        >
                          <TableCell className="hidden sm:table-cell">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={user.profilePicture || undefined} alt={user.name} />
                              <AvatarFallback>
                                {user.name?.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {renderRoleBadge(user.role)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
                              ></span>
                              <span>{user.isActive ? 'Active' : 'Inactive'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>

                                {user.role === 'student' && (
  <DropdownMenuItem
    onClick={() => {
      setSelectedStudent({ _id: user._id, name: user.name });
      setAssignDialogOpen(true);
    }}
    className="cursor-pointer"
  >
    <Bus className="mr-2 h-4 w-4" /> Assign to Bus
  </DropdownMenuItem>
)}

                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => router.push(`/admin/users/${user._id}`)}
                                  className="cursor-pointer"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  <span>View Details</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/admin/users/${user._id}/edit`)}
                                  className="cursor-pointer"
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Edit User</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleActive(user._id, user.isActive)}
                                  className="cursor-pointer"
                                >
                                  {user.isActive ? (
                                    <UserX className="mr-2 h-4 w-4" />
                                  ) : (
                                    <UserCheck className="mr-2 h-4 w-4" />
                                  )}
                                  <span>{user.isActive ? 'Deactivate' : 'Activate'}</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => initiateDeleteUser(user)}
                                  className="text-destructive focus:text-destructive cursor-pointer"
                                >
                                  {isDeleting && userToDelete?._id === user._id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="mr-2 h-4 w-4" />
                                  )}
                                  <span>Delete User</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AssignBusDialog
  open={assignDialogOpen}
  onOpenChange={setAssignDialogOpen}
  student={selectedStudent}
/>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              <span className="font-semibold">
                {' '}
                {userToDelete?.name} ({userToDelete?.email})
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={performDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
