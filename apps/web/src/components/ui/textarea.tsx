import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'min-h-[120px] w-full rounded-xl border bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-soft/60',
          'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber',
          invalid ? 'border-terracotta' : 'border-line',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';
