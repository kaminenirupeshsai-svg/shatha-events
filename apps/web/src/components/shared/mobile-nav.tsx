'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Menu, X } from 'lucide-react';
import type { UserRole } from '@app/shared';
import { SidebarBrand, SidebarNav } from './sidebar';

export function MobileNav({ role }: { role: UserRole }) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Open navigation menu"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink lg:hidden"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40 data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#12180F] px-4 py-6 focus:outline-none data-[state=open]:animate-fade-in">
          <DialogPrimitive.Title className="sr-only">Navigation menu</DialogPrimitive.Title>
          <div className="mb-2 flex items-center justify-between px-2">
            <SidebarBrand />
            <DialogPrimitive.Close
              aria-label="Close navigation menu"
              className="rounded-full p-1.5 text-[#B7BDB6] hover:bg-[#1F2A1C]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          <SidebarNav role={role} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
