'use client';

import { useState } from 'react';
import { Pencil, PlusCircle, Search, Trash2 } from 'lucide-react';
import {
  SERVICE_CATEGORY_LABELS,
  ServiceCategorySchema,
  type ServiceCategory,
  type ServiceDto,
} from '@app/shared';
import { PageHeader } from '@/components/shared/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatPriceRange } from '@/lib/utils';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { useCreateService, useDeleteService, useServices, useUpdateService } from '@/features/services/hooks';
import { ServiceForm, type ServiceFormValues } from '@/features/services/service-form';

export default function AdminServicesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ServiceCategory | 'all'>('all');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 400);

  const { data, isLoading } = useServices({
    q: debouncedSearch || undefined,
    category: category === 'all' ? undefined : category,
    page,
    limit: 10,
    sort: 'newest',
  });
  const services = data?.items ?? [];
  const createService = useCreateService();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Services"
        subtitle="Create, edit, and retire service listings across every vendor."
        action={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
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
              <ServiceForm
                onSubmit={(values: ServiceFormValues) =>
                  createService.mutate(values, { onSuccess: () => setCreateOpen(false) })
                }
                isSubmitting={createService.isPending}
                submitLabel="Create listing"
              />
            </DialogContent>
          </Dialog>
        }
      />

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
        <Select value={category} onValueChange={(v) => { setCategory(v as ServiceCategory | 'all'); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Filter by category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {ServiceCategorySchema.options.map((c) => (
              <SelectItem key={c} value={c}>
                {SERVICE_CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              {['Title', 'Category', 'Vendor', 'Price range', 'Status', 'Actions'].map((col) => (
                <th key={col} className="px-4 py-3 font-label text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} columns={6} />)
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12">
                  <EmptyState title="No services match your filters" description="Try a different search term or category." />
                </td>
              </tr>
            ) : (
              services.map((service) => <ServiceRow key={service.id} service={service} />)
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}

function ServiceRow({ service }: { service: ServiceDto }) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const updateService = useUpdateService(service.id);
  const deleteService = useDeleteService();

  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-4 py-3.5 font-medium text-ink">{service.title}</td>
      <td className="px-4 py-3.5 text-ink-soft">{SERVICE_CATEGORY_LABELS[service.category]}</td>
      <td className="px-4 py-3.5 text-ink-soft">{service.vendorName ?? '—'}</td>
      <td className="px-4 py-3.5 text-ink-soft">{formatPriceRange(service.priceRange.min, service.priceRange.max)}</td>
      <td className="px-4 py-3.5">
        <span
          className={
            service.isActive
              ? 'rounded-full bg-emerald-tint px-2.5 py-1 text-xs font-medium text-emerald'
              : 'rounded-full bg-slate-tint px-2.5 py-1 text-xs font-medium text-slate'
          }
        >
          {service.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" aria-label={`Edit ${service.title}`}>
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit service listing</DialogTitle>
              </DialogHeader>
              <ServiceForm
                defaultValues={service}
                onSubmit={(values) => updateService.mutate(values, { onSuccess: () => setEditOpen(false) })}
                isSubmitting={updateService.isPending}
                submitLabel="Save changes"
                showActiveToggle
              />
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" aria-label={`Delete ${service.title}`} onClick={() => setConfirmOpen(true)}>
            <Trash2 className="h-3.5 w-3.5 text-terracotta" aria-hidden="true" />
          </Button>
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
      </td>
    </tr>
  );
}
