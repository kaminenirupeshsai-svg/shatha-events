'use client';

import { useState } from 'react';
import { CheckCircle2, Search, Store } from 'lucide-react';
import type { UserDto } from '@app/shared';
import { PageHeader } from '@/components/shared/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { cn, formatDate, initials } from '@/lib/utils';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { useUpdateVendorStatus, useVendors } from '@/features/vendors/hooks';

const VENDOR_STATUS_CLASSES: Record<UserDto['vendorStatus'], string> = {
  pending: 'bg-amber-tint text-[#8C6A22] dark:text-amber',
  approved: 'bg-emerald-tint text-emerald',
  rejected: 'bg-terracotta-tint text-terracotta',
};

const VENDOR_STATUS_LABELS: Record<UserDto['vendorStatus'], string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

function VendorStatusBadge({ status }: { status: UserDto['vendorStatus'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-label text-[11px] font-semibold uppercase tracking-wide',
        VENDOR_STATUS_CLASSES[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {VENDOR_STATUS_LABELS[status]}
    </span>
  );
}

export default function AdminVendorsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 400);

  const { data, isLoading } = useVendors({ q: debouncedSearch || undefined, page, limit: 10 });
  const vendors = data?.items ?? [];
  const updateVendorStatus = useUpdateVendorStatus();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Vendors" subtitle="Everyone registered to list services on Shatha Events." />

      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
        <Input
          aria-label="Search vendors"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-10"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              {['Vendor', 'Email', 'Phone', 'Status', 'Joined', ''].map((col) => (
                <th key={col} className="px-4 py-3 font-label text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} columns={6} />)
            ) : vendors.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12">
                  <EmptyState icon={Store} title="No vendors found" description="Try a different search term." />
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr key={vendor.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {vendor.avatarUrl && <AvatarImage src={vendor.avatarUrl} alt="" />}
                        <AvatarFallback className="text-[11px]">{initials(vendor.name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-ink">{vendor.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-ink-soft">
                    <div className="flex items-center gap-1.5">
                      {vendor.email}
                      {vendor.emailVerified ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald" aria-label="Email verified" />
                      ) : (
                        <span className="shrink-0 rounded-full bg-slate-tint px-1.5 py-0.5 font-label text-[9px] font-semibold uppercase tracking-wide text-slate">
                          Unverified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-ink-soft">{vendor.phone ?? '—'}</td>
                  <td className="px-4 py-3.5">
                    <VendorStatusBadge status={vendor.vendorStatus} />
                  </td>
                  <td className="px-4 py-3.5 text-ink-soft">{formatDate(vendor.createdAt)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-2">
                      {vendor.vendorStatus !== 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          isLoading={updateVendorStatus.isPending && updateVendorStatus.variables?.id === vendor.id}
                          onClick={() => updateVendorStatus.mutate({ id: vendor.id, status: 'approved' })}
                        >
                          Approve
                        </Button>
                      )}
                      {vendor.vendorStatus !== 'rejected' && (
                        <Button
                          size="sm"
                          variant="outline"
                          isLoading={updateVendorStatus.isPending && updateVendorStatus.variables?.id === vendor.id}
                          onClick={() => updateVendorStatus.mutate({ id: vendor.id, status: 'rejected' })}
                        >
                          Reject
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
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
