"use client"

import { useAuthStore } from "@/store"
import { redirect } from "next/navigation"

/**
 * Client-side auth check hook
 * Use this in client components to check authentication
 */
export function useRequireAuth() {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    redirect("/login")
  }
}

/**
 * Server-side auth check
 * Use this in server components or route handlers
 */
export async function requireAuth() {
  // This would typically check a session or token
  // For now, we'll handle this in middleware
  return true
}
