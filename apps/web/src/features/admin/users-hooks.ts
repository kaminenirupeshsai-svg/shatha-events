'use client';

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { UserDto } from '@app/shared';
import { apiClient } from '@/lib/api-client';
import { endpoints } from '@/lib/endpoints';
import { queryKeys } from '@/lib/query-client';
import { toQueryString } from '@/lib/utils';
import type { Paginated } from '@/features/services/hooks';

export interface AllUsersQuery {
  page?: number;
  limit?: number;
  q?: string;
  role?: 'client' | 'vendor' | 'admin';
  [key: string]: unknown;
}

/** Admin-only: every user regardless of role (omitting `role` returns all of them). */
export function useAllUsers(query: AllUsersQuery = {}) {
  return useQuery({
    queryKey: queryKeys.allUsers(query),
    queryFn: () => apiClient.get<Paginated<UserDto>>(`${endpoints.users.list}${toQueryString(query)}`),
    placeholderData: keepPreviousData,
  });
}

export function useSetUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch<UserDto>(endpoints.users.setActive(id), { isActive }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success(variables.isActive ? 'Account reactivated' : 'Account deactivated');
    },
    onError: (err: Error) => toast.error(err.message || 'Could not update the account.'),
  });
}
