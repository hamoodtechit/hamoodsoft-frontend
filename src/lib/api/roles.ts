import { AssignUserToRoleInput, CreateRoleInput, UpdateRoleInput, normalizePermission } from "@/lib/validations/roles"
import { ApiResponse, Role } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

// Permission pattern: lowercase letters and underscores only
const permissionPattern = /^[a-z_]+:[a-z_]+$/

// Normalize role data from API response (with rolePermissions) to frontend format
const normalizeRole = (role: any): Role => {
  // Extract permission keys from rolePermissions array and normalize them
  const rawPermissions = role.rolePermissions?.map((rp: any) => rp.permission?.key).filter(Boolean) || []
  
  // Normalize all permissions to snake_case format
  const permissions = rawPermissions
    .map(normalizePermission)
    .filter((p: string) => permissionPattern.test(p))
    // Remove duplicates
    .filter((p: string, index: number, arr: string[]) => arr.indexOf(p) === index)
  
  return {
    id: role.id,
    businessId: role.businessId,
    name: role.name,
    description: role.description,
    allowedBranchIds: role.allowedBranchIds || [],
    permissions,
    rolePermissions: role.rolePermissions,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  }
}

// Normalize array of roles
const normalizeRoles = (roles: any[]): Role[] => {
  return roles.map(normalizeRole)
}

export const rolesApi = {
  createRole: async (data: CreateRoleInput): Promise<Role> => {
    // Normalize permissions before sending to API
    const normalizedData = {
      ...data,
      permissions: data.permissions
        .map(normalizePermission)
        .filter((p) => permissionPattern.test(p))
        .filter((p, index, arr) => arr.indexOf(p) === index), // Remove duplicates
    }
    
    const response = await apiClient.post<ApiResponse<Role>>(
      endpoints.roles.create,
      normalizedData
    )
    return normalizeRole(response.data.data)
  },

  getRoles: async (): Promise<Role[]> => {
    const response = await apiClient.get<ApiResponse<Role[]>>(
      endpoints.roles.list
    )
    return normalizeRoles(response.data.data)
  },

  getRoleById: async (id: string): Promise<Role> => {
    const response = await apiClient.get<ApiResponse<Role>>(
      endpoints.roles.getById(id)
    )
    return normalizeRole(response.data.data)
  },

  updateRole: async (id: string, data: UpdateRoleInput): Promise<Role> => {
    // Normalize permissions before sending to API
    const normalizedData = {
      ...data,
      ...(data.permissions && {
        permissions: data.permissions
          .map(normalizePermission)
          .filter((p) => permissionPattern.test(p))
          .filter((p, index, arr) => arr.indexOf(p) === index), // Remove duplicates
      }),
    }
    
    const response = await apiClient.patch<ApiResponse<Role>>(
      endpoints.roles.update(id),
      normalizedData
    )
    return normalizeRole(response.data.data)
  },

  deleteRole: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(endpoints.roles.delete(id))
  },

  assignUserToRole: async (id: string, data: AssignUserToRoleInput): Promise<void> => {
    await apiClient.post<ApiResponse<void>>(
      endpoints.roles.assignUser(id),
      data
    )
  },
}
