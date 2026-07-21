'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { UserDto } from '@app/shared';
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
