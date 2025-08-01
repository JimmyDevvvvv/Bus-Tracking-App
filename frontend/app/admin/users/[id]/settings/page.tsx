'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAdminAuth } from '@/lib/adminAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface UserSettings {
  id: string;
  name: string;
  email: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    showProfile: boolean;
    showLocation: boolean;
    showActivity: boolean;
  };
  preferences: {
    language: string;
    theme: string;
    timezone: string;
  };
}

export default function UserSettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await fetchWithAdminAuth(`/admin/users/${params.id}/settings`);

        if (!response.ok) {
          throw new Error('Failed to fetch user settings');
        }

        const data = await response.json();
        setSettings(data.settings);
      } catch (error: unknown) {
        const typedError =
          error instanceof Error ? error : new Error('An unexpected error occurred');
        setError(typedError.message || 'Failed to load user settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [params.id]);

  const handleSettingChange = async (
    category: 'notifications' | 'privacy' | 'preferences',
    setting: string,
    value: boolean | string
  ) => {
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);

      const updatedSettings = {
        ...settings,
        [category]: {
          ...settings[category],
          [setting]: value,
        },
      };

      const response = await fetchWithAdminAuth(`/admin/users/${params.id}/settings`, {
        method: 'PUT',
        body: JSON.stringify({ settings: updatedSettings }),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      setSettings(updatedSettings);
    } catch (error: unknown) {
      const typedError = error instanceof Error ? error : new Error('An unexpected error occurred');
      setError(typedError.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Alert>
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>User settings not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Button variant="outline" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>User Settings</CardTitle>
          <CardDescription>Manage settings and preferences for {settings.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="notifications" className="space-y-4">
            <TabsList>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="notifications" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onCheckedChange={checked =>
                      handleSettingChange('notifications', 'email', checked)
                    }
                    disabled={saving}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications on your devices
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.push}
                    onCheckedChange={checked =>
                      handleSettingChange('notifications', 'push', checked)
                    }
                    disabled={saving}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                  </div>
                  <Switch
                    checked={settings.notifications.sms}
                    onCheckedChange={checked =>
                      handleSettingChange('notifications', 'sms', checked)
                    }
                    disabled={saving}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Profile</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to view your profile
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.showProfile}
                    onCheckedChange={checked =>
                      handleSettingChange('privacy', 'showProfile', checked)
                    }
                    disabled={saving}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Share Location</Label>
                    <p className="text-sm text-muted-foreground">
                      Share your location with the bus tracking system
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.showLocation}
                    onCheckedChange={checked =>
                      handleSettingChange('privacy', 'showLocation', checked)
                    }
                    disabled={saving}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Activity Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Show when you're active on the platform
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.showActivity}
                    onCheckedChange={checked =>
                      handleSettingChange('privacy', 'showActivity', checked)
                    }
                    disabled={saving}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Language</Label>
                    <p className="text-sm text-muted-foreground">{settings.preferences.language}</p>
                  </div>
                  <Button variant="outline" onClick={() => {}}>
                    Change
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">{settings.preferences.theme}</p>
                  </div>
                  <Button variant="outline" onClick={() => {}}>
                    Change
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Timezone</Label>
                    <p className="text-sm text-muted-foreground">{settings.preferences.timezone}</p>
                  </div>
                  <Button variant="outline" onClick={() => {}}>
                    Change
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
