export const endpoints = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    me: "/auth/me",
    profile: "/auth/profile",
    requestPasswordReset: "/auth/request-password-reset",
    resetPassword: "/auth/reset-password",
  },
  users: {
    update: (id: string) => `/users/${id}`,
  },
  business: {
    create: "/business",
    list: "/business",
    getById: (id: string) => `/business/${id}`,
    selectApps: "/business/apps",
  },
} as const
