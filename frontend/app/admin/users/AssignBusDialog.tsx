'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithAdminAuth } from '@/lib/adminAuth';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: { _id: string; name: string } | null;
}

export default function AssignBusDialog({ open, onOpenChange, student }: Props) {
  const [buses, setBuses] = useState<{ _id: string; bus_id: string }[]>([]);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchBuses = async () => {
      try {
        const res = await fetchWithAdminAuth('/admin/buses');
        const data = await res.json();
        if (data.buses) setBuses(data.buses);
      } catch {
        toast.error('Failed to load buses.');
      }
    };
    fetchBuses();
  }, [open]);

  const assignStudent = async () => {
    if (!student || !selectedBusId) return;
    try {
      setLoading(true);
      const res = await fetchWithAdminAuth(`/admin/bus/${selectedBusId}/assign-students`, {
        method: 'PUT',
        body: JSON.stringify({ studentIds: [student._id] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign student');
      toast.success(`${student.name} assigned to bus ${selectedBusId}`);
      onOpenChange(false);
      setSelectedBusId('');
    } catch (err: any) {
      toast.error(err.message || 'Error during assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign {student?.name} to a Bus</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={selectedBusId} onValueChange={setSelectedBusId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a bus..." />
            </SelectTrigger>
            <SelectContent>
              {buses.map(bus => (
                <SelectItem key={bus._id} value={bus._id}>
                  {bus.bus_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            disabled={!selectedBusId || loading}
            onClick={assignStudent}
            className="w-full"
          >
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assigning...</> : 'Assign'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
