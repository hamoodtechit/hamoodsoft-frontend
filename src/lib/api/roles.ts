import { AssignUserToRoleInput, CreateRoleInput, UpdateRoleInput } from "@/lib/validations/roles"
import { ApiResponse, Role } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export const rolesApi = {
  createRole: async (data: CreateRoleInput): Promise<Role> => {
    const response = await apiClient.post<ApiResponse<Role>>(
      endpoints.roles.create,
      data
    )
    return response.data.data
  },

  getRoles: async (): Promise<Role[]> => {
    const response = await apiClient.get<ApiResponse<Role[]>>(
      endpoints.roles.list
    )
    return response.data.data
  },

  getRoleById: async (id: string): Promise<Role> => {
    const response = await apiClient.get<ApiResponse<Role>>(
      endpoints.roles.getById(id)
    )
    return response.data.data
  },

  updateRole: async (id: string, data: UpdateRoleInput): Promise<Role> => {
    const response = await apiClient.patch<ApiResponse<Role>>(
      endpoints.roles.update(id),
      data
    )
    return response.data.data
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
