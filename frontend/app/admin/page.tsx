'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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

interface OverviewMetric {
  count: number;
  changePercentage?: number;
  average?: number;
  change?: number;
}

interface DashboardStats {
  activeUsers: OverviewMetric;
  busesOnRoute: OverviewMetric;
  tripDuration: OverviewMetric;
  reports: OverviewMetric;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await fetchWithAdminAuth('/analytics/overview');

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || errorData.error || 'Failed to fetch dashboard statistics'
          );
        }

        const data = await response.json();
        if (!data || !data.metrics) {
          throw new Error('Invalid data structure received from analytics overview');
        }
        setStats(data.metrics);
      } catch (err: Error | unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load dashboard statistics';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
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

      {error && <div className="bg-destructive/15 text-destructive p-4 rounded-md">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <UserIcon className="mr-2 h-5 w-5 text-primary" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.activeUsers.count ?? 0}</div>
            <div className="text-sm text-muted-foreground mt-2">Active users today</div>
          </CardContent>
          <CardFooter className="pt-0">
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
            <div className="text-3xl font-bold">{stats?.busesOnRoute.count ?? 0}</div>
            <div className="text-sm text-muted-foreground mt-2">Buses currently on route</div>
          </CardContent>
          <CardFooter className="pt-0">
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
            <div className="text-3xl font-bold">{stats?.reports.count ?? 0}</div>
            <div className="text-sm text-muted-foreground mt-2">Reports submitted this week</div>
          </CardContent>
          <CardFooter className="pt-0">
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
            <div className="text-sm text-muted-foreground mt-2">
              View usage statistics and reports
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/admin/analytics">View Analytics</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

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
            <div className="text-2xl font-bold">{stats?.activeUsers.count ?? 0}</div>
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
            <div className="text-2xl font-bold">{stats?.busesOnRoute.count ?? 0}</div>
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
            <div className="text-2xl font-bold">{stats?.reports.count ?? 0}</div>
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
