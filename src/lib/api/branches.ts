import { CreateBranchInput, UpdateBranchInput } from "@/lib/validations/branches"
import { ApiResponse, Branch } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export const branchesApi = {
  createBranch: async (data: CreateBranchInput): Promise<Branch> => {
    const response = await apiClient.post<ApiResponse<Branch>>(
      endpoints.branches.create,
      data
    )
    return response.data.data
  },

  getBranches: async (): Promise<Branch[]> => {
    const response = await apiClient.get<ApiResponse<Branch[]>>(
      endpoints.branches.list
    )
    return response.data.data
  },

  getBranchById: async (id: string): Promise<Branch> => {
    const response = await apiClient.get<ApiResponse<Branch>>(
      endpoints.branches.getById(id)
    )
    return response.data.data
  },

  updateBranch: async (id: string, data: UpdateBranchInput): Promise<Branch> => {
    const response = await apiClient.patch<ApiResponse<Branch>>(
      endpoints.branches.update(id),
      data
    )
    return response.data.data
  },

  deleteBranch: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(endpoints.branches.delete(id))
  },
}
