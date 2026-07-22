'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { SERVICE_CATEGORY_LABELS } from '@app/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Reveal } from '@/components/shared/reveal';
import { formatPriceRange } from '@/lib/utils';
import { categoryImageUrl } from '@/lib/category-images';
import { useService } from '@/features/services/hooks';
import { useMe } from '@/features/auth/hooks';

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: user } = useMe();
  const { data: service, isLoading, isError } = useService(params.id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError || !service) {
    return (
      <EmptyState
        title="Service not found"
        description="This listing may have been removed or is no longer active."
        action={
          <Button variant="outline" onClick={() => router.push('/services')}>
            Back to services
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/services" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-emerald">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to services
      </Link>

      <Reveal>
        <div className="relative h-64 w-full overflow-hidden rounded-2xl">
          <Image
            src={service.images[0] ?? categoryImageUrl(service.category, 1000)}
            alt=""
            fill
            sizes="(min-width: 1024px) 48rem, 90vw"
            className="object-cover"
            priority
          />
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">{SERVICE_CATEGORY_LABELS[service.category]}</p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-ink">{service.title}</h1>
            {service.vendorName && <p className="mt-1 text-sm text-ink-soft">By {service.vendorName}</p>}
          </div>
          <p className="font-display text-2xl font-semibold text-emerald">
            {formatPriceRange(service.priceRange.min, service.priceRange.max)}
          </p>
        </div>

        <p className="mt-6 whitespace-pre-line text-ink-soft">{service.description}</p>

        {user?.role === 'client' && (
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href={`/bookings/new?serviceId=${service.id}`}>Book this service</Link>
            </Button>
          </div>
        )}
      </Reveal>
    </div>
  );
}
