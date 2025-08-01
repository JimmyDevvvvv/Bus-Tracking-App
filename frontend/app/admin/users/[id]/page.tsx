'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { fetchWithAdminAuth } from '@/lib/adminAuth';
import {
  ArrowLeft,
  Edit,
  Loader2,
  Trash2,
  AlertCircle,
  Mail,
  Phone as PhoneIcon,
  CalendarDays,
  User as UserIcon,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Toaster, toast } from 'sonner';

// User interface matching backend model (ensure consistency)
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'driver' | 'student';
  isActive: boolean;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  profilePicture?: string;
  lastLogin?: string;
  // Add role-specific fields if needed for display
  licenseNumber?: string;
  assignedBusId?: { _id: string; busNumber: string }; // Populate if showing assigned bus
  studentId?: string;
  grade?: string;
}

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string | undefined;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId || typeof userId !== 'string') {
        setError('User ID is missing or invalid.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        // Use the correct endpoint from Admin.js
        const response = await fetchWithAdminAuth(`/admin/users/${userId}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch user details');
        }

        const data = await response.json();
        if (!data.user || !data.user._id) {
          throw new Error('Fetched user data is invalid or missing ID');
        }
        setUser(data.user);
      } catch (error: unknown) {
        const typedError =
          error instanceof Error ? error : new Error('An unexpected error occurred');
        setError(typedError.message || 'Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      // Ensure userId is truthy before fetching
      fetchUser();
    }
  }, [userId]);

  const handleDeleteUser = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      const response = await fetchWithAdminAuth(`/admin/users/${user._id}`, {
        method: 'DELETE',
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to delete user');
      }

      toast.success(`User ${user.name} deleted successfully.`);
      setIsAlertOpen(false);
      router.push('/admin/users'); // Redirect back to list after deletion
    } catch (error: unknown) {
      const typedError = error instanceof Error ? error : new Error('An unexpected error occurred');
      toast.error(typedError.message || 'Failed to delete user. Please try again.');
      setIsAlertOpen(false); // Close dialog on error too
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string = '') =>
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();

  // --- Render Loading/Error States ---
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-150px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/admin/users')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading User</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/admin/users')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>User Not Found</AlertTitle>
          <AlertDescription>The requested user could not be found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Toaster position="top-right" richColors />

      {/* Header Row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/users')}
            aria-label="Go Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">User Details</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/admin/users/${user._id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit User
          </Button>
          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete User
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the user
                  <strong>{user.name}</strong> and remove their data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Yes, delete user
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* User Info Card */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
          <Avatar className="h-16 w-16 border">
            <AvatarImage src={user.profilePicture} alt={user.name} />
            <AvatarFallback className="text-xl">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-2xl">{user.name}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="capitalize">
                <UserIcon className="mr-1 h-3 w-3" /> {user.role}
              </Badge>
              {user.isActive ? (
                <Badge
                  variant="outline"
                  className="border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/50 dark:text-green-300"
                >
                  <CheckCircle className="mr-1 h-3 w-3" /> Active
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="mr-1 h-3 w-3" /> Inactive
                </Badge>
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Separator className="my-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <a
                href={`mailto:${user.email}`}
                className="font-medium text-primary hover:underline break-all"
              >
                {user.email}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <PhoneIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Phone:</span>
              <span className="font-medium">{user.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Member Since:</span>
              <span className="font-medium">{format(new Date(user.createdAt), 'PPP')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Last Updated:</span>
              <span className="font-medium" title={format(new Date(user.updatedAt), 'Pp')}>
                {formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true })}
              </span>
            </div>
            {user.lastLogin && (
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Last Login:</span>
                <span className="font-medium" title={format(new Date(user.lastLogin), 'Pp')}>
                  {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>
        </CardContent>
        {/* Optional Footer */}
        {/* <CardFooter>
            <p>Optional footer information</p>
        </CardFooter> */}
      </Card>

      {/* Role-Specific Details Card (Example for Driver) */}
      {user.role === 'driver' && (
        <Card>
          <CardHeader>
            <CardTitle>Driver Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground min-w-[100px]">License No:</span>
              <span className="font-medium">{user.licenseNumber || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground min-w-[100px]">Assigned Bus:</span>
              {user.assignedBusId ? (
                <Link
                  href={`/admin/buses/${user.assignedBusId._id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {user.assignedBusId.busNumber || user.assignedBusId._id}
                </Link>
              ) : (
                <span className="font-medium italic text-muted-foreground">Not Assigned</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role-Specific Details Card (Example for Student) */}
      {user.role === 'student' && (
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground min-w-[100px]">Student ID:</span>
              <span className="font-medium">{user.studentId || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground min-w-[100px]">Grade:</span>
              <span className="font-medium">{user.grade || 'N/A'}</span>
            </div>
            {/* Add Parent Info, Pickup/Dropoff if needed */}
          </CardContent>
        </Card>
      )}

      {/* Add more cards for other details like Activity Log, Settings, etc. later */}
    </div>
  );
}
