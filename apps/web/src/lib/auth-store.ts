import { create } from 'zustand';
import type { UserDto } from '@app/shared';

// The access token and current user live ONLY in memory (this zustand store,
// which is itself never persisted) — never localStorage/sessionStorage. The
// refresh token is an httpOnly cookie the browser manages automatically and
// this code never touches it directly.
//
// Because the access token disappears on a hard refresh, app/layout bootstraps
// by silently calling POST /api/auth/refresh on load (see providers.tsx) to
// mint a new one from the refresh cookie before rendering protected content.

interface AuthState {
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
  user: UserDto | null;
  isHydrating: boolean;
  setSession: (session: { accessToken: string; accessTokenExpiresAt: string; user: UserDto }) => void;
  setUser: (user: UserDto) => void;
  clearSession: () => void;
  setHydrating: (value: boolean) => void;
}

// Non-httpOnly "hint" cookie, set/cleared client-side only, purely so the
// Next.js middleware can make a cheap UX-level redirect decision. It carries
// no authority — the API never reads or trusts it.
function setSessionHint(present: boolean) {
  if (typeof document === 'undefined') return;
  if (present) {
    document.cookie = 'hasSession=1; path=/; max-age=2592000; samesite=lax';
  } else {
    document.cookie = 'hasSession=; path=/; max-age=0; samesite=lax';
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  accessTokenExpiresAt: null,
  user: null,
  isHydrating: true,
  setSession: ({ accessToken, accessTokenExpiresAt, user }) => {
    setSessionHint(true);
    set({ accessToken, accessTokenExpiresAt, user, isHydrating: false });
  },
  setUser: (user) => set({ user }),
  clearSession: () => {
    setSessionHint(false);
    set({ accessToken: null, accessTokenExpiresAt: null, user: null, isHydrating: false });
  },
  setHydrating: (value) => set({ isHydrating: value }),
}));

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}
