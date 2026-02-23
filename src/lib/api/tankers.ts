import { ApiResponse, CreateTankerInput, PaginatedResult, Tanker, UpdateTankerInput } from "@/types";
import apiClient from "./client";
import { endpoints } from "./endpoints";

export const tankersApi = {
  list: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResult<Tanker>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResult<Tanker>>>(endpoints.tankers.list, { params })
    return response.data.data
  },

  getById: async (id: string): Promise<Tanker> => {
    const response = await apiClient.get<ApiResponse<Tanker>>(endpoints.tankers.getById(id))
    return response.data.data
  },

  create: async (data: CreateTankerInput): Promise<Tanker> => {
    const response = await apiClient.post<ApiResponse<Tanker>>(endpoints.tankers.create, data)
    return response.data.data
  },

  update: async (id: string, data: UpdateTankerInput): Promise<Tanker> => {
    const response = await apiClient.patch<ApiResponse<Tanker>>(endpoints.tankers.update(id), data)
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(endpoints.tankers.delete(id))
  },
}
