import { ApiResponse, Business } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export interface CreateBusinessInput {
  name: string
  modules?: string[]
}

export interface SelectAppsInput {
  apps: string[] // Array of app IDs
}

export interface SelectAppsResponse {
  success: boolean
  message?: string
}

export const businessApi = {
  createBusiness: async (data: CreateBusinessInput): Promise<Business> => {
    const response = await apiClient.post<ApiResponse<Business>>(
      endpoints.business.create,
      data
    )
    return response.data.data
  },

  getBusinesses: async (): Promise<Business[]> => {
    const response = await apiClient.get<ApiResponse<Business[]>>(
      endpoints.business.list
    )
    return response.data.data
  },

  getBusinessById: async (id: string): Promise<Business> => {
    const response = await apiClient.get<ApiResponse<Business>>(
      endpoints.business.getById(id)
    )
    return response.data.data
  },

  selectApps: async (data: SelectAppsInput): Promise<SelectAppsResponse> => {
    const response = await apiClient.post<ApiResponse<SelectAppsResponse>>(
      endpoints.business.selectApps,
      data
    )
    return response.data.data
  },
}
