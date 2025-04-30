'use client';

import React from 'react';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAdminAuth } from '@/lib/adminAuth';
import { parseUserFromToken } from '@/lib/auth';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster, toast } from 'sonner';
import {
  ArrowLeft,
  Loader2,
  Search,
  MoreHorizontal,
  Eye,
  Filter,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  AlertCircle,
  Clock,
  HelpCircle, // Icons for report types
  ChevronUp,
  ChevronDown,
  ChevronsUpDown, // Priority Icons
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
// Interfaces based on backend Report model and population
interface SubmitterInfo {
  _id: string;
  name: string;
  role: string;
  profilePicture?: string;
}

interface Comment {
  _id: string;
  comment: string;
  createdBy: SubmitterInfo; // Assuming createdBy is populated
  createdAt: string;
  isInternal: boolean;
}

interface Report {
  _id: string;
  title: string;
  description: string;
  submittedBy: SubmitterInfo;
  submittedAt: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'maintenance' | 'emergency' | 'complaint' | 'feedback';
  attachments?: string[];
  relatedBusId?: { _id: string; busNumber: string }; // Populated bus info
  assignedTo?: SubmitterInfo;
  resolvedAt?: string;
  comments?: Comment[];
  updatedAt: string;
}

type SortField =
  | keyof Pick<
      Report,
      'title' | 'submittedAt' | 'priority' | 'status' | 'type' | 'updatedAt' | 'resolvedAt'
    >
  | 'submittedBy.name'
  | 'assignedTo.name';

export default function ReportManagement() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('submittedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // Default newest first

  // Get current admin user
  const adminUser = useMemo(() => parseUserFromToken(), []);

  // --- Define Sorting function BEFORE useMemo that calls it ---
  // Wrap sortReports in useCallback to stabilize its reference
  const sortReports = useCallback(
    (reportsToSort: Report[], field: SortField, direction: 'asc' | 'desc'): Report[] => {
      const priorityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
      return [...reportsToSort].sort((a, b) => {
        // Use spread to avoid mutating original order
        let comparison = 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let valA: any, valB: any;

        // Handle nested fields
        if (field === 'submittedBy.name') {
          valA = a.submittedBy?.name ?? '';
          valB = b.submittedBy?.name ?? '';
        } else if (field === 'assignedTo.name') {
          valA = a.assignedTo?.name ?? '';
          valB = b.assignedTo?.name ?? '';
        } else {
          valA = a[field as keyof Report];
          valB = b[field as keyof Report];
        }

        // Perform comparison based on type
        if (field === 'priority') {
          comparison = (priorityOrder[a.priority] ?? 0) - (priorityOrder[b.priority] ?? 0);
        } else if (field === 'submittedAt' || field === 'updatedAt' || field === 'resolvedAt') {
          // Ensure values are valid dates before getTime()
          const dateA = valA && !isNaN(new Date(valA).getTime()) ? new Date(valA).getTime() : 0;
          const dateB = valB && !isNaN(new Date(valB).getTime()) ? new Date(valB).getTime() : 0;
          comparison = dateA - dateB;
        } else {
          // Default to string comparison
          comparison = String(valA ?? '').localeCompare(String(valB ?? ''));
        }

        return direction === 'asc' ? comparison : comparison * -1;
      });
    },
    []
  ); // Empty dependency array as it doesn't depend on component state/props

  // Fetch reports
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const response = await fetchWithAdminAuth('/admin/reports');
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch reports');
        }
        setReports(data.reports || []);
      } catch (error: unknown) {
        const typedError =
          error instanceof Error ? error : new Error('An unexpected error occurred');
        toast.error(typedError.message || 'Failed to load reports.');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let result = [...reports];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        report =>
          report.title.toLowerCase().includes(search) ||
          report.description.toLowerCase().includes(search) ||
          report.submittedBy?.name.toLowerCase().includes(search) ||
          report.assignedTo?.name.toLowerCase().includes(search)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(report => report.status === statusFilter);
    }
    if (typeFilter !== 'all') {
      result = result.filter(report => report.type === typeFilter);
    }
    if (priorityFilter !== 'all') {
      result = result.filter(report => report.priority === priorityFilter);
    }

    // Apply sorting
    result = sortReports(result, sortField, sortDirection);

    setFilteredReports(result);
  }, [
    reports,
    searchTerm,
    statusFilter,
    typeFilter,
    priorityFilter,
    sortField,
    sortDirection,
    sortReports,
  ]);

  // Calculate "My Reports" - derived state
  const myReports = useMemo(() => {
    if (!adminUser?.id) return [];
    const assigned = reports.filter(report => report.assignedTo?._id === adminUser.id);
    // Apply sorting to "My Reports" as well
    return sortReports(assigned, sortField, sortDirection);
  }, [reports, adminUser, sortField, sortDirection, sortReports]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'submittedAt' ? 'desc' : 'asc'); // Default sort direction based on field
    }
  };

  // --- Render Helpers ---
  const getInitials = (name: string = '') =>
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();

  const renderStatusBadge = (status: Report['status']) => {
    const styles: Record<Report['status'], string> = {
      pending:
        'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700',
      reviewing:
        'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700',
      resolved:
        'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
      dismissed:
        'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    };
    return (
      <Badge variant="outline" className={cn('text-xs capitalize', styles[status])}>
        {status}
      </Badge>
    );
  };

  const renderPriorityBadge = (priority: Report['priority']) => {
    const styles: Record<Report['priority'], string> = {
      low: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
      medium:
        'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700',
      high: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700',
      critical:
        'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
    };
    const icons: Record<Report['priority'], React.ElementType> = {
      low: ChevronDown,
      medium: ChevronsUpDown,
      high: ChevronUp,
      critical: AlertCircle,
    };
    const Icon = icons[priority];
    return (
      <Badge
        variant="outline"
        className={cn('text-xs capitalize flex items-center gap-1', styles[priority])}
      >
        <Icon className="h-3 w-3" />
        {priority}
      </Badge>
    );
  };

  const renderReportIcon = (type: Report['type']) => {
    const icons: Record<Report['type'], React.ElementType> = {
      maintenance: Clock,
      emergency: AlertCircle,
      complaint: MessageSquare,
      feedback: HelpCircle,
    };
    const colors: Record<Report['type'], string> = {
      maintenance: 'text-blue-500',
      emergency: 'text-red-500',
      complaint: 'text-orange-500',
      feedback: 'text-green-500',
    };
    const Icon = icons[type];
    return <Icon className={cn('h-5 w-5 mr-3 flex-shrink-0', colors[type])} />;
  };

  // --- Helper component for rendering the reports table (to avoid duplication) ---
  const ReportsTable = ({ reportsToDisplay }: { reportsToDisplay: Report[] }) => {
    if (loading && reportsToDisplay.length === 0) {
      // Show loader only if initial load or empty during load
      return (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }
    if (!loading && reportsToDisplay.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground">
          No reports found matching the criteria.
        </div>
      );
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">
              <Button variant="ghost" onClick={() => handleSort('title')} className="px-1">
                Title
                {sortField === 'title' &&
                  (sortDirection === 'asc' ? (
                    <ArrowUp className="ml-2 h-3 w-3" />
                  ) : (
                    <ArrowDown className="ml-2 h-3 w-3" />
                  ))}
              </Button>
            </TableHead>
            <TableHead className="w-[120px]">
              <Button variant="ghost" onClick={() => handleSort('status')} className="px-1">
                Status
                {sortField === 'status' &&
                  (sortDirection === 'asc' ? (
                    <ArrowUp className="ml-2 h-3 w-3" />
                  ) : (
                    <ArrowDown className="ml-2 h-3 w-3" />
                  ))}
              </Button>
            </TableHead>
            <TableHead className="w-[120px]">
              <Button variant="ghost" onClick={() => handleSort('priority')} className="px-1">
                Priority
                {sortField === 'priority' &&
                  (sortDirection === 'asc' ? (
                    <ArrowUp className="ml-2 h-3 w-3" />
                  ) : (
                    <ArrowDown className="ml-2 h-3 w-3" />
                  ))}
              </Button>
            </TableHead>
            <TableHead className="w-[150px]">
              <Button variant="ghost" onClick={() => handleSort('type')} className="px-1">
                Type
                {sortField === 'type' &&
                  (sortDirection === 'asc' ? (
                    <ArrowUp className="ml-2 h-3 w-3" />
                  ) : (
                    <ArrowDown className="ml-2 h-3 w-3" />
                  ))}
              </Button>
            </TableHead>
            <TableHead className="w-[180px]">
              <Button
                variant="ghost"
                onClick={() => handleSort('submittedBy.name')}
                className="px-1"
              >
                Submitted By
                {sortField === 'submittedBy.name' &&
                  (sortDirection === 'asc' ? (
                    <ArrowUp className="ml-2 h-3 w-3" />
                  ) : (
                    <ArrowDown className="ml-2 h-3 w-3" />
                  ))}
              </Button>
            </TableHead>
            <TableHead className="w-[180px]">
              <Button
                variant="ghost"
                onClick={() => handleSort('assignedTo.name')}
                className="px-1"
              >
                Assigned To
                {sortField === 'assignedTo.name' &&
                  (sortDirection === 'asc' ? (
                    <ArrowUp className="ml-2 h-3 w-3" />
                  ) : (
                    <ArrowDown className="ml-2 h-3 w-3" />
                  ))}
              </Button>
            </TableHead>
            <TableHead className="w-[150px]">
              <Button variant="ghost" onClick={() => handleSort('submittedAt')} className="px-1">
                Submitted Date
                {sortField === 'submittedAt' &&
                  (sortDirection === 'asc' ? (
                    <ArrowUp className="ml-2 h-3 w-3" />
                  ) : (
                    <ArrowDown className="ml-2 h-3 w-3" />
                  ))}
              </Button>
            </TableHead>
            <TableHead className="w-[150px]">
              <Button variant="ghost" onClick={() => handleSort('updatedAt')} className="px-1">
                Last Updated
                {sortField === 'updatedAt' &&
                  (sortDirection === 'asc' ? (
                    <ArrowUp className="ml-2 h-3 w-3" />
                  ) : (
                    <ArrowDown className="ml-2 h-3 w-3" />
                  ))}
              </Button>
            </TableHead>
            <TableHead className="w-[150px]">
              <Button variant="ghost" onClick={() => handleSort('resolvedAt')} className="px-1">
                Resolved Date
                {sortField === 'resolvedAt' &&
                  (sortDirection === 'asc' ? (
                    <ArrowUp className="ml-2 h-3 w-3" />
                  ) : (
                    <ArrowDown className="ml-2 h-3 w-3" />
                  ))}
              </Button>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reportsToDisplay.map(report => (
            <TableRow key={report._id}>
              <TableCell className="font-medium">
                <div className="flex items-center">
                  {renderReportIcon(report.type)}
                  <span className="truncate" title={report.title}>
                    {report.title}
                  </span>
                </div>
              </TableCell>
              <TableCell>{renderStatusBadge(report.status)}</TableCell>
              <TableCell>{renderPriorityBadge(report.priority)}</TableCell>
              <TableCell className="capitalize">{report.type}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7 border">
                    <AvatarImage
                      src={report.submittedBy?.profilePicture}
                      alt={report.submittedBy?.name}
                    />
                    <AvatarFallback>{getInitials(report.submittedBy?.name)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate" title={report.submittedBy?.name}>
                    {report.submittedBy?.name || 'N/A'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {report.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7 border">
                      <AvatarImage
                        src={report.assignedTo.profilePicture}
                        alt={report.assignedTo.name}
                      />
                      <AvatarFallback>{getInitials(report.assignedTo.name)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate" title={report.assignedTo.name}>
                      {report.assignedTo.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Unassigned</span>
                )}
              </TableCell>
              <TableCell>
                <span title={format(new Date(report.submittedAt), 'Pp')}>
                  {format(new Date(report.submittedAt), 'PP')}
                </span>
              </TableCell>
              <TableCell>
                <span title={format(new Date(report.updatedAt), 'Pp')}>
                  {format(new Date(report.updatedAt), 'PP')}
                </span>
              </TableCell>
              <TableCell>
                {report.resolvedAt ? (
                  <span title={format(new Date(report.resolvedAt), 'Pp')}>
                    {format(new Date(report.resolvedAt), 'PP')}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground italic">N/A</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/admin/reports/${report._id}`)}>
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </DropdownMenuItem>
                    {/* Add other actions like Assign, Update Status if needed directly here */}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="p-6 max-w-full mx-auto">
      <Toaster position="top-right" richColors />
      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin')}
            aria-label="Go Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Manage Reports</h1>
        </div>
        {/* Maybe Add Report button later? */}
      </div>

      {/* Filter/Search Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-grow relative w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports by title, description, submitter..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            {/* Filter Dropdown Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1.5 w-full md:w-auto">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Filter By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Status Filter */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                        <DropdownMenuRadioItem value="all">All Statuses</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="pending">Pending</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="reviewing">Reviewing</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="resolved">Resolved</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="dismissed">Dismissed</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                {/* Type Filter */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Type</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={typeFilter} onValueChange={setTypeFilter}>
                        <DropdownMenuRadioItem value="all">All Types</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="maintenance">
                          Maintenance
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="emergency">Emergency</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="complaint">Complaint</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="feedback">Feedback</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                {/* Priority Filter */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Priority</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup
                        value={priorityFilter}
                        onValueChange={setPriorityFilter}
                      >
                        <DropdownMenuRadioItem value="all">All Priorities</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="low">Low</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="high">High</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="critical">Critical</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for All Reports / My Reports */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="my-reports">My Assigned Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Reports</CardTitle>
              <CardDescription>Browse and manage all submitted reports.</CardDescription>
            </CardHeader>
            <CardContent>
              <ReportsTable reportsToDisplay={filteredReports} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="my-reports">
          <Card>
            <CardHeader>
              <CardTitle>My Assigned Reports</CardTitle>
              <CardDescription>
                Reports currently assigned to you for review or action.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {adminUser ? (
                <ReportsTable reportsToDisplay={myReports} />
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  Could not identify admin user to show assigned reports.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
