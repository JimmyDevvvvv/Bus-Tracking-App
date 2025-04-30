'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAdminAuth } from '@/lib/adminAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  profilePicture?: string;
  lastActive?: string;
  assignedBusId?: string;
  busRoute?: string;
  preferredPickupTime?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetchWithAdminAuth(`/admin/users/${params.id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();
        setProfile(data.user);
      } catch (error: unknown) {
        const typedError =
          error instanceof Error ? error : new Error('An unexpected error occurred');
        setError(typedError.message || 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [params.id]);

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

  if (!profile) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Alert>
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>User profile not found.</AlertDescription>
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.profilePicture} />
              <AvatarFallback>{profile.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{profile.name}</CardTitle>
              <CardDescription className="flex items-center mt-1">
                <Mail className="h-4 w-4 mr-1" />
                {profile.email}
              </CardDescription>
              <div className="flex gap-2 mt-2">
                <Badge variant={profile.role === 'admin' ? 'destructive' : 'default'}>
                  {profile.role}
                </Badge>
                <Badge variant={profile.isActive ? 'default' : 'secondary'}>
                  {profile.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.phone && (
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile.address && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{profile.address}</span>
              </div>
            )}
            {profile.emergencyContact && (
              <>
                <Separator />
                <div className="pt-4">
                  <h4 className="font-medium mb-2">Emergency Contact</h4>
                  <div className="space-y-2">
                    <p>{profile.emergencyContact.name}</p>
                    <p>{profile.emergencyContact.phone}</p>
                    <p className="text-sm text-muted-foreground">
                      ({profile.emergencyContact.relationship})
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bus Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.role === 'driver' && profile.assignedBusId && (
              <div>
                <h4 className="font-medium mb-2">Assigned Bus</h4>
                <p>{profile.assignedBusId}</p>
                <Button
                  variant="link"
                  className="p-0 h-auto mt-1"
                  onClick={() => router.push(`/admin/buses/${profile.assignedBusId}`)}
                >
                  View Bus Details
                </Button>
              </div>
            )}
            {profile.role === 'student' && (
              <>
                {profile.busRoute && (
                  <div>
                    <h4 className="font-medium mb-2">Bus Route</h4>
                    <p>{profile.busRoute}</p>
                  </div>
                )}
                {profile.preferredPickupTime && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Preferred Pickup Time</h4>
                    <p>{profile.preferredPickupTime}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground mr-2">Created:</span>
              <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
            </div>
            {profile.lastActive && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground mr-2">Last Active:</span>
                <span>{new Date(profile.lastActive).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
