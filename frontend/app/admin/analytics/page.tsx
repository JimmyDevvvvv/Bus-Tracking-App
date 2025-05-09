'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAdminAuth } from '@/lib/adminAuth';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  Label as RechartsLabel,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Download,
  Users,
  Bus,
  Clock,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster, toast } from 'sonner';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface OverviewMetric {
  count: number;
  changePercentage?: number;
  average?: number;
  change?: number;
}

interface OverviewData {
  activeUsers: OverviewMetric;
  busesOnRoute: OverviewMetric;
  tripDuration: OverviewMetric;
  reports: OverviewMetric;
}

interface UsageDataPoint {
  day?: string;
  month?: string;
  drivers: number;
  students: number;
  active_buses: number;
}

interface UserActivityPoint {
  timeOfDay: string;
  percentage: number;
}

interface UsageResponse {
  data: UsageDataPoint[];
  userActivity: UserActivityPoint[];
}

interface BusStatusDataPoint {
  status: string;
  count: number;
}

interface RoutePerformancePoint {
  route: string;
  avgTime: string;
  onTimeRate: string;
  trend: string;
  busCount: number;
}

interface BusAnalyticsResponse {
  busStatusData: BusStatusDataPoint[];
  routePerformance: RoutePerformancePoint[];
}

interface ReportStatPoint {
  status?: string;
  type?: string;
  count: number;
}

interface ResolutionTimePoint {
  type: string;
  time: string;
  count: number;
  timeValue?: number;
}

interface ReportAnalyticsResponse {
  reportStatusData: ReportStatPoint[];
  reportTypesData: ReportStatPoint[];
  resolutionTimes: ResolutionTimePoint[];
}

interface TopRoutePoint {
  route: string;
  students: number;
  percentage: string;
}

interface UserEngagementPoint {
  role: string;
  sessions: number;
  avgTime: string;
  change: string;
}

interface EngagementAnalyticsResponse {
  topRoutes: TopRoutePoint[];
  userEngagement: UserEngagementPoint[];
}

const COLORS_STATUS = ['#facc15', '#3b82f6', '#9ca3af', '#10b981'];
const COLORS_TYPE = ['#3b82f6', '#ef4444', '#f97316', '#22c55e'];
const COLORS_ACTIVITY = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c'];
const COLORS_RESOLUTION = ['#3b82f6', '#ef4444', '#f97316', '#22c55e'];

const CustomPieTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: Record<string, string | number>;
    percent: number;
  }>;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const name = data.status || data.type || data.timeOfDay;
    const value = data.count || data.percentage;
    const percent = payload[0].percent;
    return (
      <div className="rounded-md border bg-background/90 px-3 py-1.5 text-xs shadow-sm backdrop-blur-sm">
        <p className="font-semibold">
          {name}: {value} ({(percent * 100).toFixed(0)}%)
        </p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border bg-background/90 px-3 py-1.5 text-xs shadow-sm backdrop-blur-sm">
        <p className="mb-1 font-semibold text-muted-foreground">{label}</p>
        {payload.map(entry => (
          <p key={entry.name} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [usageData, setUsageData] = useState<UsageResponse | null>(null);
  const [busData, setBusData] = useState<BusAnalyticsResponse | null>(null);
  const [reportData, setReportData] = useState<ReportAnalyticsResponse | null>(null);
  const [engagementData, setEngagementData] = useState<EngagementAnalyticsResponse | null>(null);

  const [usageTimeRange, setUsageTimeRange] = useState('7d');

  useEffect(() => {
    const fetchAllAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoints = [
          '/admin/analytics/overview',
          `/admin/analytics/usage?timeRange=${usageTimeRange}`,
          '/admin/analytics/buses',
          '/admin/analytics/reports',
          '/admin/analytics/engagement',
        ];

        const responses = await Promise.all(
          endpoints.map(endpoint => fetchWithAdminAuth(endpoint))
        );

        responses.forEach((res, index) => {
          if (!res.ok) {
            toast.error(`Error fetching ${endpoints[index]}: Status ${res.status}`);
            res
              .json()
              .then(errData => {
                throw new Error(
                  errData?.message || errData?.error || `Failed to fetch ${endpoints[index]}`
                );
              })
              .catch(() => {
                throw new Error(`Failed to fetch ${endpoints[index]} and parse error response.`);
              });
          }
        });

        const data = await Promise.all(responses.map(res => res.json()));

        if (!data[0]?.metrics) throw new Error('Invalid Overview data structure');
        if (!data[1]?.data || !data[1]?.userActivity)
          throw new Error('Invalid Usage data structure');
        if (!data[2]?.busStatusData || !data[2]?.routePerformance)
          throw new Error('Invalid Bus data structure');
        if (!data[3]?.reportStatusData || !data[3]?.reportTypesData || !data[3]?.resolutionTimes)
          throw new Error('Invalid Report data structure');
        if (!data[4]?.topRoutes || !data[4]?.userEngagement)
          throw new Error('Invalid Engagement data structure');

        const processedReportData = {
          ...data[3],
          resolutionTimes: data[3].resolutionTimes.map((item: ResolutionTimePoint) => {
            let timeValue = 0;
            const parts = item.time.split(' ');
            if (parts.length === 2) {
              const value = parseFloat(parts[0]);
              if (parts[1].startsWith('day')) {
                timeValue = value * 24;
              } else if (parts[1].startsWith('hour')) {
                timeValue = value;
              }
            }
            return { ...item, timeValue };
          }),
        };

        setOverviewData(data[0].metrics);
        setUsageData(data[1]);
        setBusData(data[2]);
        setReportData(processedReportData);
        setEngagementData(data[4]);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load some analytics data.';
        toast.error('Error fetching analytics data: ' + errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAnalytics();
  }, [usageTimeRange]);

  useEffect(() => {
    if (loading) return;

    const fetchUsageData = async () => {
      setLoadingUsage(true);
      setError(null);
      try {
        const response = await fetchWithAdminAuth(
          `/admin/analytics/usage?timeRange=${usageTimeRange}`
        );
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.message || errData?.error || `Failed to fetch usage data`);
        }
        const data = await response.json();
        if (!data?.data || !data?.userActivity) throw new Error('Invalid Usage data structure');
        setUsageData(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load usage data.';
        toast.error('Error fetching usage data: ' + errorMessage);
        setError(errorMessage);
      } finally {
        setLoadingUsage(false);
      }
    };

    fetchUsageData();
  }, [usageTimeRange, loading]);

  const handleExport = async () => {
    try {
      const response = await fetchWithAdminAuth('/admin/analytics/export');
      if (!response.ok) {
        throw new Error('Failed to initiate export');
      }
      const blob = await response.blob();

      if (typeof window === 'undefined' || typeof document === 'undefined') {
        throw new Error('Cannot download in this environment');
      }

      // eslint-disable-next-line no-undef
      const url = window.URL.createObjectURL(blob);

      // eslint-disable-next-line no-undef
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `bus-tracking-analytics-${timestamp}.csv`;

      // eslint-disable-next-line no-undef
      document.body.appendChild(link);
      link.click();
      link.remove();

      // eslint-disable-next-line no-undef
      window.URL.revokeObjectURL(url);

      toast.success('Analytics report downloaded.');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download report.';
      toast.error('Export error: ' + errorMessage);
    }
  };

  const handleTimeRangeChange = (range: string) => {
    if (range !== usageTimeRange) {
      setUsageTimeRange(range);
    }
  };

  if (loading && !overviewData) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-150px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !overviewData) {
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
          <AlertTitle>Error Loading Analytics</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderChange = (change: number | undefined) => {
    if (change === undefined || change === null) return null;
    const isPositive = change > 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
    return (
      <span className={cn('text-xs font-semibold flex items-center', color)}>
        <TrendIcon className="h-3.5 w-3.5 mr-1" />
        {isPositive ? '+' : ''}
        {change.toFixed(1)}%
      </span>
    );
  };

  interface LegendItem {
    count?: number;
    percentage?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  const renderLegend = (data: LegendItem[], colors: string[], nameKey: string) => (
    <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
      {data.map((entry, index) => (
        <div key={`item-${index}`} className="flex items-center">
          <span
            className="mr-1.5 h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: colors[index % colors.length] }}
          />
          <span>
            {entry[nameKey]} ({entry.count ?? entry.percentage} {nameKey === 'timeOfDay' ? '%' : ''}
            )
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 max-w-full mx-auto space-y-6">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin')}
            aria-label="Go Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Analytics Dashboard</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" disabled>
            <Calendar className="mr-2 h-4 w-4" />
            Last 7 days
          </Button>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewData ? (
          <>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Active Users Today</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewData.activeUsers.count}</div>
                <p className="text-xs text-muted-foreground">
                  {renderChange(overviewData.activeUsers.changePercentage)} from yesterday
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Buses on Route</CardTitle>
                <Bus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewData.busesOnRoute.count}</div>
                <p className="text-xs text-muted-foreground">
                  {renderChange(overviewData.busesOnRoute.change)} from yesterday
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Average Trip Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewData.tripDuration.average}m</div>
                <p className="text-xs text-muted-foreground">
                  {renderChange(overviewData.tripDuration.change)} from last week
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Reports this Week</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewData.reports.count}</div>
                <p className="text-xs text-muted-foreground">
                  {renderChange(overviewData.reports.change)} from last week
                </p>
              </CardContent>
            </Card>
          </>
        ) : loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-[110px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Could not load overview data.</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="usage">
        <div className="flex justify-between items-center border-b">
          <TabsList>
            <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
            <TabsTrigger value="bus">Bus Analytics</TabsTrigger>
            <TabsTrigger value="report">Report Analytics</TabsTrigger>
          </TabsList>
          <div className="hidden md:flex gap-2">
            <Button
              variant={usageTimeRange === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTimeRangeChange('7d')}
            >
              7 Days
            </Button>
            <Button
              variant={usageTimeRange === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTimeRangeChange('30d')}
            >
              30 Days
            </Button>
            <Button
              variant={usageTimeRange === '90d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTimeRangeChange('90d')}
            >
              90 Days
            </Button>
          </div>
        </div>

        <TabsContent value="usage" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>System Usage Over Time</CardTitle>
                <CardDescription>Track daily usage of the bus tracking platform.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsage ? (
                  <div className="flex justify-center items-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : usageData?.data && usageData.data.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={usageData.data}
                        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey={usageTimeRange === '7d' ? 'day' : 'month'}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={value => `${value}`}
                        />
                        <Tooltip
                          content={<CustomBarTooltip />}
                          cursor={{ fill: 'hsl(var(--muted))' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Bar
                          dataKey="students"
                          stackId="a"
                          fill="#8884d8"
                          name="Students"
                          radius={[0, 0, 0, 0]}
                          barSize={30}
                        />
                        <Bar
                          dataKey="drivers"
                          stackId="a"
                          fill="#82ca9d"
                          name="Drivers"
                          radius={[0, 0, 0, 0]}
                          barSize={30}
                        />
                        <Bar
                          dataKey="active_buses"
                          stackId="a"
                          fill="#ffc658"
                          name="Active Buses"
                          radius={[4, 4, 0, 0]}
                          barSize={30}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground h-[300px] flex items-center justify-center">
                    {error
                      ? `Error loading usage data: ${error}`
                      : 'No usage data available for this period.'}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>Most active times of day.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsage ? (
                  <div className="flex justify-center items-center h-[300px]">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : usageData?.userActivity && usageData.userActivity.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={usageData.userActivity}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          tickFormatter={value => `${value}%`}
                          fontSize={10}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          dataKey="timeOfDay"
                          type="category"
                          width={100}
                          fontSize={10}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          content={<CustomBarTooltip />}
                          cursor={{ fill: 'hsl(var(--muted))' }}
                        />
                        <Bar
                          dataKey="percentage"
                          name="Activity %"
                          barSize={20}
                          radius={[0, 4, 4, 0]}
                        >
                          {usageData.userActivity.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS_ACTIVITY[index % COLORS_ACTIVITY.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center h-[300px] flex items-center justify-center">
                    No activity data.
                  </p>
                )}
              </CardContent>
              <CardFooter className="justify-center">
                <Button variant="outline" size="sm" disabled>
                  View Detailed Analytics
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bus" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Bus Route Performance</CardTitle>
                <CardDescription>Average completion times and delays.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : busData?.routePerformance && busData.routePerformance.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Route</TableHead>
                        <TableHead>Avg Time</TableHead>
                        <TableHead>On-Time Rate</TableHead>
                        <TableHead>Bus Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {busData.routePerformance.map(route => (
                        <TableRow key={route.route}>
                          <TableCell className="font-medium">{route.route}</TableCell>
                          <TableCell>{route.avgTime}</TableCell>
                          <TableCell>{route.onTimeRate}</TableCell>
                          <TableCell>{route.busCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-6">
                    No route performance data.
                  </p>
                )}
              </CardContent>
              <CardFooter className="justify-end">
                <Button variant="outline" size="sm" onClick={() => router.push('/admin/buses')}>
                  View All Routes
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Bus Fleet Status</CardTitle>
                <CardDescription>Current status of all buses.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {loading ? (
                  <div className="flex justify-center items-center h-[250px]">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : busData?.busStatusData && busData.busStatusData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={busData.busStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="status"
                        >
                          {busData.busStatusData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS_STATUS[index % COLORS_STATUS.length]}
                            />
                          ))}
                          <RechartsLabel
                            value={busData.busStatusData.reduce(
                              (sum, entry) => sum + entry.count,
                              0
                            )}
                            position="center"
                            dy={-10}
                            className="fill-foreground text-3xl font-semibold"
                          />
                          <RechartsLabel
                            value="Total"
                            position="center"
                            dy={10}
                            className="fill-muted-foreground text-sm"
                          />
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {renderLegend(busData.busStatusData as LegendItem[], COLORS_STATUS, 'status')}
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm text-center h-[250px] flex items-center justify-center">
                    No status data.
                  </p>
                )}
              </CardContent>
              <CardFooter className="justify-end">
                <Button variant="ghost" size="sm" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="report" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Report Status Distribution</CardTitle>
                <CardDescription>Status breakdown of all reports.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {loading ? (
                  <div className="flex justify-center items-center h-[250px]">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : reportData?.reportStatusData && reportData.reportStatusData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={reportData.reportStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="status"
                        >
                          {reportData.reportStatusData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS_STATUS[index % COLORS_STATUS.length]}
                            />
                          ))}
                          <RechartsLabel
                            value={reportData.reportStatusData.reduce(
                              (sum, entry) => sum + entry.count,
                              0
                            )}
                            position="center"
                            dy={-10}
                            className="fill-foreground text-3xl font-semibold"
                          />
                          <RechartsLabel
                            value="Total"
                            position="center"
                            dy={10}
                            className="fill-muted-foreground text-sm"
                          />
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {renderLegend(
                      reportData.reportStatusData as LegendItem[],
                      COLORS_STATUS,
                      'status'
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm text-center h-[250px] flex items-center justify-center">
                    No status data.
                  </p>
                )}
              </CardContent>
              <CardFooter className="justify-end">
                <Button variant="ghost" size="sm" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Report Types</CardTitle>
                <CardDescription>Breakdown by report category.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {loading ? (
                  <div className="flex justify-center items-center h-[250px]">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : reportData?.reportTypesData && reportData.reportTypesData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={reportData.reportTypesData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="type"
                        >
                          {reportData.reportTypesData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS_TYPE[index % COLORS_TYPE.length]}
                            />
                          ))}
                          <RechartsLabel
                            value={reportData.reportTypesData.reduce(
                              (sum, entry) => sum + entry.count,
                              0
                            )}
                            position="center"
                            dy={-10}
                            className="fill-foreground text-3xl font-semibold"
                          />
                          <RechartsLabel
                            value="Total"
                            position="center"
                            dy={10}
                            className="fill-muted-foreground text-sm"
                          />
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {renderLegend(reportData.reportTypesData as LegendItem[], COLORS_TYPE, 'type')}
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm text-center h-[250px] flex items-center justify-center">
                    No type data.
                  </p>
                )}
              </CardContent>
              <CardFooter className="justify-end">
                <Button variant="ghost" size="sm" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Resolution Time</CardTitle>
                <CardDescription>Average time to resolve reports.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-[250px]">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : reportData?.resolutionTimes && reportData.resolutionTimes.length > 0 ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={reportData.resolutionTimes}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis
                          type="number"
                          domain={[0, 'dataMax + 5']}
                          tickFormatter={value => `${value}h`}
                          fontSize={10}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          dataKey="type"
                          type="category"
                          width={80}
                          fontSize={10}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          content={<CustomBarTooltip />}
                          cursor={{ fill: 'hsl(var(--muted))' }}
                          formatter={(value, name, props) => {
                            const time = props?.payload?.time || `${value}h`;
                            return [time, name];
                          }}
                        />
                        <Bar
                          dataKey="timeValue"
                          name="Avg. Hours"
                          barSize={15}
                          radius={[0, 4, 4, 0]}
                        >
                          {reportData.resolutionTimes.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS_RESOLUTION[index % COLORS_RESOLUTION.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center h-[250px] flex items-center justify-center">
                    No resolution time data.
                  </p>
                )}
              </CardContent>
              <CardFooter className="justify-end">
                <Button variant="outline" size="sm" disabled>
                  View Detailed Report Analytics
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Routes by Usage</CardTitle>
            <CardDescription>
              Most frequently used routes by assigned student count.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : engagementData?.topRoutes && engagementData.topRoutes.length > 0 ? (
              <div className="space-y-4">
                {engagementData.topRoutes.map((route, index) => (
                  <div key={route.route} className="flex items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium mr-3">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{route.route}</div>
                      <div className="text-xs text-muted-foreground">{route.students} Students</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{route.percentage}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-6">No top routes data.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
            <CardDescription>App usage by user type.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : engagementData?.userEngagement && engagementData.userEngagement.length > 0 ? (
              <div className="space-y-5">
                {engagementData.userEngagement.map(eng => (
                  <div key={eng.role} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{eng.role}</p>
                      <p className="text-xs text-muted-foreground">
                        Sessions: {eng.sessions} • Avg. Session Time: {eng.avgTime}
                      </p>
                    </div>
                    {renderChange(parseFloat(eng.change))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-6">
                No user engagement data.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
