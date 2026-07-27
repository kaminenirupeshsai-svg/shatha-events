import { QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function createQueryClient() {
  return new QueryClient({
    // Mutations already toast their own errors at the call site; queries
    // didn't, so a failed fetch used to render silently as an empty state
    // (a list page showing "No bookings found" when the request actually
    // 404/500'd, with nothing telling the user it wasn't real). This is the
    // one place that covers every query in the app at once.
    queryCache: new QueryCache({
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Something went wrong loading this page.');
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

// Centralized query keys so invalidation (e.g. from socket-client) never
// relies on stringly-typed guesses scattered across features/*.
export const queryKeys = {
  me: ['me'] as const,
  services: (query?: Record<string, unknown>) => ['services', query ?? {}] as const,
  service: (id: string) => ['services', id] as const,
  myBookings: (query?: Record<string, unknown>) => ['bookings', 'my', query ?? {}] as const,
  vendorBookings: (query?: Record<string, unknown>) => ['bookings', 'vendor', query ?? {}] as const,
  allBookings: (query?: Record<string, unknown>) => ['bookings', 'all', query ?? {}] as const,
  booking: (id: string) => ['bookings', id] as const,
  notifications: (query?: Record<string, unknown>) => ['notifications', query ?? {}] as const,
  // Prefixed with 'notifications' (not a sibling top-level key) so the
  // broad `invalidateQueries({ queryKey: ['notifications'] })` calls after
  // mark-read/mark-all-read already catch this too, with no extra wiring.
  unreadNotificationCount: ['notifications', 'unread-count'] as const,
  vendors: (query?: Record<string, unknown>) => ['vendors', query ?? {}] as const,
  adminStats: ['admin', 'stats'] as const,
};
