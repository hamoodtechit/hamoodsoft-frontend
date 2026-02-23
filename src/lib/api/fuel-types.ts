import { ApiResponse, CreateFuelTypeInput, FuelType, PaginatedResult } from "@/types";
import apiClient from "./client";
import { endpoints } from "./endpoints";

export const fuelTypesApi = {
  list: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResult<FuelType>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResult<FuelType>>>(endpoints.fuelTypes.list, { params })
    return response.data.data
  },

  create: async (data: CreateFuelTypeInput): Promise<FuelType> => {
    const response = await apiClient.post<ApiResponse<FuelType>>(endpoints.fuelTypes.create, data)
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(endpoints.fuelTypes.delete(id))
  },
}
