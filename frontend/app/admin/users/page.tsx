'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AssignBusDialog from '@/app/admin/users/AssignBusDialog';
import { motion, AnimatePresence } from "framer-motion";

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
  Users,
  Filter,
  UserCog,
  Shield,
  GraduationCap,
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{ _id: string; name: string } | null>(null);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetchWithAdminAuth('/admin/users');

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch users: ${response.status}`);
        }

        const data = await response.json();

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

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        user =>
          user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search)
      );
    }

    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      result = result.filter(user => user.isActive === isActive);
    }

    result = result.sort((a, b) => {
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
    const roleConfig = {
      admin: { variant: 'destructive' as const, icon: Shield, color: 'from-red-500 to-red-600' },
      driver: { variant: 'default' as const, icon: UserCog, color: 'from-blue-500 to-blue-600' },
      student: { variant: 'secondary' as const, icon: GraduationCap, color: 'from-green-500 to-green-600' }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.student;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1 capitalize">
        <IconComponent className="w-3 h-3" />
        {role}
      </Badge>
    );
  };

  // Get user stats
  const userStats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    admins: users.filter(u => u.role === 'admin').length,
    drivers: users.filter(u => u.role === 'driver').length,
    students: users.filter(u => u.role === 'student').length,
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-muted-foreground">Loading Users...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <Toaster position="top-right" richColors />
      
      {/* Header Section */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="p-6">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex justify-between items-center"
          >
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push('/admin')}
                className="rounded-full hover:scale-110 transition-transform"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  User Management
                </h1>
                <p className="text-muted-foreground mt-2">Manage all users in your system</p>
              </div>
            </div>
            <Button asChild className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all shadow-lg">
              <Link href="/admin/users/new" className="gap-2">
                <Plus className="h-4 w-4" />
                Add New User
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <Card className="rounded-2xl shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 hover:shadow-xl transition-all">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{userStats.total}</div>
                <div className="text-xs text-muted-foreground">Total Users</div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <Card className="rounded-2xl shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 hover:shadow-xl transition-all">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{userStats.active}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <Card className="rounded-2xl shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 hover:shadow-xl transition-all">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{userStats.admins}</div>
                <div className="text-xs text-muted-foreground">Admins</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <Card className="rounded-2xl shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 hover:shadow-xl transition-all">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{userStats.drivers}</div>
                <div className="text-xs text-muted-foreground">Drivers</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
            <Card className="rounded-2xl shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 hover:shadow-xl transition-all">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{userStats.students}</div>
                <div className="text-xs text-muted-foreground">Students</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters Card */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
          <Card className="rounded-3xl shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-purple-500" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 rounded-2xl border-0 bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-primary"
                  />
                </div>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full md:w-[180px] rounded-2xl border-0 bg-slate-50 dark:bg-slate-700">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
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
                  <SelectTrigger className="w-full md:w-[180px] rounded-2xl border-0 bg-slate-50 dark:bg-slate-700">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
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
                  className="rounded-2xl gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Users Table */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
          <Card className="rounded-3xl shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-5 w-5 text-green-500" />
                Users Directory
              </CardTitle>
              <CardDescription>
                {`Showing ${filteredUsers.length} of ${users.length} users`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-800">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="hidden w-[80px] sm:table-cell">Avatar</TableHead>
                      <TableHead className="cursor-pointer font-semibold" onClick={() => handleSort('name')}>
                        <div className="flex items-center gap-1">
                          Name
                          {sortField === 'name' &&
                            (sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                        </div>
                      </TableHead>
                      <TableHead className="hidden md:table-cell cursor-pointer font-semibold" onClick={() => handleSort('email')}>
                        <div className="flex items-center gap-1">
                          Email
                          {sortField === 'email' &&
                            (sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                        </div>
                      </TableHead>
                      <TableHead className="hidden md:table-cell cursor-pointer font-semibold" onClick={() => handleSort('role')}>
                        <div className="flex items-center gap-1">
                          Role
                          {sortField === 'role' &&
                            (sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                        </div>
                      </TableHead>
                      <TableHead className="hidden md:table-cell font-semibold">Status</TableHead>
                      <TableHead className="hidden sm:table-cell cursor-pointer font-semibold" onClick={() => handleSort('createdAt')}>
                        <div className="flex items-center gap-1">
                          Created
                          {sortField === 'createdAt' &&
                            (sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                        </div>
                      </TableHead>
                      <TableHead className="w-[100px] text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Users className="h-12 w-12 opacity-50" />
                            <p>No users found matching your criteria.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers
                        .filter(user => user && typeof user === 'object' && user._id)
                        .map((user, index) => (
                          <motion.tr
                            key={user._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <TableCell className="hidden sm:table-cell">
                              <Avatar className="h-10 w-10 ring-2 ring-slate-200 dark:ring-slate-700">
                                <AvatarImage src={user.profilePicture || undefined} alt={user.name} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                  {user.name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">{user.email}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              {renderRoleBadge(user.role)}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                <span className={user.isActive ? 'text-green-600 font-medium' : 'text-gray-500'}>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="ghost" className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl">
                                  <DropdownMenuLabel className="font-semibold">Quick Actions</DropdownMenuLabel>
                                  
                                  {user.role === 'student' && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedStudent({ _id: user._id, name: user.name });
                                        setAssignDialogOpen(true);
                                      }}
                                      className="cursor-pointer gap-2"
                                    >
                                      <Bus className="h-4 w-4 text-blue-500" /> Assign to Bus
                                    </DropdownMenuItem>
                                  )}

                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/admin/users/${user._id}`)}
                                    className="cursor-pointer gap-2"
                                  >
                                    <Eye className="h-4 w-4 text-green-500" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/admin/users/${user._id}/edit`)}
                                    className="cursor-pointer gap-2"
                                  >
                                    <Edit className="h-4 w-4 text-blue-500" />
                                    Edit User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleToggleActive(user._id, user.isActive)}
                                    className="cursor-pointer gap-2"
                                  >
                                    {user.isActive ? (
                                      <UserX className="h-4 w-4 text-orange-500" />
                                    ) : (
                                      <UserCheck className="h-4 w-4 text-green-500" />
                                    )}
                                    {user.isActive ? 'Deactivate' : 'Activate'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => initiateDeleteUser(user)}
                                    className="text-red-600 focus:text-red-600 cursor-pointer gap-2"
                                  >
                                    {isDeleting && userToDelete?._id === user._id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </motion.tr>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Assign Bus Dialog */}
      <AssignBusDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        student={selectedStudent}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Delete User</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              This action cannot be undone. This will permanently delete
              <span className="font-semibold text-red-600">
                {' '}{userToDelete?.name} ({userToDelete?.email})
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel disabled={isDeleting} className="rounded-2xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={performDeleteUser}
              disabled={isDeleting}
              className="rounded-2xl bg-red-600 hover:bg-red-700"
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