'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-emerald text-ivory hover:bg-emerald-deep',
  secondary: 'bg-amber text-ink hover:brightness-95',
  outline: 'bg-transparent text-ink border border-line hover:bg-linen',
  ghost: 'bg-transparent text-ink hover:bg-linen',
  destructive: 'bg-terracotta text-ivory hover:brightness-95',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm gap-1.5',
  md: 'h-11 px-6 text-sm gap-2',
  lg: 'h-13 px-8 text-base gap-2',
  icon: 'h-10 w-10 p-0',
};

// framer-motion's motion.button redefines a handful of DOM event handlers
// (drag/animation events) with its own, incompatible signatures — omit them
// here since Button never needs to accept them from callers.
type ConflictingHandlers =
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onDragEnter'
  | 'onDragExit'
  | 'onDragLeave'
  | 'onDragOver'
  | 'onDrop'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, ConflictingHandlers> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  /** Render as the single child element (e.g. a next/link Link) instead of a <button>. */
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, asChild, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();
    const classes = cn(
      'inline-flex items-center justify-center rounded-full font-body font-semibold',
      'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 focus-visible:ring-offset-ivory',
      variantClasses[variant],
      sizeClasses[size],
      className,
    );

    if (asChild) {
      return (
        <Slot ref={ref as never} className={classes} {...(props as React.HTMLAttributes<HTMLElement>)}>
          {children}
        </Slot>
      );
    }

    return (
      <motion.button
        ref={ref}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
        className={classes}
        disabled={disabled ?? isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </motion.button>
    );
  },
);
Button.displayName = 'Button';
