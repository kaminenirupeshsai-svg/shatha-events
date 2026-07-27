'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Clock, Pencil, PlusCircle, Search, ShieldAlert, Trash2 } from 'lucide-react';
import {
  SERVICE_CATEGORY_LABELS,
  ServiceCategorySchema,
  type ServiceCategory,
  type ServiceDto,
} from '@app/shared';
import { PageHeader } from '@/components/shared/page-header';
import { ServiceCard } from '@/components/shared/service-card';
import { StaggerItem, StaggerReveal } from '@/components/shared/reveal';
import { VerificationBanner } from '@/components/shared/verification-banner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { ServiceCardSkeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatPriceRange, cn } from '@/lib/utils';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { categoryImageUrl } from '@/lib/category-images';
import { useMe } from '@/features/auth/hooks';
import { useCreateService, useDeleteService, useServices, useUpdateService } from '@/features/services/hooks';
import { ServiceForm, type ServiceFormValues } from '@/features/services/service-form';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
] as const;

export default function ServicesPage() {
  const { data: user } = useMe();
  const isVendor = user?.role === 'vendor';
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(() => searchParams?.get('q') ?? '');
  const [category, setCategory] = useState<ServiceCategory | 'all'>(
    () => (searchParams?.get('category') as ServiceCategory | null) ?? 'all',
  );
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]['value']>('newest');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 400);

  const query = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      category: category === 'all' ? undefined : category,
      sort,
      page,
      limit: 12,
      vendorId: isVendor ? user?.id : undefined,
    }),
    [debouncedSearch, category, sort, page, isVendor, user?.id],
  );

  const { data, isLoading, isError } = useServices(query);
  const services = data?.items ?? [];

  // Pending/rejected vendors have no listings and can't create any yet -
  // show why instead of an empty "create your first listing" prompt that
  // would just 403 on submit (see services.service.ts createService's gate).
  if (isVendor && user && user.vendorStatus !== 'approved') {
    const pending = user.vendorStatus === 'pending';
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Vendor listings" title="My services" subtitle="Manage the listings clients see when they browse Shatha Events." />
        {!user.emailVerified && <VerificationBanner email={user.email} />}
        <EmptyState
          icon={pending ? Clock : ShieldAlert}
          title={pending ? 'Your vendor account is awaiting approval' : 'Your vendor application was not approved'}
          description={
            pending
              ? "An admin needs to review and approve your account before you can list services. We'll notify you as soon as that happens."
              : 'Contact us if you think this was a mistake.'
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={isVendor ? 'Vendor listings' : 'Browse'}
        title={isVendor ? 'My services' : 'Find the right vendor'}
        subtitle={
          isVendor
            ? 'Manage the listings clients see when they browse Shatha Events.'
            : 'Search and filter vetted vendors across every category.'
        }
        action={isVendor ? <CreateServiceButton /> : undefined}
      />

      {isVendor && user && !user.emailVerified && <VerificationBanner email={user.email} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
          <Input
            aria-label="Search services"
            placeholder="Search services…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={sort}
          onValueChange={(value) => {
            setSort(value as typeof sort);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-56" aria-label="Sort services">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        <FilterChip active={category === 'all'} onClick={() => { setCategory('all'); setPage(1); }}>
          All categories
        </FilterChip>
        {ServiceCategorySchema.options.map((c) => (
          <FilterChip key={c} active={category === c} onClick={() => { setCategory(c); setPage(1); }}>
            {SERVICE_CATEGORY_LABELS[c]}
          </FilterChip>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <EmptyState icon={AlertTriangle} title="Couldn't load services" description="Something went wrong. Try refreshing the page." />
      ) : services.length === 0 ? (
        <EmptyState
          icon={Search}
          title={isVendor ? 'No listings yet' : 'No services match your filters'}
          description={
            isVendor
              ? 'Create your first service listing so clients can discover and book you.'
              : 'Try a different search term or clear your filters.'
          }
          action={isVendor ? <CreateServiceButton /> : undefined}
        />
      ) : (
        <StaggerReveal className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) =>
            isVendor ? (
              <StaggerItem key={service.id}>
                <ManageServiceCard service={service} />
              </StaggerItem>
            ) : (
              <StaggerItem key={service.id}>
                <ServiceCard service={service} />
              </StaggerItem>
            ),
          )}
        </StaggerReveal>
      )}

      {data && data.totalPages > 1 && (
        <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} className="pt-4" />
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber',
        active ? 'border-emerald bg-emerald text-ivory' : 'border-line bg-surface text-ink-soft hover:bg-linen',
      )}
    >
      {children}
    </button>
  );
}

function CreateServiceButton() {
  const [open, setOpen] = useState(false);
  const createService = useCreateService();

  function handleSubmit(values: ServiceFormValues) {
    createService.mutate(values, { onSuccess: () => setOpen(false) });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          New service
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a service listing</DialogTitle>
        </DialogHeader>
        <ServiceForm onSubmit={handleSubmit} isSubmitting={createService.isPending} submitLabel="Create listing" />
      </DialogContent>
    </Dialog>
  );
}

function ManageServiceCard({ service }: { service: ServiceDto }) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const updateService = useUpdateService(service.id);
  const deleteService = useDeleteService();

  function handleUpdate(values: ServiceFormValues) {
    updateService.mutate(values, { onSuccess: () => setEditOpen(false) });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <Link href={`/services/${service.id}`} className="relative block h-32 w-full overflow-hidden">
        <Image
          src={service.images[0] ?? categoryImageUrl(service.category, 500)}
          alt=""
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          className={cn('object-cover', !service.isActive && 'opacity-50 grayscale')}
        />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <p className="eyebrow">{SERVICE_CATEGORY_LABELS[service.category]}</p>
        <h3 className="font-display text-lg font-semibold text-ink">{service.title}</h3>
        <p className="text-sm font-medium text-emerald">{formatPriceRange(service.priceRange.min, service.priceRange.max)}</p>
        <p className="text-xs text-ink-soft">{service.isActive ? 'Active' : 'Inactive'}</p>

        <div className="mt-auto flex gap-2 pt-3">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit service listing</DialogTitle>
              </DialogHeader>
              <ServiceForm
                defaultValues={service}
                onSubmit={handleUpdate}
                isSubmitting={updateService.isPending}
                submitLabel="Save changes"
                showActiveToggle
              />
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            aria-label={`Delete ${service.title}`}
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5 text-terracotta" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this listing?"
        description={`"${service.title}" will be permanently removed and clients will no longer be able to book it. This cannot be undone.`}
        confirmLabel="Delete listing"
        isLoading={deleteService.isPending}
        onConfirm={() => deleteService.mutate(service.id, { onSuccess: () => setConfirmOpen(false) })}
      />
    </div>
  );
}
