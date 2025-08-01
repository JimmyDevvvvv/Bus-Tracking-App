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
  Plus,
  Shield,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface DashboardMetrics {
  users: { activeToday: number };
  buses: { onRoute: number };
  reports: { submittedToday: number; active: number };
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

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
      <div className="flex h-[calc(100vh-80px)] items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-muted-foreground">Loading Admin Dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (!metrics || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-red-200 dark:border-red-800"
        >
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 text-lg font-medium">
            {error || 'No dashboard data available'}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
          >
            Retry
          </Button>
        </motion.div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Users',
      value: metrics.users.activeToday,
      subtitle: 'Users active today',
      icon: UserIcon,
      color: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
      link: '/admin/users',
      linkText: 'Manage Users',
      id: 'users'
    },
    {
      title: 'Active Buses',
      value: metrics.buses.onRoute,
      subtitle: 'Currently on route',
      icon: Bus,
      color: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      link: '/admin/buses',
      linkText: 'Manage Buses',
      id: 'buses'
    },
    {
      title: 'Today\'s Reports',
      value: metrics.reports.submittedToday,
      subtitle: 'Reports submitted today',
      icon: AlertCircle,
      color: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20',
      link: '/admin/reports',
      linkText: 'View Reports',
      id: 'reports'
    },
    {
      title: 'Analytics',
      value: 'Dashboard',
      subtitle: 'Usage insights & traffic',
      icon: BarChart4,
      color: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
      link: '/admin/analytics',
      linkText: 'View Analytics',
      id: 'analytics'
    }
  ];

  const quickActions = [
    {
      title: 'Add New User',
      icon: UserIcon,
      link: '/admin/users/new',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Add New Bus',
      icon: Bus,
      link: '/admin/buses/new',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Manage Reports',
      icon: ClipboardList,
      link: '/admin/reports',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ];

  const systemStatus = [
    {
      title: 'Active Users',
      value: metrics.users.activeToday,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      title: 'Buses on Route',
      value: metrics.buses.onRoute,
      icon: Bus,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      title: 'Active Reports',
      value: metrics.reports.active,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30'
    },
    {
      title: 'System Status',
      value: 'Online',
      subtitle: 'Real-time monitoring active',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    }
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
        {/* Header Section */}
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="p-6">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex justify-between items-center"
            >
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground mt-2">Complete system overview and management center</p>
              </div>
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center gap-4"
              >
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-2xl px-6 py-3 shadow-lg border border-slate-200 dark:border-slate-700">
                  <Shield className="text-primary w-10 h-10 p-2 bg-primary/10 rounded-full" />
                  <div>
                    <p className="text-sm font-semibold">System Admin</p>
                    <p className="text-xs text-muted-foreground">Full Access</p>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg">
                      <Link href="/admin/settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        System Settings
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Access system configuration</TooltipContent>
                </Tooltip>
              </motion.div>
            </motion.div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Top Stat Cards */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-primary" />
              System Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  onHoverStart={() => setSelectedMetric(card.id)}
                  onHoverEnd={() => setSelectedMetric(null)}
                >
                  <Card className="rounded-3xl shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 hover:shadow-2xl transition-all duration-300 overflow-hidden relative group">
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-50 group-hover:opacity-70 transition-opacity duration-300`} />
                    <CardHeader className="pb-3 relative z-10">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-lg`}>
                            <card.icon className="h-5 w-5" />
                          </div>
                          {card.title}
                        </div>
                        <AnimatePresence>
                          {selectedMetric === card.id && (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 180 }}
                              transition={{ duration: 0.3 }}
                            >
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent mb-2">
                        {card.value}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {card.subtitle}
                      </div>
                    </CardContent>
                    <CardFooter className="relative z-10">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild 
                        className="w-full rounded-2xl border-2 hover:bg-white/50 dark:hover:bg-slate-700/50 backdrop-blur-sm transition-all duration-300"
                      >
                        <Link href={card.link}>{card.linkText}</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Plus className="h-6 w-6 text-green-500" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    asChild
                    variant="outline"
                    className="h-32 w-full rounded-3xl border-2 border-dashed hover:border-solid transition-all duration-300 shadow-lg hover:shadow-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                  >
                    <Link href={action.link} className="flex flex-col items-center justify-center gap-4">
                      <div className={`p-4 rounded-2xl ${action.bgColor} shadow-lg`}>
                        <action.icon className={`h-8 w-8 bg-gradient-to-br ${action.color} bg-clip-text text-transparent font-bold`} style={{ WebkitTextFillColor: 'transparent' }} />
                      </div>
                      <span className="font-semibold text-lg">{action.title}</span>
                    </Link>
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* System Status Overview */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Activity className="h-6 w-6 text-purple-500" />
              System Status Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {systemStatus.map((status, index) => (
                <motion.div
                  key={status.title}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Card className="rounded-3xl shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-xl ${status.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                            <status.icon className={`h-4 w-4 ${status.color}`} />
                          </div>
                          {status.title}
                        </div>
                        {status.title === 'System Status' && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 animate-pulse">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                            Live
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold mb-1 ${status.title === 'System Status' ? 'text-green-600' : 'text-slate-900 dark:text-white'}`}>
                        {status.value}
                      </div>
                      {status.subtitle && (
                        <p className="text-xs text-muted-foreground">{status.subtitle}</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity Timeline */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Clock className="h-6 w-6 text-indigo-500" />
              Recent Activity
            </h2>
            <Card className="rounded-3xl shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-sm">System monitoring active and running smoothly</span>
                    <Badge className="ml-auto bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Just now
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm">{metrics.buses.onRoute} buses currently active on routes</span>
                    <Badge className="ml-auto bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      5 min ago
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span className="text-sm">{metrics.reports.submittedToday} new reports submitted today</span>
                    <Badge className="ml-auto bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      1 hour ago
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Enhanced Global Styles */}
        <style jsx global>{`
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.5);
            border-radius: 3px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(156, 163, 175, 0.7);
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }

          .float-animation {
            animation: float 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    </TooltipProvider>
  );
}