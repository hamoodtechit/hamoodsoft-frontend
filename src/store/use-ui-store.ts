import { Locale } from "@/types"
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface UIState {
  theme: "light" | "dark" | "system"
  language: Locale
  sidebarOpen: boolean
  // Selected branch per business (so switching businesses keeps branch selections separate)
  selectedBranchByBusinessId: Record<string, string | null>
  setTheme: (theme: "light" | "dark" | "system") => void
  setLanguage: (language: Locale) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSelectedBranch: (businessId: string, branchId: string | null) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "system",
      language: "en",
      sidebarOpen: true, // Default to open on desktop
      selectedBranchByBusinessId: {},
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSelectedBranch: (businessId, branchId) =>
        set((state) => ({
          selectedBranchByBusinessId: {
            ...state.selectedBranchByBusinessId,
            [businessId]: branchId,
          },
        })),
    }),
    {
      name: "ui-storage",
    }
  )
)
