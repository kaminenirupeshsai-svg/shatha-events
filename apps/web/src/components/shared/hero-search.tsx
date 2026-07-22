'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function HeroSearch() {
  const router = useRouter();
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/services?q=${encodeURIComponent(q)}` : '/services');
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="flex w-full max-w-md items-center gap-2">
      <label htmlFor="hero-search" className="sr-only">
        Search services
      </label>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
        <input
          id="hero-search"
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search decor, catering, photographers…"
          className="h-12 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-sm text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber"
        />
      </div>
      <button
        type="submit"
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald text-ivory transition-colors hover:bg-emerald-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber"
        aria-label="Search"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}
