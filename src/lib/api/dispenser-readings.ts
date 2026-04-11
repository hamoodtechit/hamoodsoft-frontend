import { ApiResponse, CreateDispenserReadingInput, DispenserReading, PaginatedResult } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export const dispenserReadingsApi = {
  list: async (params?: {
    page?: number
    limit?: number
    dispenserId?: string
    tankerId?: string
    branchId?: string
    startDate?: string
    endDate?: string
  }): Promise<PaginatedResult<DispenserReading>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResult<DispenserReading>>>(endpoints.dispenserReadings.list, { params })
    return response.data.data
  },

  getById: async (id: string): Promise<DispenserReading> => {
    const response = await apiClient.get<ApiResponse<DispenserReading>>(endpoints.dispenserReadings.getById(id))
    return response.data.data
  },

  create: async (data: CreateDispenserReadingInput): Promise<DispenserReading> => {
    const response = await apiClient.post<ApiResponse<DispenserReading>>(endpoints.dispenserReadings.create, data)
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(endpoints.dispenserReadings.delete(id))
  },
}
