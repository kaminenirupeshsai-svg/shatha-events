'use client';

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  BookingDto,
  BookingListQuery,
  CreateBookingInput,
  UpdateBookingStatusInput,
} from '@app/shared';
import { apiClient } from '@/lib/api-client';
import { endpoints } from '@/lib/endpoints';
import { queryKeys } from '@/lib/query-client';
import { toQueryString } from '@/lib/utils';
import type { Paginated } from '@/features/services/hooks';

export function useMyBookings(query: Partial<BookingListQuery> = {}) {
  return useQuery({
    queryKey: queryKeys.myBookings(query),
    queryFn: () => apiClient.get<Paginated<BookingDto>>(`${endpoints.bookings.my}${toQueryString(query)}`),
    placeholderData: keepPreviousData,
  });
}

export function useVendorBookings(query: Partial<BookingListQuery> = {}) {
  return useQuery({
    queryKey: queryKeys.vendorBookings(query),
    queryFn: () => apiClient.get<Paginated<BookingDto>>(`${endpoints.bookings.vendor}${toQueryString(query)}`),
    placeholderData: keepPreviousData,
  });
}

export function useAllBookings(query: Partial<BookingListQuery> = {}) {
  return useQuery({
    queryKey: queryKeys.allBookings(query),
    queryFn: () => apiClient.get<Paginated<BookingDto>>(`${endpoints.bookings.all}${toQueryString(query)}`),
    placeholderData: keepPreviousData,
  });
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.booking(id ?? ''),
    queryFn: () => apiClient.get<BookingDto>(endpoints.bookings.detail(id as string)),
    enabled: Boolean(id),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookingInput) => apiClient.post<BookingDto>(endpoints.bookings.create, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking submitted — our team will review it shortly');
    },
    onError: (err: Error) => toast.error(err.message || 'Could not submit your booking request.'),
  });
}

export function useUpdateBookingStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBookingStatusInput) =>
      apiClient.patch<BookingDto>(endpoints.bookings.updateStatus(id), input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success(`Booking marked as "${data.status.replace('_', ' ')}"`);
    },
    onError: (err: Error) => toast.error(err.message || 'Could not update the booking status.'),
  });
}

export function useCancelBooking(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (note?: string) =>
      apiClient.patch<BookingDto>(endpoints.bookings.updateStatus(id), { status: 'cancelled', note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking cancelled');
    },
    onError: (err: Error) => toast.error(err.message || 'Could not cancel the booking.'),
  });
}
