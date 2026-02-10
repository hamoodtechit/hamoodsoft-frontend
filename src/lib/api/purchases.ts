import { CreatePurchaseInput, UpdatePurchaseInput } from "@/lib/validations/purchases"
import { ApiResponse, PaginatedResult, Purchase } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export type PurchasesListParams = {
  page?: number
  limit?: number
  search?: string
  branchId?: string
  contactId?: string
  status?: "PENDING" | "COMPLETED" | "CANCELLED"
}

type PurchasesResponseShape = {
  items: Purchase[]
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
    [key: string]: any
  }
}

function normalizePurchase(purchase: Purchase): Purchase {
  // Normalize purchase items: API returns purchaseItems, but we use items for consistency
  if (purchase.purchaseItems && !purchase.items) {
    purchase.items = purchase.purchaseItems
  }

  // Map totalPrice to totalAmount for backward compatibility
  return {
    ...purchase,
    items: purchase.items || purchase.purchaseItems || [],
    totalAmount: purchase.totalPrice ?? purchase.totalAmount ?? 0,
  }
}

function normalizePurchasesList(data: PaginatedResult<Purchase> | PurchasesResponseShape | Purchase[]): PaginatedResult<Purchase> {
  // If backend already returns { items, meta }
  if (!Array.isArray(data) && "items" in data) {
    const meta = data.meta || {}
    const items = (data.items || []).map(normalizePurchase)
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
    return {
      ...(data as PaginatedResult<Purchase>),
      items: (data as PaginatedResult<Purchase>).items.map(normalizePurchase),
    }
  }

  // Fallback: plain array
  const items = Array.isArray(data) ? data.map(normalizePurchase) : []
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

export const purchasesApi = {
  createPurchase: async (data: CreatePurchaseInput): Promise<Purchase> => {
    const response = await apiClient.post<ApiResponse<Purchase>>(endpoints.purchases.create, data)
    return response.data.data
  },

  getPurchases: async (params?: PurchasesListParams): Promise<PaginatedResult<Purchase>> => {
    // Clean params - remove undefined/null/empty values
    const cleanParams: Record<string, any> = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof PurchasesListParams]
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value
        }
      })
    }
    
    console.log("GET /purchases - Request params:", cleanParams)
    const response = await apiClient.get<ApiResponse<PaginatedResult<Purchase> | PurchasesResponseShape | Purchase[]>>(
      endpoints.purchases.list,
      { params: cleanParams }
    )
    console.log("GET /purchases - Response:", response.data)
    console.log("GET /purchases - Normalized data:", normalizePurchasesList(response.data.data))
    return normalizePurchasesList(response.data.data)
  },

  getPurchaseById: async (id: string): Promise<Purchase> => {
    console.log(`GET /purchases/${id} - Request`)
    const response = await apiClient.get<ApiResponse<Purchase>>(endpoints.purchases.getById(id))
    console.log(`GET /purchases/${id} - Response:`, response.data)
    console.log(`GET /purchases/${id} - Purchase data:`, response.data.data)
    return normalizePurchase(response.data.data)
  },

  updatePurchase: async (id: string, data: UpdatePurchaseInput): Promise<Purchase> => {
    const response = await apiClient.patch<ApiResponse<Purchase>>(endpoints.purchases.update(id), data)
    return response.data.data
  },

  deletePurchase: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(endpoints.purchases.delete(id))
  },
}
