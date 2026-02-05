"use client"

import { usePermissions } from "@/lib/providers/permissions-provider"
import { memo, ReactNode } from "react"

interface PermissionGuardProps {
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  module?: string
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Component to conditionally render children based on permissions
 * Prevents unnecessary re-renders by using memoized permission checks
 */
export const PermissionGuard = memo(function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  module,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasModuleAccess, isLoading } = usePermissions()

  // Show nothing while loading
  if (isLoading) {
    return <>{fallback}</>
  }

  // Check module access
  if (module) {
    if (!hasModuleAccess(module)) {
      return <>{fallback}</>
    }
  }

  // Check single permission
  if (permission) {
    if (!hasPermission(permission)) {
      return <>{fallback}</>
    }
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
    
    if (!hasAccess) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
})
