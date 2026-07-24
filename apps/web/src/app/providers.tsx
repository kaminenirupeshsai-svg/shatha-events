'use client';

import { useEffect, useRef, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider, useTheme } from 'next-themes';
import { Toaster } from 'sonner';
import { createQueryClient } from '@/lib/query-client';
import { refreshAccessToken } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { useRealtimeUpdates } from '@/lib/socket-client';
import { useMe } from '@/features/auth/hooks';

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

/**
 * next-themes persists purely to localStorage, entirely independent of the
 * account's saved `theme` preference (updated via Settings) - so logging in
 * on a different browser/device never actually applied it anywhere, only
 * stored it. This applies the account's preference once per login (keyed by
 * user id, so switching accounts on a shared device re-syncs too) without
 * fighting further manual changes for that same session.
 */
function ThemeSync() {
  const { data: user } = useMe();
  const { theme, setTheme } = useTheme();
  const syncedForUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user || syncedForUserId.current === user.id) return;
    syncedForUserId.current = user.id;
    if (user.theme !== theme) setTheme(user.theme);
  }, [user, theme, setTheme]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AuthBootstrap />
        <ThemeSync />
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
