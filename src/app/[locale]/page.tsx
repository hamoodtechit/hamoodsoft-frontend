"use client"

import { useAuthStore } from "@/store"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function HomePage() {
  const { isAuthenticated, token, user } = useAuthStore()
  const params = useParams()
  const router = useRouter()
  const locale = params?.locale || "en"
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    const hasAuth = isAuthenticated || !!(token && user && user.id)
    if (hasAuth) {
      router.replace(`/${locale}/dashboard`)
    } else {
      router.replace(`/${locale}/login`)
    }
  }, [isHydrated, isAuthenticated, token, user, locale, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}

