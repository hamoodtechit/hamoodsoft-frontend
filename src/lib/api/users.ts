import { ApiResponse, User } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export interface CreateUserInput {
  name: string
  email: string
  password: string
  roleId?: string
}

export interface UpdateUserInput {
  name?: string
  email?: string
  roleId?: string
  currentBusinessId?: string | null
}

export interface ResetUserPasswordInput {
  newPassword: string
}

export const usersApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<ApiResponse<User[]>>(endpoints.users.list)
    return response.data.data
  },

  createUser: async (data: CreateUserInput): Promise<User> => {
    const response = await apiClient.post<ApiResponse<User>>(endpoints.users.create, data)
    return response.data.data
  },

  updateUser: async (id: string, data: UpdateUserInput): Promise<User> => {
    const url = endpoints.users.update(id)
    const response = await apiClient.patch<ApiResponse<User>>(url, data)
    return response.data.data
  },

  removeUser: async (id: string): Promise<{ id: string; removed: boolean }> => {
    const url = endpoints.users.remove(id)
    const response = await apiClient.delete<ApiResponse<{ id: string; removed: boolean }>>(url)
    return response.data.data
  },

  resetUserPassword: async (id: string, data: ResetUserPasswordInput): Promise<{ id: string; passwordReset: boolean }> => {
    const url = endpoints.users.resetPassword(id)
    const response = await apiClient.patch<ApiResponse<{ id: string; passwordReset: boolean }>>(url, data)
    return response.data.data
  },

  updatePreferences: async (preferences: Record<string, unknown>): Promise<unknown> => {
    const response = await apiClient.patch<ApiResponse<unknown>>(endpoints.auth.preferences, preferences)
    // we return the full response or just data
    return response.data
  },
}
