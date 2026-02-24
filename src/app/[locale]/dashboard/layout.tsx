"use client"

import { DashboardHeader } from "@/components/layout/dashboard-header"
import { getNextOnboardingStep } from "@/lib/hooks/use-onboarding"
import { PermissionsProvider } from "@/lib/providers/permissions-provider"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store"
import { useParams, usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isHydrated, setIsHydrated] = useState(false)
  const { isAuthenticated, user, token } = useAuthStore()
  const params = useParams()
  const router = useRouter()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale || "en"

  // Early return if not on dashboard page (must be after hooks to avoid rules-of-hooks errors)
  const isDashboardRoute = pathname?.includes("/dashboard")

  // Wait for Zustand to rehydrate
  useEffect(() => {
    if (typeof window !== "undefined") {
      const timer = setTimeout(() => {
        setIsHydrated(true)
      }, 0)
      return () => clearTimeout(timer)
    } else {
      setIsHydrated(true)
    }
  }, [])

  // Check auth and redirect if needed
  useEffect(() => {
    if (!isHydrated) return
    
    // Check localStorage directly first (most reliable)
    let hasAuth = false
    if (typeof window !== "undefined") {
      try {
        const authStorage = localStorage.getItem("auth-storage")
        if (authStorage) {
          const parsed = JSON.parse(authStorage)
          const storedToken = parsed?.state?.token
          const storedUser = parsed?.state?.user
          hasAuth = !!(storedToken && storedUser && storedUser.id)
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // Fallback to Zustand state
    if (!hasAuth) {
      hasAuth = !!(isAuthenticated || (token && user && user.id))
    }
    
    if (!hasAuth) {
      router.replace(`/${locale}/login`)
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


  // Early return if not on dashboard page (must be after all hooks)
  if (!isDashboardRoute) {
    return <>{children}</>
  }

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
  // Also check localStorage directly as fallback
  let hasAuth: boolean = !!(isAuthenticated || (token && user && user.id))
  if (!hasAuth && typeof window !== "undefined") {
    try {
      const authStorage = localStorage.getItem("auth-storage")
      if (authStorage) {
        const parsed = JSON.parse(authStorage)
        const storedToken = parsed?.state?.token
        const storedUser = parsed?.state?.user
        hasAuth = !!(storedToken && storedUser && storedUser.id)
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }
  
  // Don't render if not authenticated - redirect will happen in useEffect
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

  const isPOS = pathname?.includes("/dashboard/point-of-sale")

  return (
    <PermissionsProvider>
      <div className="flex h-screen overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300">
          {!isPOS && <DashboardHeader />}
          <main className={cn("flex-1 overflow-hidden flex flex-col", !isPOS && "p-4 md:p-6 overflow-y-auto")}>
            {children}
          </main>
        </div>
      </div>
    </PermissionsProvider>
  )
}
