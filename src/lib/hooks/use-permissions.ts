"use client"

import { usePermissions } from "@/lib/providers/permissions-provider"
import { useMemo } from "react"

/**
 * Hook to check if user has a specific permission
 * Memoized to prevent unnecessary re-renders
 */
export function useHasPermission(permission: string) {
  const { hasPermission, isLoading } = usePermissions()
  
  return useMemo(() => {
    if (isLoading) return false
    return hasPermission(permission)
  }, [hasPermission, permission, isLoading])
}

/**
 * Hook to check if user has any of the given permissions
 */
export function useHasAnyPermission(permissions: string[]) {
  const { hasAnyPermission, isLoading } = usePermissions()
  
  return useMemo(() => {
    if (isLoading || !permissions.length) return false
    return hasAnyPermission(permissions)
  }, [hasAnyPermission, permissions, isLoading])
}

/**
 * Hook to check if user has all of the given permissions
 */
export function useHasAllPermissions(permissions: string[]) {
  const { hasAllPermissions, isLoading } = usePermissions()
  
  return useMemo(() => {
    if (isLoading || !permissions.length) return false
    return hasAllPermissions(permissions)
  }, [hasAllPermissions, permissions, isLoading])
}

/**
 * Hook to check if user has access to a module
 */
export function useHasModuleAccess(module: string) {
  const { hasModuleAccess, isLoading } = usePermissions()
  
  return useMemo(() => {
    if (isLoading) return false
    return hasModuleAccess(module)
  }, [hasModuleAccess, module, isLoading])
}

/**
 * Hook to get user's role
 */
export function useUserRole() {
  const { role, isLoading } = usePermissions()
  return { role, isLoading }
}

/**
 * Hook to get all user permissions
 */
export function useUserPermissions() {
  const { permissions, isLoading } = usePermissions()
  return { permissions, isLoading }
}
