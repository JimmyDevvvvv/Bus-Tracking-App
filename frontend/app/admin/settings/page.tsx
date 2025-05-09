'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Bell,
  Database,
  ShieldCheck,
  SlidersHorizontal,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Toaster, toast } from 'sonner';
import { fetchWithAdminAuth } from '@/lib/adminAuth'; // Assuming this helper exists

// --- Interfaces for Settings Data (Matches Backend Model, excluding sensitive fields) ---
// Comment out unused interfaces
// interface GeneralSettings {
//   appName: string;
//   defaultLanguage: string;
//   timezone: string;
// }
//
// interface NotificationSettings {
//   emailEnabled: boolean;
//   smtpHost: string;
//   smtpPort: number;
//   smtpUser?: string;
//   // smtpPass is handled separately on the frontend form
// }
//
// interface SecuritySettings {
//   mfaRequired: boolean;
//   passwordMinLength: number;
//   apiRateLimit: number; // requests per minute
// }
//
// interface DataManagementSettings {
//   logRetentionDays: number;
//   autoBackupEnabled: boolean;
//   backupFrequency: 'daily' | 'weekly' | 'monthly';
// }

// --- Form Schema (Matches Backend Model) ---
// Comment out unused SystemSettings interface
// interface SystemSettings
//   extends GeneralSettings,
//     NotificationSettings,
//     SecuritySettings,
//     DataManagementSettings {}

const settingsSchema = z
  .object({
    // General
    appName: z.string().min(1, 'Application name is required.'),
    defaultLanguage: z.string().min(1, 'Default language is required.'),
    timezone: z.string().min(1, 'Timezone is required.'),

    // Notifications
    emailEnabled: z.boolean(),
    smtpHost: z.string().optional().or(z.literal('')), // Required only if emailEnabled is true, handled by refine
    smtpPort: z.number().int().positive('Port must be a positive integer.').optional().or(z.null()),
    smtpUser: z.string().optional(),
    smtpPass: z.string().optional(), // Frontend only, not sent directly unless changed

    // Security
    mfaRequired: z.boolean(),
    passwordMinLength: z
      .number()
      .int()
      .min(6, 'Minimum password length must be at least 6.')
      .max(32),
    apiRateLimit: z.number().int().positive('API rate limit must be positive.'),

    // Data Management
    logRetentionDays: z.number().int().min(1, 'Log retention must be at least 1 day.'),
    autoBackupEnabled: z.boolean(),
    backupFrequency: z.enum(['daily', 'weekly', 'monthly']),
  })
  .refine(data => !data.emailEnabled || (data.smtpHost && data.smtpPort), {
    message: 'SMTP Host and Port are required when email notifications are enabled.',
    path: ['smtpHost'], // Associate error with a relevant field
  });

type SettingsFormValues = z.infer<typeof settingsSchema>;

// --- Component ---
export default function SystemSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialSettings, setInitialSettings] = useState<Partial<SettingsFormValues>>({});

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    // Default values will be loaded via useEffect
  });

  // --- Fetch Initial Settings ---
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchWithAdminAuth('/admin/settings');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success && data.settings) {
          // Set initial values for the form, add empty smtpPass for the field
          const fetchedValues = { ...data.settings, smtpPass: '' };
          form.reset(fetchedValues);
          setInitialSettings(fetchedValues); // Store initial state for comparison
        } else {
          throw new Error(data.message || 'Failed to parse settings data.');
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to load system settings.';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [form]); // form.reset is stable

  // --- Form Submission Handler ---
  const onSubmit = async (values: SettingsFormValues) => {
    setSubmitting(true);
    setError(null);

    const payload: Partial<SettingsFormValues> = {};
    let changed = false;

    // 1. Handle smtpPass separately
    if (values.smtpPass && values.smtpPass !== '') {
      payload.smtpPass = values.smtpPass;
      changed = true;
    }

    // 2. Iterate through initial settings keys (excluding smtpPass) and compare with form values
    for (const key in initialSettings) {
      if (key === 'smtpPass') continue; // Already handled

      const formKey = key as keyof Omit<SettingsFormValues, 'smtpPass'>;

      // Check if the key exists in form values (it always should)
      if (formKey in values) {
        const currentValue = values[formKey];
        const initialValue = initialSettings[formKey];

        if (currentValue !== initialValue) {
          // @ts-ignore // Ignore potential TSC error here, types should align
          payload[formKey] = currentValue;
          changed = true;
        }
      }
    }

    // 3. Check if anything actually changed
    if (!changed) {
      toast.info('No changes detected.');
      setSubmitting(false);
      return;
    }

    // 4. Final check: If payload only contains an empty smtpPass (user cleared it), treat as no change
    // Note: This check is likely redundant due to step 1, but kept for safety.
    if (Object.keys(payload).length === 1 && payload.smtpPass === '') {
      toast.info('No changes detected.');
      setSubmitting(false);
      return;
    }

    // Backend handles empty smtpPass, no need to delete from payload here.

    try {
      const response = await fetchWithAdminAuth('/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to save settings.');
      }

      toast.success('System settings updated successfully.');
      // Update initial settings and reset form state with the new values (excluding password)
      const newInitialValues = { ...result.settings, smtpPass: '' };
      form.reset(newInitialValues);
      setInitialSettings(newInitialValues);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save settings.';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Loading/Error States ---
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-150px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  // Show initial load error more prominently
  if (error && Object.keys(initialSettings).length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/admin')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Settings</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/admin')}
          aria-label="Go Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">System Settings</h1>
      </div>

      {/* Show submission error */}
      {error && submitting && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Save Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Show non-blocking load error if form is available */}
      {error && !submitting && Object.keys(initialSettings).length > 0 && (
        // Use default variant for warning, rely on icon/text
        <Alert
          variant="default"
          className="border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-400"
        >
          <AlertCircle className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            There was an issue loading settings previously, but you can still attempt to save
            changes. Details: {error}
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SlidersHorizontal className="mr-2 h-5 w-5" /> General
              </CardTitle>
              <CardDescription>Basic application configuration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="appName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Bus Tracker" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="defaultLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Language</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en-US">English (US)</SelectItem>
                          <SelectItem value="es-ES">Spanish</SelectItem>
                          {/* Add other languages */}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* Populate with actual timezone list later */}
                          <SelectItem value="America/New_York">
                            Eastern Time (US & Canada)
                          </SelectItem>
                          <SelectItem value="America/Chicago">
                            Central Time (US & Canada)
                          </SelectItem>
                          <SelectItem value="America/Denver">
                            Mountain Time (US & Canada)
                          </SelectItem>
                          <SelectItem value="America/Los_Angeles">
                            Pacific Time (US & Canada)
                          </SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" /> Notifications
              </CardTitle>
              <CardDescription>Configure email notification settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="emailEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Enable Email Notifications</FormLabel>
                      <FormDescription>
                        Allow the system to send emails (requires SMTP config).
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              {form.watch('emailEnabled') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="smtpHost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Host</FormLabel>
                        <FormControl>
                          <Input placeholder="smtp.example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="smtpPort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Port</FormLabel>
                        {/* Handle null value for input */}
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="587"
                            {...field}
                            value={field.value ?? ''} // Pass empty string if null/undefined
                            onChange={event =>
                              field.onChange(event.target.value === '' ? null : +event.target.value)
                            } // Convert back to null if empty
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="smtpUser"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Username</FormLabel>
                        <FormControl>
                          <Input placeholder="your-email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="smtpPass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter new password or leave blank"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Leave blank to keep existing password.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldCheck className="mr-2 h-5 w-5" /> Security
              </CardTitle>
              <CardDescription>Manage security related settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="mfaRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Require Multi-Factor Auth (MFA)</FormLabel>
                      <FormDescription>
                        Force users to set up MFA for added security.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="passwordMinLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Password Length</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={6}
                          max={32}
                          {...field}
                          onChange={event => field.onChange(+event.target.value)}
                        />
                      </FormControl>
                      <FormDescription>Characters required for user passwords.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apiRateLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Rate Limit (Requests/Min)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          onChange={event => field.onChange(+event.target.value)}
                        />
                      </FormControl>
                      <FormDescription>Limit per user per minute.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" /> Data Management
              </CardTitle>
              <CardDescription>Configure data retention and backups.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="logRetentionDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Log Retention Period (Days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={event => field.onChange(+event.target.value)}
                      />
                    </FormControl>
                    <FormDescription>How long to keep system and audit logs.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="autoBackupEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Enable Automatic Backups</FormLabel>
                      <FormDescription>Periodically back up system data.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              {form.watch('autoBackupEnabled') && (
                <FormField
                  control={form.control}
                  name="backupFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Backup Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || !form.formState.isDirty}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
