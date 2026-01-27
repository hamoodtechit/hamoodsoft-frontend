import { CreateSaleInput, UpdateSaleInput } from "@/lib/validations/sales"
import { ApiResponse, PaginatedResult, Sale } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export type SalesListParams = {
  page?: number
  limit?: number
  search?: string
  branchId?: string
  contactId?: string
  status?: "DRAFT" | "SOLD" | "PENDING"
  paymentStatus?: "PAID" | "DUE" | "PARTIAL"
}

type SalesResponseShape = {
  items: Sale[]
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
    [key: string]: any
  }
}

// Normalize sale items: API returns saleItems, but we use items for consistency
function normalizeSale(sale: Sale): Sale {
  if (sale.saleItems && !sale.items) {
    sale.items = sale.saleItems
  }
  return sale
}

function normalizeSalesList(data: PaginatedResult<Sale> | SalesResponseShape | Sale[]): PaginatedResult<Sale> {
  // If backend already returns { items, meta }
  if (!Array.isArray(data) && "items" in data) {
    const meta = data.meta || {}
    const items = (data.items || []).map(normalizeSale)
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

  // If backend returns full PaginatedResult with meta nested
  if (!Array.isArray(data) && "meta" in data && "items" in data) {
    const normalized = data as PaginatedResult<Sale>
    normalized.items = normalized.items.map(normalizeSale)
    return normalized
  }

  // Fallback: plain array
  const items = Array.isArray(data) ? data.map(normalizeSale) : []
  return {
    items,
    meta: {
      page: 1,
      limit: items.length || 10,
      total: items.length,
      totalPages: 1,
    },
  }
}

export const salesApi = {
  createSale: async (data: CreateSaleInput): Promise<Sale> => {
    const response = await apiClient.post<ApiResponse<Sale>>(endpoints.sales.create, data)
    return normalizeSale(response.data.data)
  },

  getSales: async (params?: SalesListParams): Promise<PaginatedResult<Sale>> => {
    // Clean params - remove undefined/null/empty values
    const cleanParams: Record<string, any> = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof SalesListParams]
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value
        }
      })
    }
    
    const response = await apiClient.get<ApiResponse<PaginatedResult<Sale> | SalesResponseShape | Sale[]>>(
      endpoints.sales.list,
      { params: cleanParams }
    )
    return normalizeSalesList(response.data.data)
  },

  getSaleById: async (id: string): Promise<Sale> => {
    const response = await apiClient.get<ApiResponse<Sale>>(endpoints.sales.getById(id))
    return normalizeSale(response.data.data)
  },

  updateSale: async (id: string, data: UpdateSaleInput): Promise<Sale> => {
    const response = await apiClient.patch<ApiResponse<Sale>>(endpoints.sales.update(id), data)
    return normalizeSale(response.data.data)
  },

  deleteSale: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(endpoints.sales.delete(id))
  },
}
