import Link from 'next/link';
import { Logo } from './logo';

export function Footer() {
  return (
    <footer className="border-t border-line bg-linen">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm text-ink-soft">
              Thoughtfully planned, beautifully executed. We connect clients with vetted vendors across decor,
              catering, photography, venues, and entertainment.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <p className="font-label text-xs font-semibold uppercase tracking-[0.1em] text-ink">Explore</p>
              <ul className="mt-4 space-y-3 text-sm text-ink-soft">
                <li><Link href="/services" className="hover:text-emerald">Services</Link></li>
                <li><Link href="/about" className="hover:text-emerald">About</Link></li>
                <li><Link href="/contact" className="hover:text-emerald">Contact</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-label text-xs font-semibold uppercase tracking-[0.1em] text-ink">Account</p>
              <ul className="mt-4 space-y-3 text-sm text-ink-soft">
                <li><Link href="/login" className="hover:text-emerald">Sign in</Link></li>
                <li><Link href="/signup" className="hover:text-emerald">Create account</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-label text-xs font-semibold uppercase tracking-[0.1em] text-ink">Contact</p>
              <ul className="mt-4 space-y-3 text-sm text-ink-soft">
                <li>hello@shathaevents.com</li>
                <li>+1 (555) 010-2938</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 text-xs text-ink-soft sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Shatha Events. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
