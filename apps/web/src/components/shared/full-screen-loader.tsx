import { Loader2 } from 'lucide-react';

export function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory">
      <Loader2 className="h-6 w-6 animate-spin text-emerald" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
