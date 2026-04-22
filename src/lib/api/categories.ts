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
    try {
      const response = await apiClient.get<ApiResponse<Record<string, unknown>>>(
        endpoints.categories.list,
        { params: branchId ? { branchId } : undefined }
      )
      
      // Backend returns { success: true, message: string, data: { items: CategoryNode[], meta: {...} } }
      // where CategoryNode has nested children arrays
      const responseData = response.data.data
      
      // Handle paginated response { items, meta }
      let categories: Category[] = []
      if (responseData && typeof responseData === 'object') {
        if ('items' in responseData && Array.isArray(responseData.items)) {
          categories = responseData.items
        } else if (Array.isArray(responseData)) {
          categories = responseData
        }
      }
      
      
      return categories
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { data?: unknown; status?: number } }
      console.error("❌ Error fetching categories:", error)
      console.error("Error details:", {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
      })
      return []
    }
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
