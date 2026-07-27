'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CreateReviewInput, PaginationQuery, ReviewDto } from '@app/shared';
import { apiClient } from '@/lib/api-client';
import { endpoints } from '@/lib/endpoints';
import { queryKeys } from '@/lib/query-client';
import { toQueryString } from '@/lib/utils';
import type { Paginated } from '@/features/services/hooks';

export function useBookingReviews(bookingId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.bookingReviews(bookingId ?? ''),
    queryFn: () => apiClient.get<ReviewDto[]>(endpoints.bookings.reviews(bookingId as string)),
    enabled: Boolean(bookingId),
  });
}

export function useServiceReviews(serviceId: string | undefined, query: Partial<PaginationQuery> = {}) {
  return useQuery({
    queryKey: queryKeys.serviceReviews(serviceId ?? '', query),
    queryFn: () =>
      apiClient.get<Paginated<ReviewDto>>(`${endpoints.services.reviews(serviceId as string)}${toQueryString(query)}`),
    enabled: Boolean(serviceId),
  });
}

export function useCreateReview(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) => apiClient.post<ReviewDto>(endpoints.bookings.reviews(bookingId), input),
    onSuccess: () => {
      // Broad prefixes (not the full paginated-query key) so every cached
      // page/filter variant is caught, not just the one with an exact
      // matching query object - same pattern as the services/bookings
      // invalidations elsewhere in this file.
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Thanks for your review');
    },
    onError: (err: Error) => toast.error(err.message || 'Could not submit your review.'),
  });
}
