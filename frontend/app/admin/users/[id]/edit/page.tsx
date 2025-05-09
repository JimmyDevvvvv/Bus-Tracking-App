'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { fetchWithAdminAuth } from '@/lib/adminAuth';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Toaster, toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' })
    .optional()
    .or(z.literal('')),
  role: z.enum(['admin', 'driver', 'student'], {
    required_error: 'Please select a role.',
  }),
  phone: z.string().optional(),
  isActive: z.boolean().default(true),

  licenseNumber: z.string().optional(),
  studentId: z.string().optional(),
  grade: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string | undefined;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialUserData, setInitialUserData] = useState<Partial<FormValues> | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: undefined,
      phone: '',
      isActive: true,
      licenseNumber: '',
      studentId: '',
      grade: '',
    },
  });

  useEffect(() => {
    if (!userId) {
      setError('User ID is missing.');
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchWithAdminAuth(`/admin/users/${userId}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch user details');
        }
        const data = await response.json();
        if (!data.user) {
          throw new Error('User data not found in response');
        }

        const userData: Partial<FormValues> = {
          name: data.user.name,
          email: data.user.email,

          role: data.user.role,
          phone: data.user.phone || '',
          isActive: data.user.isActive,
          licenseNumber: data.user.licenseNumber || '',
          studentId: data.user.studentId || '',
          grade: data.user.grade || '',
        };
        setInitialUserData(userData);
        form.reset(userData);
      } catch (error: unknown) {
        const typedError =
          error instanceof Error ? error : new Error('An unexpected error occurred');
        setError(typedError.message || 'Failed to load user details for editing.');
        toast.error(typedError.message || 'Failed to load user details.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, form]);

  const onSubmit = async (values: FormValues) => {
    if (!userId) {
      toast.error('Cannot update user: User ID is missing.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const updatePayload = { ...values };
      if (!updatePayload.password) {
        delete updatePayload.password;
      }

      const response = await fetchWithAdminAuth(`/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      const result = await response.json();

      if (!response.ok || !result.user) {
        throw new Error(result.error || result.message || 'Failed to update user');
      }

      toast.success(`User ${result.user.name} updated successfully.`);
      router.push(`/admin/users/${userId}`);
    } catch (error: unknown) {
      const typedError = error instanceof Error ? error : new Error('An unexpected error occurred');
      setError(typedError.message || 'An unexpected error occurred.');
      toast.error(typedError.message || 'Failed to update user.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-150px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !initialUserData) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading User Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const selectedRole = form.watch('role');

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Toaster position="top-right" richColors />
      <div className="flex items-center mb-6 gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push(`/admin/users/${userId}`)}
          aria-label="Back to User Details"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Edit User</h1>
      </div>

      {error && !submitting && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Update Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>
            Update the user's details below. Leave password blank to keep it unchanged.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full Name" {...field} disabled={submitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="user@example.com"
                          {...field}
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Leave blank to keep current password"
                        {...field}
                        disabled={submitting}
                      />
                    </FormControl>
                    <FormDescription>Minimum 6 characters if changing.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={submitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select user role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="driver">Driver</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Optional phone number"
                          {...field}
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {selectedRole === 'driver' && (
                <FormField
                  control={form.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver License Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Optional for drivers"
                          {...field}
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedRole === 'student' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Optional for students"
                            {...field}
                            disabled={submitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Optional for students"
                            {...field}
                            disabled={submitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <FormDescription>
                        Inactive users cannot log in or use the system.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={submitting}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Separator />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/admin/users/${userId}`)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !form.formState.isDirty}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
