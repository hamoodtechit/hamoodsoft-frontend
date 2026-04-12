import { config } from "@/constants/config"
import { ApiResponse, User } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export interface UpdateUserInput {
  name?: string
  currentBusinessId?: string | null
}

export const usersApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<ApiResponse<User[]>>(endpoints.users.list)
    return response.data.data
  },

  updateUser: async (id: string, data: UpdateUserInput): Promise<User> => {
    const url = endpoints.users.update(id)
    const response = await apiClient.patch<ApiResponse<User>>(url, data)
    return response.data.data
  },

  updatePreferences: async (preferences: Record<string, any>): Promise<any> => {
    const response = await apiClient.patch<ApiResponse<any>>(endpoints.auth.preferences, preferences)
    // we return the full response or just data
    return response.data
  },
}
