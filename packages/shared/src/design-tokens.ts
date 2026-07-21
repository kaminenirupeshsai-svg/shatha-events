// The single source of truth for the visual identity approved in the Penpot
// design ("Shatha Events — Design"). apps/web's Tailwind config and
// styles/tokens.css are generated from these values — never hand-duplicated.

export const colors = {
  ink: '#1B2420',
  inkSoft: '#4B5650',
  emerald: '#1F4A3D',
  emeraldDeep: '#163529',
  emeraldTint: '#E4ECE8',
  amber: '#D9A441',
  amberTint: '#F7ECD6',
  ivory: '#FAF7F1',
  surface: '#FFFFFF',
  linen: '#F1EBDF',
  line: '#E4DDCB',
  terracotta: '#B4553E',
  terracottaTint: '#F3DFD8',
  slate: '#6B7670',
  slateTint: '#ECEAE4',
  teal: '#2E6E7E',
  tealTint: '#E2EEF0',
} as const;

// Dark-mode is a semantic remap, not a naive inversion of the light palette.
export const darkColors = {
  ink: '#EDE8DC',
  inkSoft: '#B7BDB6',
  emerald: '#4B9A80',
  emeraldDeep: '#2E6650',
  emeraldTint: '#1B2A24',
  amber: '#E3B563',
  amberTint: '#2B2418',
  ivory: '#12180F',
  surface: '#1B2420',
  linen: '#1F2A1C',
  line: '#2A332A',
  terracotta: '#D97F68',
  terracottaTint: '#2E1F1B',
  slate: '#9BA69C',
  slateTint: '#232B22',
  teal: '#5CA8B8',
  tealTint: '#1B2A2C',
} as const;

export const fonts = {
  display: 'Fraunces',
  body: 'Karla',
  label: 'Space Grotesk',
} as const;

export const statusToneMap = {
  pending: { bg: 'slateTint', fg: 'slate' },
  reviewed: { bg: 'amberTint', fg: 'amber' },
  confirmed: { bg: 'emeraldTint', fg: 'emerald' },
  in_progress: { bg: 'tealTint', fg: 'teal' },
  completed: { bg: 'emerald', fg: 'ivory' },
  cancelled: { bg: 'terracottaTint', fg: 'terracotta' },
} as const;
