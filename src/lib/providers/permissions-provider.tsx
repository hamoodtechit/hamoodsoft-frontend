"use client"

import { useRoles } from "@/lib/hooks/use-roles"
import { useAuth } from "@/lib/hooks/use-auth"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { Role, Permission } from "@/types"
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
  const { user } = useAuth()
  const currentBusiness = useCurrentBusiness()
  const { data: roles, isLoading: isLoadingRoles } = useRoles()

  // Find user's role based on their roleId
  const userRole = useMemo(() => {
    if (!user || !roles || roles.length === 0) return null
    
    // User has roleId field - find matching role
    if (user.roleId) {
      const role = roles.find((r) => r.id === user.roleId)
      if (role) return role
    }
    
    // Fallback: Get role from user's role relationship (if backend provides it)
    if ((user as any).role) {
      return (user as any).role as Role
    }
    
    // Fallback: Default to "Owner" role if user is business owner
    // This is a fallback - adjust based on your business logic
    if (currentBusiness && currentBusiness.ownerId === user.id) {
      const ownerRole = roles.find((r) => r.name === "Owner")
      if (ownerRole) return ownerRole
    }
    
    return null
  }, [user, roles, currentBusiness])

  // Extract permissions from role
  const permissions = useMemo(() => {
    if (!userRole) return []
    return userRole.permissions || []
  }, [userRole])

  // Memoized permission check functions
  const hasPermission = useMemo(() => {
    return (permission: string): boolean => {
      if (!permissions.length) return false
      return permissions.includes(permission)
    }
  }, [permissions])

  const hasAnyPermission = useMemo(() => {
    return (requiredPermissions: string[]): boolean => {
      if (!permissions.length || !requiredPermissions.length) return false
      return requiredPermissions.some((perm) => permissions.includes(perm))
    }
  }, [permissions])

  const hasAllPermissions = useMemo(() => {
    return (requiredPermissions: string[]): boolean => {
      if (!permissions.length || !requiredPermissions.length) return false
      return requiredPermissions.every((perm) => permissions.includes(perm))
    }
  }, [permissions])

  const hasModuleAccess = useMemo(() => {
    return (module: string): boolean => {
      // First check module access from business
      if (currentBusiness?.modules?.includes(module)) {
        return true
      }
      
      // Then check if user has any permission for that module
      const modulePermissions = permissions.filter((perm) => perm.startsWith(`${module}:`))
      return modulePermissions.length > 0
    }
  }, [currentBusiness, permissions])

  const value: PermissionsContextValue = useMemo(
    () => ({
      permissions,
      role: userRole,
      isLoading: isLoadingRoles,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasModuleAccess,
    }),
    [permissions, userRole, isLoadingRoles, hasPermission, hasAnyPermission, hasAllPermissions, hasModuleAccess]
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
