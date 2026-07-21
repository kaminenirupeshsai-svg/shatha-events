'use client';

import { useState } from 'react';
import { Search, Store } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { formatDate, initials } from '@/lib/utils';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { useVendors } from '@/features/vendors/hooks';

export default function AdminVendorsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 400);

  const { data, isLoading } = useVendors({ q: debouncedSearch || undefined, page, limit: 10 });
  const vendors = data?.items ?? [];

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
              {['Vendor', 'Email', 'Phone', 'Joined'].map((col) => (
                <th key={col} className="px-4 py-3 font-label text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} columns={4} />)
            ) : vendors.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12">
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
                  <td className="px-4 py-3.5 text-ink-soft">{vendor.email}</td>
                  <td className="px-4 py-3.5 text-ink-soft">{vendor.phone ?? '—'}</td>
                  <td className="px-4 py-3.5 text-ink-soft">{formatDate(vendor.createdAt)}</td>
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
