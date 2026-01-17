"use client"

import { useAuthStore } from "@/store"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({
  children,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { isAuthenticated, token, user } = useAuthStore()
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)

  // Wait for Zustand to rehydrate from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Zustand persist rehydrates synchronously, but we need to wait for the next render
      // to ensure the state has been updated
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
        router.push(redirectTo)
      }
    }
  }, [isHydrated, isAuthenticated, token, user, router, redirectTo])

  // Show loading while waiting for hydration
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

  // After hydration, check if authenticated (using both isAuthenticated and token/user)
  const hasAuth = isAuthenticated || (token && user && user.id)
  if (!hasAuth) {
    return null
  }

  return <>{children}</>
}
