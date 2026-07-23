'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { UpdateVendorStatusInput, UserDto } from '@app/shared';
import { apiClient } from '@/lib/api-client';
import { endpoints } from '@/lib/endpoints';
import { queryKeys } from '@/lib/query-client';
import { toQueryString } from '@/lib/utils';
import type { Paginated } from '@/features/services/hooks';

export interface VendorListQuery {
  page?: number;
  limit?: number;
  q?: string;
  [key: string]: unknown;
}

// Assumption: GET /api/users?role=vendor mirrors the pagination shape used
// everywhere else. Adjust in lib/endpoints.ts if the real API differs.
export function useVendors(query: VendorListQuery = {}) {
  return useQuery({
    queryKey: queryKeys.vendors(query),
    queryFn: () =>
      apiClient.get<Paginated<UserDto>>(`${endpoints.users.list}${toQueryString({ ...query, role: 'vendor' })}`),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateVendorStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string } & UpdateVendorStatusInput) =>
      apiClient.patch<UserDto>(endpoints.users.vendorStatus(id), { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success(variables.status === 'approved' ? 'Vendor approved' : 'Vendor rejected');
    },
    onError: (err: Error) => toast.error(err.message || 'Could not update the vendor.'),
  });
}
