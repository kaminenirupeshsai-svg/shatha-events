'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/features/auth/hooks';
import { useAuthStore } from '@/lib/auth-store';
import { Sidebar } from '@/components/shared/sidebar';
import { Topbar } from '@/components/shared/topbar';
import { PageTransition } from '@/components/shared/page-transition';
import { FullScreenLoader } from '@/components/shared/full-screen-loader';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const { data: user, isLoading } = useMe();

  const ready = !isHydrating && !isLoading;

  useEffect(() => {
    if (ready && !user) {
      router.replace('/login');
    }
  }, [ready, user, router]);

  // Covers: still hydrating, still loading /users/me, or the brief moment
  // after a failed fetch before the redirect effect above fires.
  if (!ready || !user) {
    return <FullScreenLoader />;
  }

  return (
    <div className="flex min-h-screen bg-ivory">
      <Sidebar role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
