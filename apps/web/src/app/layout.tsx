import type { Metadata } from 'next';
import { Fraunces, Karla, Space_Grotesk } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const karla = Karla({
  subsets: ['latin'],
  variable: '--font-karla',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Shatha Events — Thoughtfully planned, beautifully executed',
    template: '%s · Shatha Events',
  },
  description:
    'Shatha Events connects clients with vetted decor, catering, photography, venue, and entertainment vendors for weddings, corporate events, and celebrations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${karla.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
