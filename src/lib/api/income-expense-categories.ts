import { CreateIncomeExpenseCategoryInput, UpdateIncomeExpenseCategoryInput } from "@/lib/validations/income-expense-categories"
import { ApiResponse, IncomeExpenseCategory, PaginatedResult } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export type IncomeExpenseCategoriesListParams = {
  page?: number
  limit?: number
  search?: string
  type?: "INCOME" | "EXPENSE"
  isActive?: boolean
}

type IncomeExpenseCategoriesResponseShape = {
  items: IncomeExpenseCategory[]
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
    [key: string]: any
  }
}

function normalizeIncomeExpenseCategoriesList(data: PaginatedResult<IncomeExpenseCategory> | IncomeExpenseCategoriesResponseShape | IncomeExpenseCategory[]): PaginatedResult<IncomeExpenseCategory> {
  if (!Array.isArray(data) && "items" in data) {
    const meta = data.meta || {}
    const items = data.items || []
    return {
      items,
      meta: {
        page: meta.page ?? 1,
        limit: meta.limit ?? (items.length || 10),
        total: meta.total ?? items.length ?? 0,
        totalPages: meta.totalPages ?? undefined,
      },
    }
  }

  if (Array.isArray(data)) {
    return {
      items: data,
      meta: {
        page: 1,
        limit: data.length,
        total: data.length,
        totalPages: 1,
      },
    }
  }

  return {
    items: [],
    meta: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  }
}

export const incomeExpenseCategoriesApi = {
  getIncomeExpenseCategories: async (params?: IncomeExpenseCategoriesListParams): Promise<PaginatedResult<IncomeExpenseCategory>> => {
    const cleanParams: Record<string, any> = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof IncomeExpenseCategoriesListParams]
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value
        }
      })
    }

    const response = await apiClient.get<ApiResponse<PaginatedResult<IncomeExpenseCategory> | IncomeExpenseCategoriesResponseShape | IncomeExpenseCategory[]>>(
      endpoints.incomeExpenseCategories.list,
      { params: cleanParams }
    )
    return normalizeIncomeExpenseCategoriesList(response.data.data)
  },

  getIncomeExpenseCategoryById: async (id: string): Promise<IncomeExpenseCategory> => {
    const response = await apiClient.get<ApiResponse<IncomeExpenseCategory>>(endpoints.incomeExpenseCategories.getById(id))
    return response.data.data
  },

  createIncomeExpenseCategory: async (data: CreateIncomeExpenseCategoryInput): Promise<IncomeExpenseCategory> => {
    const response = await apiClient.post<ApiResponse<IncomeExpenseCategory>>(endpoints.incomeExpenseCategories.create, data)
    return response.data.data
  },

  updateIncomeExpenseCategory: async (id: string, data: UpdateIncomeExpenseCategoryInput): Promise<IncomeExpenseCategory> => {
    const response = await apiClient.patch<ApiResponse<IncomeExpenseCategory>>(endpoints.incomeExpenseCategories.update(id), data)
    return response.data.data
  },

  deleteIncomeExpenseCategory: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(endpoints.incomeExpenseCategories.delete(id))
  },
}
