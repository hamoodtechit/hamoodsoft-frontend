import { ApiResponse, CreateDispenserInput, Dispenser, PaginatedResult, UpdateDispenserInput } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export const dispensersApi = {
  list: async (params?: { page?: number; limit?: number; search?: string; branchId?: string }): Promise<PaginatedResult<Dispenser>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResult<Dispenser>>>(endpoints.dispensers.list, { params })
    return response.data.data
  },

  getById: async (id: string): Promise<Dispenser> => {
    const response = await apiClient.get<ApiResponse<Dispenser>>(endpoints.dispensers.getById(id))
    return response.data.data
  },

  create: async (data: CreateDispenserInput): Promise<Dispenser> => {
    const response = await apiClient.post<ApiResponse<Dispenser>>(endpoints.dispensers.create, data)
    return response.data.data
  },

  update: async (id: string, data: UpdateDispenserInput): Promise<Dispenser> => {
    const response = await apiClient.patch<ApiResponse<Dispenser>>(endpoints.dispensers.update(id), data)
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(endpoints.dispensers.delete(id))
  },
}
