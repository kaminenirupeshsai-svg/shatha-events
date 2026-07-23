// Centralized REST endpoint paths. apps/api's exact routes weren't finalized
// at the time this frontend was built (it's being developed in parallel), so
// these follow the conventional REST shape implied by the module names in
// apps/api/src/modules/* and by packages/shared/src/schemas/*. If the real
// API differs, this is the only file that should need to change.
export const endpoints = {
  auth: {
    signup: '/api/auth/signup',
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
    verifyEmail: '/api/auth/verify-email',
    resendVerification: '/api/auth/resend-verification',
  },
  users: {
    me: '/api/users/me',
    updateMe: '/api/users/me',
    updatePassword: '/api/users/me/password',
    updateSettings: '/api/users/me/settings',
    avatar: '/api/users/me/avatar',
    list: '/api/users', // ?role=vendor for the admin vendor directory
    vendorStatus: (id: string) => `/api/users/${id}/vendor-status`,
  },
  services: {
    list: '/api/services',
    detail: (id: string) => `/api/services/${id}`,
    create: '/api/services',
    update: (id: string) => `/api/services/${id}`,
    remove: (id: string) => `/api/services/${id}`,
  },
  bookings: {
    my: '/api/bookings/my',
    vendor: '/api/bookings/vendor',
    all: '/api/bookings',
    detail: (id: string) => `/api/bookings/${id}`,
    create: '/api/bookings',
    updateStatus: (id: string) => `/api/bookings/${id}/status`,
  },
  notifications: {
    list: '/api/notifications',
    markRead: (id: string) => `/api/notifications/${id}/read`,
    markAllRead: '/api/notifications/read-all',
  },
} as const;
