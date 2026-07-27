import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This is a UX-level guard only. Middleware cannot read httpOnly cookies or
// call the API, so it checks for a lightweight, non-httpOnly "hasSession"
// hint cookie set by the client right after a successful login/refresh (see
// lib/auth-store.ts). Real authorization is always enforced by the API on
// every request — losing/spoofing this cookie only affects UX redirects,
// never access to data.
// NOTE: /services lives under the (app) route group in the directory tree
// (there's no separate public marketing route for it), so it renders inside
// the authenticated dashboard shell and is gated the same way as the rest of
// (app)/*. Anonymous visitors following a "Browse services" link are bounced
// to /login?next=/services and land there right after signing in.
const PROTECTED_PREFIX = '/dashboard';
const APP_PREFIXES = ['/dashboard', '/bookings', '/services', '/profile', '/settings', '/notifications', '/admin'];
// /reset-password is deliberately NOT in this list (unlike the other auth
// pages) - someone can be legitimately logged in on one device/tab and still
// need to complete a reset from an emailed link (e.g. they suspect the
// account is compromised and are locking out whoever else has a session).
// Bouncing them straight to the dashboard before they can act on the link
// would be actively harmful in that case, not just redundant.
const AUTH_PAGES = ['/login', '/signup', '/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.get('hasSession')?.value === '1';

  const isAppRoute = APP_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = AUTH_PAGES.some((prefix) => pathname.startsWith(prefix));

  if (isAppRoute && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL(PROTECTED_PREFIX, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/bookings/:path*',
    '/services/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/notifications/:path*',
    '/admin/:path*',
    '/login',
    '/signup',
    '/forgot-password',
  ],
};
