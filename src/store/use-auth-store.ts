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
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      // Listen for token refresh events from API client
      if (typeof window !== "undefined") {
        window.addEventListener("auth-token-refreshed", ((event: CustomEvent<{ token: string; refreshToken?: string }>) => {
          const { token, refreshToken } = event.detail
          const { user } = get()
          set({ 
            token, 
            refreshToken: refreshToken || get().refreshToken,
            isAuthenticated: !!(token && user && user.id) 
          })
        }) as EventListener)
      }

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
      // Recalculate isAuthenticated after rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Recalculate isAuthenticated based on user and token after rehydration
          state.isAuthenticated = !!(state.user && state.user.id && state.token)
          // Keep businesses from localStorage (they'll be refreshed by API if needed)
        }
      },
    }
  )
)
