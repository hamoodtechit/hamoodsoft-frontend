"use client"

import { useRoles } from "@/lib/hooks/use-roles"
import { useAuth } from "@/lib/hooks/use-auth"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { Role } from "@/types"
import { createContext, useContext, useMemo, ReactNode } from "react"

interface PermissionsContextValue {
  // User's permissions (flattened array of permission keys)
  permissions: string[]
  // User's role
  role: Role | null
  // Loading state
  isLoading: boolean
  // Check if user has a specific permission
  hasPermission: (permission: string) => boolean
  // Check if user has any of the given permissions
  hasAnyPermission: (permissions: string[]) => boolean
  // Check if user has all of the given permissions
  hasAllPermissions: (permissions: string[]) => boolean
  // Check if user has access to a module
  hasModuleAccess: (module: string) => boolean
}

const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined)

interface PermissionsProviderProps {
  children: ReactNode
}

export function PermissionsProvider({ children }: PermissionsProviderProps) {
  const { user, isLoading: isLoadingAuth } = useAuth()
  const currentBusiness = useCurrentBusiness()
  const { data: roles, isLoading: isLoadingRoles } = useRoles()

  const isOwner = currentBusiness?.ownerId === user?.id

  // Find user's role (used for display purposes, not for permission resolution)
  const userRole = useMemo(() => {
    if (!user) return null

    // If roles are loaded, try to find the matching role
    if (roles && roles.length > 0 && user.roleId) {
      const role = roles.find((r) => r.id === user.roleId)
      if (role) return role
    }

    // Fallback: Get role from user's role relationship (if backend provides it)
    if (user.role) {
      return user.role
    }

    return null
  }, [user, roles])

  // Extract permissions — prefer user.permissions from profile/login API response
  // This avoids the chicken-and-egg problem where fetching roles requires roles:read
  const permissions = useMemo(() => {
    // Owner gets all permissions — handled at the component level via isOwner check
    // But we still return whatever permissions exist for completeness

    // Primary source: permissions array directly on the user object
    // This comes from the backend profile/login response which resolves permissions server-side
    if (user?.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
      return user.permissions as string[]
    }

    // Fallback: extract from the resolved role (if useRoles() succeeded)
    if (userRole?.permissions && Array.isArray(userRole.permissions)) {
      return userRole.permissions
    }

    return []
  }, [user?.permissions, userRole])

  // Memoized permission check functions
  const hasPermission = useMemo(() => {
    return (permission: string): boolean => {
      // Owner always has all permissions
      if (isOwner) return true
      if (!permissions.length) return false
      return permissions.includes(permission)
    }
  }, [permissions, isOwner])

  const hasAnyPermission = useMemo(() => {
    return (requiredPermissions: string[]): boolean => {
      // Owner always has all permissions
      if (isOwner) return true
      if (!permissions.length || !requiredPermissions.length) return false
      return requiredPermissions.some((perm) => permissions.includes(perm))
    }
  }, [permissions, isOwner])

  const hasAllPermissions = useMemo(() => {
    return (requiredPermissions: string[]): boolean => {
      // Owner always has all permissions
      if (isOwner) return true
      if (!permissions.length || !requiredPermissions.length) return false
      return requiredPermissions.every((perm) => permissions.includes(perm))
    }
  }, [permissions, isOwner])

  const hasModuleAccess = useMemo(() => {
    return (module: string): boolean => {
      // Owner always has access
      if (isOwner) return true
      // First check module access from business
      if (currentBusiness?.modules?.includes(module)) {
        return true
      }
      // Then check if user has any permission for that module
      const modulePermissions = permissions.filter((perm) => perm.startsWith(`${module}:`))
      return modulePermissions.length > 0
    }
  }, [currentBusiness, permissions, isOwner])

  const value: PermissionsContextValue = useMemo(
    () => ({
      permissions,
      role: userRole,
      // Only show loading on initial load, not during background refetches
      isLoading: isLoadingAuth && !permissions.length,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasModuleAccess,
    }),
    [permissions, userRole, isLoadingAuth, hasPermission, hasAnyPermission, hasAllPermissions, hasModuleAccess]
  )

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>
}

export function usePermissions() {
  const context = useContext(PermissionsContext)
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionsProvider")
  }
  return context
}
