import { create } from "zustand"
import { persist } from "zustand/middleware"
import { Locale } from "@/types"

interface UIState {
  theme: "light" | "dark" | "system"
  language: Locale
  sidebarOpen: boolean
  setTheme: (theme: "light" | "dark" | "system") => void
  setLanguage: (language: Locale) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "system",
      language: "en",
      sidebarOpen: true, // Default to open on desktop
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: "ui-storage",
    }
  )
)
