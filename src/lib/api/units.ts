import { CreateUnitInput, UpdateUnitInput } from "@/lib/validations/units"
import { ApiResponse, Unit } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export const unitsApi = {
  createUnit: async (data: CreateUnitInput): Promise<Unit> => {
    const response = await apiClient.post<ApiResponse<Unit>>(
      endpoints.units.create,
      data
    )
    return response.data.data
  },

  getUnits: async (branchId?: string): Promise<Unit[]> => {
    const response = await apiClient.get<ApiResponse<Unit[]>>(
      endpoints.units.list,
      { params: branchId ? { branchId } : undefined }
    )
    return response.data.data
  },

  getUnitById: async (id: string): Promise<Unit> => {
    const response = await apiClient.get<ApiResponse<Unit>>(
      endpoints.units.getById(id)
    )
    return response.data.data
  },

  updateUnit: async (id: string, data: UpdateUnitInput): Promise<Unit> => {
    const response = await apiClient.patch<ApiResponse<Unit>>(
      endpoints.units.update(id),
      data
    )
    return response.data.data
  },

  deleteUnit: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(endpoints.units.delete(id))
  },
}
