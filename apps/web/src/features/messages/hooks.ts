'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CreateMessageInput, MessageDto } from '@app/shared';
import { apiClient } from '@/lib/api-client';
import { endpoints } from '@/lib/endpoints';
import { queryKeys } from '@/lib/query-client';

export function useMessageThread(bookingId: string, vendorId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.messageThread(bookingId, vendorId ?? ''),
    queryFn: () => apiClient.get<MessageDto[]>(endpoints.bookings.messages(bookingId, vendorId as string)),
    enabled: enabled && Boolean(vendorId),
    // Messages arrive live over the socket (see socket-client.ts), which
    // invalidates this same key - a short poll is just a safety net for a
    // dropped connection, not the primary way updates show up.
    refetchInterval: 15_000,
  });
}

export function useSendMessage(bookingId: string, vendorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMessageInput) =>
      apiClient.post<MessageDto>(endpoints.bookings.messages(bookingId, vendorId), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messageThread(bookingId, vendorId) });
    },
    onError: (err: Error) => toast.error(err.message || 'Could not send your message.'),
  });
}
