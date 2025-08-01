'use client';

import React from 'react';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchWithAdminAuth } from '@/lib/adminAuth';
import { parseUserFromToken } from '@/lib/auth';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Toaster, toast } from 'sonner';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Send,
  Paperclip,
  Download,
  UserCheck,
  MessageSquare,
  Clock,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
// Interfaces (reuse from list page, add needed fields)
interface SubmitterInfo {
  _id: string;
  name: string;
  role: string;
  profilePicture?: string;
  email?: string; // Add email if available
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
  relatedBusId?: { _id: string; busNumber: string };
  assignedTo?: SubmitterInfo | null; // Allow null for unassigned
  resolvedAt?: string;
  comments?: Comment[];
  updatedAt: string;
}

// Timeline Event Type
type TimelineEvent = {
  type: 'created' | 'comment' | 'assigned' | 'status_change' | 'resolved';
  timestamp: string;
  text: string;
  actor?: string;
  data?: unknown;
};

export default function ReportDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const adminUser = useMemo(() => parseUserFromToken(), []);
  const reportId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fetch report details
  useEffect(() => {
    if (!reportId) return;

    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchWithAdminAuth(`/admin/reports/${reportId}`);
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch report details');
        }
        setReport(data.report);
      } catch (error: unknown) {
        const typedError =
          error instanceof Error ? error : new Error('An unexpected error occurred');
        setError(typedError.message || 'An unexpected error occurred.');
        toast.error(typedError.message || 'Failed to load report details.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  // --- Action Handlers ---

  const handlePostComment = async () => {
    if (!newComment.trim() || !report) return;
    setIsPostingComment(true);
    try {
      const response = await fetchWithAdminAuth(`/admin/reports/${report._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: newComment, isInternal: isInternalComment }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to post comment');
      }
      // Add comment to local state
      setReport(prev =>
        prev ? { ...prev, comments: [...(prev.comments || []), result.comment] } : null
      );
      setNewComment('');
      setIsInternalComment(false);
      toast.success('Comment posted successfully.');
    } catch (error: unknown) {
      const typedError = error instanceof Error ? error : new Error('An unexpected error occurred');
      toast.error(typedError.message || 'Failed to post comment.');
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleAssignToMe = async () => {
    if (!report || !adminUser || !adminUser.id) {
      toast.error('Cannot assign report: Admin details missing or report not loaded.');
      return;
    }
    setIsAssigning(true);
    try {
      const response = await fetchWithAdminAuth(`/admin/reports/${report._id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: adminUser.id }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to assign report');
      }
      setReport(result.report);
      toast.success(`Report assigned to you.`);
    } catch (error: unknown) {
      const typedError = error instanceof Error ? error : new Error('An unexpected error occurred');
      toast.error(typedError.message || 'Failed to assign report.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUpdateStatus = async (newStatus: Report['status']) => {
    if (!report) return;
    setIsUpdatingStatus(true);
    try {
      const response = await fetchWithAdminAuth(`/admin/reports/${report._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update status');
      }
      setReport(result.report); // Update report with new status
      toast.success(`Report status updated to ${newStatus}.`);
    } catch (error: unknown) {
      const typedError = error instanceof Error ? error : new Error('An unexpected error occurred');
      toast.error(typedError.message || 'Failed to update status.');
    } finally {
      setIsUpdatingStatus(false);
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
    /* ... (copy from list page) ... */
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
      <Badge variant="outline" className={cn('text-xs capitalize font-semibold', styles[status])}>
        {status}
      </Badge>
    );
  };

  const renderPriorityBadge = (priority: Report['priority']) => {
    /* ... (copy from list page) ... */
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
        className={cn('text-xs capitalize flex items-center gap-1 font-semibold', styles[priority])}
      >
        <Icon className="h-3 w-3" />
        {priority}
      </Badge>
    );
  };

  const renderReportIcon = (type: Report['type']) => {
    /* ... (copy from list page) ... */
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
    return <Icon className={cn('h-5 w-5 mr-2 flex-shrink-0', colors[type])} />;
  };

  // --- Generate Timeline ---
  const generateTimelineEvents = (): TimelineEvent[] => {
    if (!report) return [];
    const events: TimelineEvent[] = [];

    // Report Created
    events.push({
      type: 'created',
      timestamp: report.submittedAt,
      text: 'Report Created',
      actor: report.submittedBy.name,
    });

    // Comments
    report.comments?.forEach(comment => {
      events.push({
        type: 'comment',
        timestamp: comment.createdAt,
        text: comment.isInternal ? 'Internal note added' : 'Comment added',
        actor: comment.createdBy.name,
        data: comment.comment,
      });
    });

    if (report.assignedTo) {
      events.push({
        type: 'assigned',
        timestamp: report.updatedAt,
        text: 'Assigned to',
        actor: report.assignedTo.name,
      });
    }

    // Status changes (Need history, approximating with updatedAt)
    if (report.status !== 'pending') {
      events.push({
        type: 'status_change',
        timestamp: report.updatedAt, // Approximation
        text: `Status changed to ${report.status}`,
      });
    }

    // Resolved
    if (report.resolvedAt) {
      events.push({
        type: 'resolved',
        timestamp: report.resolvedAt,
        text: 'Report Resolved',
        actor: report.assignedTo?.name,
      });
    }

    // Sort events chronologically
    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const timelineEvents = generateTimelineEvents();

  // --- Loading/Error States ---
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/reports')}
            aria-label="Go Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Error</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Report</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  if (!report) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/reports')}
            aria-label="Go Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Report Not Found</h1>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>The requested report could not be found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/reports')}
            aria-label="Go Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Report Details</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Update Status Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isUpdatingStatus} className="gap-1.5">
                {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Set Status</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={report.status}
                onValueChange={value => handleUpdateStatus(value as Report['status'])}
              >
                <DropdownMenuRadioItem value="pending">Pending</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="reviewing">Reviewing</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="resolved">Resolved</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dismissed">Dismissed</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Assign Button */}
          {!report.assignedTo && (
            <Button onClick={handleAssignToMe} disabled={isAssigning} className="gap-1.5">
              {isAssigning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserCheck className="mr-2 h-4 w-4" />
              )}
              Assign to Me
            </Button>
          )}
          {/* Add unassign/reassign later if needed */}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Report + Comments) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Details Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {renderReportIcon(report.type)}
                  <span className="text-sm font-medium capitalize">{report.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  {renderStatusBadge(report.status)}
                  {renderPriorityBadge(report.priority)}
                </div>
              </div>
              <CardTitle className="text-xl pt-2">{report.title}</CardTitle>
              <CardDescription>
                Submitted on {format(new Date(report.submittedAt), "PPP 'at' p")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4 whitespace-pre-wrap">{report.description}</p>
              {report.relatedBusId && (
                <p className="text-sm text-muted-foreground mb-4">
                  Related Bus:{' '}
                  <Link
                    href={`/admin/buses/${report.relatedBusId._id}`}
                    className="text-primary hover:underline"
                  >
                    {report.relatedBusId.busNumber}
                  </Link>
                </p>
              )}
              {report.attachments && report.attachments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Attachments</h4>
                  <ul className="space-y-1">
                    {report.attachments.map((att, index) => (
                      <li key={index} className="text-sm">
                        <a
                          href={att}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:underline bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md"
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          {/* Basic filename extraction */}
                          {att.substring(att.lastIndexOf('/') + 1)}
                          <Download className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments Card */}
          <Card>
            <CardHeader>
              <CardTitle>Comments & Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Comments */}
              {report.comments && report.comments.length > 0 ? (
                report.comments.map(comment => (
                  <div key={comment._id} className="flex gap-3">
                    <Avatar className="h-9 w-9 border">
                      <AvatarImage
                        src={comment.createdBy?.profilePicture}
                        alt={comment.createdBy?.name}
                      />
                      <AvatarFallback>{getInitials(comment.createdBy?.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 rounded-md border bg-muted/30 dark:bg-muted/50 p-3">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-semibold">
                          {comment.createdBy?.name}{' '}
                          <span className="text-xs text-muted-foreground ml-1">
                            ({comment.createdBy?.role})
                          </span>
                        </p>
                        <div className="flex items-center gap-2">
                          {comment.isInternal && (
                            <Badge variant="secondary" className="text-xs">
                              Internal Note
                            </Badge>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  No comments yet.
                </p>
              )}

              {/* Add Comment Form */}
              <div className="pt-4 border-t">
                <Label htmlFor="newComment" className="sr-only">
                  Add Comment
                </Label>
                <Textarea
                  id="newComment"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment or note..."
                  rows={3}
                  disabled={isPostingComment}
                  className="mb-2"
                />
                <Label htmlFor="isInternalNote" className="text-xs text-muted-foreground">
                  Mark as internal note (not visible to reporter)
                </Label>
                <span
                  className="text-xs text-muted-foreground cursor-pointer"
                  onClick={() => setIsInternalComment(!isInternalComment)}
                >
                  Mark as internal note (not visible to reporter)
                </span>
                <Button
                  onClick={handlePostComment}
                  disabled={isPostingComment || !newComment.trim()}
                  size="sm"
                >
                  {isPostingComment ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Post Comment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Reporter, Assignment, Timeline) */}
        <div className="space-y-6">
          {/* Reporter Card */}
          <Card>
            <CardHeader>
              <CardTitle>Reporter Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <Avatar className="h-16 w-16 mb-3 border-2">
                <AvatarImage
                  src={report.submittedBy?.profilePicture}
                  alt={report.submittedBy?.name}
                />
                <AvatarFallback className="text-xl">
                  {getInitials(report.submittedBy?.name)}
                </AvatarFallback>
              </Avatar>
              <p className="font-semibold">{report.submittedBy?.name || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">
                {report.submittedBy?.email || 'No email'}
              </p>
              <Badge variant="outline" className="mt-2 capitalize">
                {report.submittedBy?.role || 'N/A'}
              </Badge>
              <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                <Link href={`/admin/users/${report.submittedBy._id}`}>View Profile</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Assignment Card */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              {report.assignedTo ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage
                      src={report.assignedTo.profilePicture}
                      alt={report.assignedTo.name}
                    />
                    <AvatarFallback>{getInitials(report.assignedTo.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Assigned to {report.assignedTo.name}</p>
                    <p className="text-xs text-muted-foreground">({report.assignedTo.role})</p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    This report is not assigned to anyone
                  </p>
                  <Button onClick={handleAssignToMe} disabled={isAssigning} size="sm">
                    {isAssigning ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserCheck className="mr-2 h-4 w-4" />
                    )}
                    Assign to Me
                  </Button>
                </div>
              )}
              {/* Add unassign/reassign options here later */}
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {timelineEvents.map((event, index) => (
                  <li key={index} className="flex gap-3">
                    <div className="relative flex h-full flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-primary mt-1"></div>
                      {index < timelineEvents.length - 1 && (
                        <div className="h-full w-px bg-border mt-1"></div>
                      )}
                    </div>
                    <div className="pb-4 flex-1">
                      <p className="text-sm font-medium">
                        {event.text}{' '}
                        {event.type === 'assigned' && event.actor ? ` ${event.actor}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}{' '}
                        {event.actor && event.type !== 'assigned' ? `by ${event.actor}` : ''}
                      </p>
                      {/* Optionally show comment data for comment events */}
                      {event.type === 'comment' && typeof event.data === 'string' && (
                        <p className="mt-1 text-xs italic text-muted-foreground bg-muted p-2 rounded-md">
                          "
                          {event.data.length > 50
                            ? event.data.substring(0, 50) + '...'
                            : event.data}
                          "
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
