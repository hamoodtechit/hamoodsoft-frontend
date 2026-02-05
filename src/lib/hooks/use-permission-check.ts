"use client"

import { usePermissions } from "@/lib/providers/permissions-provider"
import { useMemo } from "react"
import { logPermissionDenial } from "@/lib/utils/permissions"
import { useAuth } from "./use-auth"

/**
 * Enhanced permission check hook with logging
 * Industry-standard approach: log permission denials for security auditing
 */
export function usePermissionCheck(
  permission: string,
  resource?: string,
  options?: {
    logDenial?: boolean
    fallback?: boolean
  }
) {
  const { hasPermission, isLoading } = usePermissions()
  const { user } = useAuth()
  const { logDenial = true, fallback = false } = options || {}

  const hasAccess = useMemo(() => {
    if (isLoading) return fallback
    const access = hasPermission(permission)
    
    // Log denial for security auditing
    if (!access && logDenial && user) {
      logPermissionDenial(user.id, permission, resource)
    }
    
    return access
  }, [hasPermission, permission, isLoading, logDenial, user, resource, fallback])

  return {
    hasAccess,
    isLoading,
  }
}

/**
 * Enhanced module access check with logging
 */
export function useModuleAccessCheck(
  module: string,
  options?: {
    logDenial?: boolean
    fallback?: boolean
  }
) {
  const { hasModuleAccess, isLoading } = usePermissions()
  const { user } = useAuth()
  const { logDenial = true, fallback = false } = options || {}

  const hasAccess = useMemo(() => {
    if (isLoading) return fallback
    const access = hasModuleAccess(module)
    
    // Log denial for security auditing
    if (!access && logDenial && user) {
      logPermissionDenial(user.id, `module:${module}`)
    }
    
    return access
  }, [hasModuleAccess, module, isLoading, logDenial, user, fallback])

  return {
    hasAccess,
    isLoading,
  }
}
