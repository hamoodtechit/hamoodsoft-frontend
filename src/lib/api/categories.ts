import { CreateCategoryInput, UpdateCategoryInput } from "@/lib/validations/categories"
import { ApiResponse, Category } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export const categoriesApi = {
  createCategory: async (data: CreateCategoryInput): Promise<Category> => {
    const response = await apiClient.post<ApiResponse<Category>>(
      endpoints.categories.create,
      data
    )
    return response.data.data
  },

  getCategories: async (branchId?: string): Promise<Category[]> => {
    const response = await apiClient.get<ApiResponse<Category[]>>(
      endpoints.categories.list,
      { params: branchId ? { branchId } : undefined }
    )
    console.log("📦 Categories API Response:", {
      branchId,
      rawResponse: response.data,
      categories: response.data.data,
      categoriesWithParent: response.data.data.filter(c => c.parentId),
      categoriesWithoutParent: response.data.data.filter(c => !c.parentId),
      totalCount: response.data.data.length,
    })
    return response.data.data
  },

  getCategoryById: async (id: string): Promise<Category> => {
    const response = await apiClient.get<ApiResponse<Category>>(
      endpoints.categories.getById(id)
    )
    return response.data.data
  },

  updateCategory: async (id: string, data: UpdateCategoryInput): Promise<Category> => {
    const response = await apiClient.patch<ApiResponse<Category>>(
      endpoints.categories.update(id),
      data
    )
    return response.data.data
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(endpoints.categories.delete(id))
  },
}
