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
    const fullUrl = `${config.api.baseUrl}${url}`
    
    
    const response = await apiClient.patch<ApiResponse<User>>(url, data)
    return response.data.data
  },
}
