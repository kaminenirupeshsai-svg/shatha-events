'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/features/auth/hooks';
import { FullScreenLoader } from '@/components/shared/full-screen-loader';

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { data: user } = useMe();

  useEffect(() => {
    if (user) {
      router.replace(`/dashboard/${user.role}`);
    }
  }, [user, router]);

  return <FullScreenLoader />;
}
