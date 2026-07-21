'use client';

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  CreateServiceInput,
  ServiceDto,
  ServiceListQuery,
  UpdateServiceInput,
} from '@app/shared';
import { apiClient } from '@/lib/api-client';
import { endpoints } from '@/lib/endpoints';
import { queryKeys } from '@/lib/query-client';
import { toQueryString } from '@/lib/utils';

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useServices(query: Partial<ServiceListQuery> = {}) {
  return useQuery({
    queryKey: queryKeys.services(query),
    queryFn: () => apiClient.get<Paginated<ServiceDto>>(`${endpoints.services.list}${toQueryString(query)}`),
    placeholderData: keepPreviousData,
  });
}

export function useService(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.service(id ?? ''),
    queryFn: () => apiClient.get<ServiceDto>(endpoints.services.detail(id as string)),
    enabled: Boolean(id),
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateServiceInput) => apiClient.post<ServiceDto>(endpoints.services.create, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service listing created');
    },
    onError: (err: Error) => toast.error(err.message || 'Could not create the service.'),
  });
}

export function useUpdateService(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateServiceInput) => apiClient.patch<ServiceDto>(endpoints.services.update(id), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service listing updated');
    },
    onError: (err: Error) => toast.error(err.message || 'Could not update the service.'),
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(endpoints.services.remove(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service listing deleted');
    },
    onError: (err: Error) => toast.error(err.message || 'Could not delete the service.'),
  });
}
