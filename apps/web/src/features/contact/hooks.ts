'use client';

import { useMutation } from '@tanstack/react-query';
import type { ContactInput } from '@app/shared';
import { apiClient } from '@/lib/api-client';
import { endpoints } from '@/lib/endpoints';

export function useSubmitContact() {
  return useMutation({
    mutationFn: (input: ContactInput) =>
      apiClient.post<{ message?: string }>(endpoints.contact.submit, input, { skipAuth: true }),
  });
}
