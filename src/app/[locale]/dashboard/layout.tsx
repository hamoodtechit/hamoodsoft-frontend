"use client"

import { DashboardHeader } from "@/components/layout/dashboard-header"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"
import { Sidebar } from "@/components/layout/sidebar"
import { getNextOnboardingStep } from "@/lib/hooks/use-onboarding"
import { useAuthStore, useUIStore } from "@/store"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const { sidebarOpen } = useUIStore()
  const { isAuthenticated, user, token } = useAuthStore()
  const params = useParams()
  const router = useRouter()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale || "en"

  // Wait for Zustand to rehydrate from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Zustand persist rehydrates synchronously, but we need to wait for the next render
      const timer = setTimeout(() => {
        setIsHydrated(true)
      }, 0)
      return () => clearTimeout(timer)
    } else {
      setIsHydrated(true)
    }
  }, [])

  // After hydration, check auth and redirect if needed
  useEffect(() => {
    if (isHydrated) {
      // Check both isAuthenticated and token/user to be safe
      const hasAuth = isAuthenticated || (token && user && user.id)
      if (!hasAuth) {
        router.push(`/${locale}/login`)
      }
    }
  }, [isHydrated, isAuthenticated, token, user, locale, router])

  // Check onboarding status and redirect if incomplete
  // Only redirect if user doesn't have currentBusinessId AND API confirms no business
  useEffect(() => {
    if (isHydrated) {
      const hasAuth = isAuthenticated || (token && user && user.id)
      if (hasAuth) {
        // If user has currentBusinessId, onboarding is complete - don't check API
        // This prevents redirects when switching businesses
        if (user?.currentBusinessId) {
          return // User has business, onboarding complete
        }
        
        // Check onboarding status based on user.currentBusinessId
        // Add a small delay to prevent race conditions during business switch
        const timeoutId = setTimeout(() => {
          const nextStep = getNextOnboardingStep(locale, user)
          if (nextStep) {
            router.push(nextStep)
          }
        }, 100) // Small delay to prevent race conditions
        
        return () => clearTimeout(timeoutId)
      }
    }
  }, [isHydrated, isAuthenticated, token, user, locale, router])

  // Close mobile menu when window is resized to large screen
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [mobileMenuOpen])

  // Show loading state while waiting for hydration
  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">⏳</div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Check if authenticated (using both isAuthenticated and token/user)
  const hasAuth = isAuthenticated || (token && user && user.id)
  if (!hasAuth) {
    return null
  }

  // Show loading while checking onboarding status only if user doesn't have currentBusinessId
  // Don't render dashboard if onboarding is incomplete (redirect will happen)
  const nextStep = getNextOnboardingStep(locale, user)
  if (nextStep) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">⏳</div>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <MobileSidebar open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
      <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300">
        <DashboardHeader onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
