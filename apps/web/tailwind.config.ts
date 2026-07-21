import type { Config } from 'tailwindcss';

// Colors are read from CSS variables defined in src/app/globals.css, which in
// turn mirror packages/shared/src/design-tokens.ts exactly (light + dark).
// Never hand-duplicate hex values here — change the source, not this file.
const withVar = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: withVar('ink'),
        'ink-soft': withVar('ink-soft'),
        emerald: withVar('emerald'),
        'emerald-deep': withVar('emerald-deep'),
        'emerald-tint': withVar('emerald-tint'),
        amber: withVar('amber'),
        'amber-tint': withVar('amber-tint'),
        ivory: withVar('ivory'),
        surface: withVar('surface'),
        linen: withVar('linen'),
        line: withVar('line'),
        terracotta: withVar('terracotta'),
        'terracotta-tint': withVar('terracotta-tint'),
        slate: withVar('slate'),
        'slate-tint': withVar('slate-tint'),
        teal: withVar('teal'),
        'teal-tint': withVar('teal-tint'),
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'ui-serif', 'Georgia', 'serif'],
        body: ['var(--font-karla)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        label: ['var(--font-space-grotesk)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        xl: '14px',
      },
      spacing: {
        18: '4.5rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(27 36 32 / 0.04), 0 1px 12px -4px rgb(27 36 32 / 0.08)',
        popover: '0 8px 30px -8px rgb(27 36 32 / 0.25)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
