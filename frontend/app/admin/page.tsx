'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchWithAdminAuth } from '@/lib/adminAuth';
import {
  UserIcon,
  Bus,
  AlertCircle,
  BarChart4,
  ClipboardList,
  Loader2,
  Settings,
  Users,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';

interface DashboardMetrics {
  users: { activeToday: number };
  buses: { onRoute: number };
  reports: { submittedToday: number; active: number };
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetchWithAdminAuth('/admin/dashboard-metrics');
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || err.error || 'Failed to load metrics');
        }
        const data = await res.json();
        if (!data.metrics) throw new Error('Malformed response from backend');
        setMetrics(data.metrics);
      } catch (err: any) {
        toast.error(err.message || 'Error loading dashboard data');
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (!metrics || error) {
    return (
      <div className="p-6">
        <p className="text-red-500 text-center">
          {error || 'No dashboard data available'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button asChild>
          <Link href="/admin/settings">
            <Settings className="mr-2 h-4 w-4" />
            System Settings
          </Link>
        </Button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <UserIcon className="mr-2 h-5 w-5 text-primary" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.users.activeToday}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Active users today
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/admin/users">Manage Users</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Bus className="mr-2 h-5 w-5 text-primary" />
              Buses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.buses.onRoute}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Currently on route
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/admin/buses">Manage Buses</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-primary" />
              Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.reports.submittedToday}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Reports submitted today
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/admin/reports">View Reports</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BarChart4 className="mr-2 h-5 w-5 text-primary" />
              Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Dashboard</div>
            <div className="text-sm text-muted-foreground mt-1">
              Usage insights & traffic
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/admin/analytics">View Analytics</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          asChild
          variant="outline"
          className="h-auto py-4 flex flex-col items-center justify-center"
        >
          <Link href="/admin/users/new">
            <UserIcon className="h-8 w-8 mb-2" />
            <span>Add New User</span>
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          className="h-auto py-4 flex flex-col items-center justify-center"
        >
          <Link href="/admin/buses/new">
            <Bus className="h-8 w-8 mb-2" />
            <span>Add New Bus</span>
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          className="h-auto py-4 flex flex-col items-center justify-center"
        >
          <Link href="/admin/reports">
            <ClipboardList className="h-8 w-8 mb-2" />
            <span>Manage Reports</span>
          </Link>
        </Button>
      </div>

      {/* System Status Overview */}
      <h2 className="text-xl font-semibold mt-8 mb-4">System Status Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.users.activeToday}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Bus className="mr-2 h-4 w-4" />
              Buses on Route
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.buses.onRoute}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Active Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.reports.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="mr-2 h-4 w-4" />
              System Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground">Real-time monitoring active</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
