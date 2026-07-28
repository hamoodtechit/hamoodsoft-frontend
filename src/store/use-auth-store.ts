import { Business, User } from "@/types"
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  businesses: Business[]
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setRefreshToken: (refreshToken: string | null) => void
  setBusinesses: (businesses: Business[]) => void
  updateUserPreferences: (preferences: Record<string, any>) => void
  logout: () => void
}

// AbortController for cleaning up the event listener (SSR/test safety)
let listenerAbortController: AbortController | null = null

function setupAuthListener() {
  // Clean up any previous listener before setting a new one
  if (listenerAbortController) {
    listenerAbortController.abort()
  }

  listenerAbortController = new AbortController()

  window.addEventListener("auth-token-refreshed", ((event: CustomEvent<{ token: string; refreshToken?: string }>) => {
    const { token, refreshToken } = event.detail
    const store = useAuthStore.getState()
    useAuthStore.setState({
      token,
      refreshToken: refreshToken || store.refreshToken,
      isAuthenticated: !!(token && store.user && store.user.id)
    })
  }) as EventListener, { signal: listenerAbortController.signal })
}

/** Remove the auth-token-refreshed listener. Call during SSR cleanup or tests. */
export function cleanupAuthListeners() {
  if (listenerAbortController) {
    listenerAbortController.abort()
    listenerAbortController = null
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      return {
        user: null,
        token: null,
        refreshToken: null,
        businesses: [], // Not persisted - fetched fresh when needed
        isAuthenticated: false,
        setUser: (user) => {
          const { token } = get()
          set({ user, isAuthenticated: !!(user && user.id && token) })
        },
        setToken: (token) => {
          const { user } = get()
          set({ token, isAuthenticated: !!(token && user && user.id) })
        },
        setRefreshToken: (refreshToken) => set({ refreshToken }),
        setBusinesses: (businesses) => set({ businesses }),
        updateUserPreferences: (preferences) => {
          const { user } = get()
          if (user) {
            set({
              user: {
                ...user,
                preferences: {
                  ...user.preferences,
                  ...preferences
                }
              }
            })
          }
        },
        logout: () => set({
          user: null,
          token: null,
          refreshToken: null,
          businesses: [],
          isAuthenticated: false
        }),
      }
    },
    {
      name: "auth-storage",
      // Persist businesses so they're available immediately after refresh
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        businesses: state.businesses, // Persist businesses for immediate access
      }),
      // Recalculate isAuthenticated after rehydration and set up listener
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Recalculate isAuthenticated based on user and token after rehydration
          state.isAuthenticated = !!(state.user && state.user.id && state.token)
        }
      },
    }
  )
)

// Initialize global event listener (client-side only)
if (typeof window !== "undefined") {
  setupAuthListener()
}

