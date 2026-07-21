'use client';

import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { createQueryClient } from '@/lib/query-client';
import { refreshAccessToken } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { useRealtimeUpdates } from '@/lib/socket-client';

/**
 * On first load the access token is empty (it only ever lives in memory), so
 * we silently attempt a refresh using the httpOnly refresh cookie before
 * declaring hydration complete. This is what makes "stay logged in across a
 * hard refresh" work without ever touching localStorage.
 *
 * This goes through refreshAccessToken()'s de-duplicated singleton (not a
 * fresh apiClient call) specifically so React StrictMode's dev-mode double
 * effect-invoke can't fire two real requests against the single-use,
 * rotating refresh token — see the comment on refreshAccessToken.
 */
function AuthBootstrap() {
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await refreshAccessToken();
      // setSession on success is handled inside refreshAccessToken itself.
      if (!cancelled && !token) clearSession();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useRealtimeUpdates();

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AuthBootstrap />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            classNames: {
              toast:
                'bg-surface border border-line text-ink font-body rounded-xl shadow-popover',
              title: 'font-medium',
              description: 'text-ink-soft',
            },
          }}
        />
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
