'use client';

import { useState } from 'react';
import { BOOKING_STATUS_TRANSITIONS, type BookingStatus } from '@app/shared';
import { Button, type ButtonProps } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateBookingStatus } from './hooks';

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  reviewed: 'Reviewed',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export interface AdminStatusControlProps {
  bookingId: string;
  currentStatus: BookingStatus;
  triggerLabel?: string;
  triggerSize?: ButtonProps['size'];
  triggerVariant?: ButtonProps['variant'];
  /** Renders no trigger button and is driven entirely by these — for "click a table row to open" patterns. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AdminStatusControl({
  bookingId,
  currentStatus,
  triggerLabel = 'Change status',
  triggerSize = 'md',
  triggerVariant = 'primary',
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: AdminStatusControlProps) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<BookingStatus | ''>('');
  const [note, setNote] = useState('');
  const updateStatus = useUpdateBookingStatus(bookingId);
  const allowed = BOOKING_STATUS_TRANSITIONS[currentStatus];

  const open = isControlled ? controlledOpen : internalOpen;

  function handleOpenChange(next: boolean) {
    if (isControlled) {
      setControlledOpen?.(next);
    } else {
      setInternalOpen(next);
    }
    if (!next) {
      setNextStatus('');
      setNote('');
    }
  }

  if (allowed.length === 0) {
    // No forward transitions available (completed/cancelled) — nothing to control.
    return isControlled ? null : null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button
            size={triggerSize}
            variant={triggerVariant}
            onClick={(e) => {
              // Table rows using this control inside a clickable <tr> need the
              // trigger click to not also bubble into a row-level handler.
              e.stopPropagation();
            }}
          >
            {triggerLabel}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Update booking status</DialogTitle>
          <DialogDescription>
            This moves the booking to a new stage and notifies the client in real time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="next-status">New status</Label>
            <Select value={nextStatus} onValueChange={(v) => setNextStatus(v as BookingStatus)}>
              <SelectTrigger id="next-status">
                <SelectValue placeholder="Choose a status" />
              </SelectTrigger>
              <SelectContent>
                {allowed.map((status) => (
                  <SelectItem key={status} value={status}>
                    {BOOKING_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add context for this change…" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!nextStatus}
            isLoading={updateStatus.isPending}
            onClick={() => {
              if (!nextStatus) return;
              updateStatus.mutate(
                { status: nextStatus, note: note || undefined },
                { onSuccess: () => handleOpenChange(false) },
              );
            }}
          >
            Update status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
