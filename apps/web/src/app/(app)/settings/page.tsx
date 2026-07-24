'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Laptop, Moon, Sun } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useMe, useUpdateSettings } from '@/features/auth/hooks';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Laptop },
] as const;

export default function SettingsPage() {
  const { data: user, isLoading } = useMe();
  const { theme, setTheme } = useTheme();
  const updateSettings = useUpdateSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader eyebrow="Preferences" title="Settings" subtitle="Control how Shatha Events looks and notifies you." />

      {isLoading || !user || !mounted ? (
        <Skeleton className="h-56 w-full rounded-2xl" />
      ) : (
        <>
          <section className="rounded-2xl border border-line bg-surface p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold text-ink">Appearance</h2>
            <p className="mt-1 text-sm text-ink-soft">Choose how Shatha Events looks on this device.</p>
            <div className="mt-4 grid grid-cols-3 gap-3" role="radiogroup" aria-label="Theme">
              {THEME_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                // Driven by the live theme, not user.theme - so the selected
                // option always matches what's actually on screen, including
                // while a save is still in flight.
                const active = theme === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      const previousTheme = theme ?? 'system';
                      setTheme(opt.value);
                      updateSettings.mutate(
                        { theme: opt.value },
                        {
                          // Applied instantly for a responsive feel, but if the
                          // save fails, don't leave the visible theme out of
                          // sync with the account's actual saved preference.
                          onError: () => setTheme(previousTheme),
                        },
                      );
                    }}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber',
                      active ? 'border-emerald bg-emerald-tint text-ink' : 'border-line bg-surface text-ink-soft hover:bg-linen',
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold text-ink">Notifications</h2>
            <p className="mt-1 text-sm text-ink-soft">Choose what we send to your inbox.</p>
            <label className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3">
              <span>
                <span className="block text-sm font-medium text-ink">Email notifications</span>
                <span className="block text-xs text-ink-soft">Booking status changes and important updates.</span>
              </span>
              <input
                type="checkbox"
                checked={user.notifyEmail}
                onChange={(e) => updateSettings.mutate({ notifyEmail: e.target.checked })}
                aria-label="Toggle email notifications"
                className="h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-line transition-colors checked:bg-emerald relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-surface before:transition-transform checked:before:translate-x-4"
              />
            </label>
          </section>
        </>
      )}
    </div>
  );
}
