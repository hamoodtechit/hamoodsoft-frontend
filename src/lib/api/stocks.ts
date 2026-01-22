import { AdjustStockInput, CreateStockInput, UpdateStockInput, UpdateAdjustmentInput } from "@/lib/validations/stocks"
import { ApiResponse, PaginatedResult, Stock, StockHistory, StockAdjustment } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export type StocksListParams = {
  page?: number
  limit?: number
  search?: string
  branchId?: string
  productId?: string
  sku?: string
  unitId?: string
}

export type StockHistoryListParams = {
  page?: number
  limit?: number
  search?: string
  branchId?: string
  productId?: string
  stockId?: string
}

export type StockAdjustmentsListParams = {
  page?: number
  limit?: number
  search?: string
  branchId?: string
  productId?: string
  stockId?: string
}

type StocksListResponse = PaginatedResult<Stock> | Stock[]

function normalizeList(data: StocksListResponse): PaginatedResult<Stock> {
  if (!Array.isArray(data) && "items" in data) return data as PaginatedResult<Stock>
  const items = Array.isArray(data) ? data : []
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

function normalizeHistoryList(data: PaginatedResult<StockHistory> | StockHistory[]): PaginatedResult<StockHistory> {
  if (!Array.isArray(data) && "items" in data) return data as PaginatedResult<StockHistory>
  const items = Array.isArray(data) ? data : []
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

function normalizeAdjustmentsList(data: PaginatedResult<StockAdjustment> | StockAdjustment[]): PaginatedResult<StockAdjustment> {
  if (!Array.isArray(data) && "items" in data) return data as PaginatedResult<StockAdjustment>
  const items = Array.isArray(data) ? data : []
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

export const stocksApi = {
  create: async (data: CreateStockInput): Promise<Stock> => {
    const response = await apiClient.post<ApiResponse<Stock>>(endpoints.stocks.create, data)
    return response.data.data
  },

  update: async (id: string, data: UpdateStockInput): Promise<Stock> => {
    const response = await apiClient.patch<ApiResponse<Stock>>(endpoints.stocks.update(id), data)
    return response.data.data
  },

  list: async (params?: StocksListParams): Promise<PaginatedResult<Stock>> => {
    // Clean params - remove undefined/null/empty values
    const cleanParams: Record<string, any> = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof StocksListParams]
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value
        }
      })
    }
    
    const response = await apiClient.get<ApiResponse<StocksListResponse>>(
      endpoints.stocks.list,
      { params: cleanParams }
    )
    return normalizeList(response.data.data)
  },

  getById: async (id: string): Promise<Stock> => {
    const response = await apiClient.get<ApiResponse<Stock>>(endpoints.stocks.getById(id))
    return response.data.data
  },

  // Stock Adjustments
  createAdjustment: async (data: AdjustStockInput): Promise<StockHistory> => {
    const response = await apiClient.post<ApiResponse<StockHistory>>(
      endpoints.stocks.adjustments.create,
      data
    )
    return response.data.data
  },

  updateAdjustment: async (id: string, data: UpdateAdjustmentInput): Promise<StockAdjustment> => {
    const response = await apiClient.patch<ApiResponse<StockAdjustment>>(
      endpoints.stocks.adjustments.update(id),
      data
    )
    return response.data.data
  },

  listAdjustments: async (params?: StockAdjustmentsListParams): Promise<PaginatedResult<StockAdjustment>> => {
    // Clean params - remove undefined/null/empty values
    const cleanParams: Record<string, any> = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof StockAdjustmentsListParams]
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value
        }
      })
    }
    
    const response = await apiClient.get<ApiResponse<PaginatedResult<StockAdjustment> | StockAdjustment[]>>(
      endpoints.stocks.adjustments.list,
      { params: cleanParams }
    )
    return normalizeAdjustmentsList(response.data.data)
  },

  // Stock History
  listHistory: async (params?: StockHistoryListParams): Promise<PaginatedResult<StockHistory>> => {
    // Clean params - remove undefined/null/empty values
    const cleanParams: Record<string, any> = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof StockHistoryListParams]
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value
        }
      })
    }
    
    const response = await apiClient.get<ApiResponse<PaginatedResult<StockHistory> | StockHistory[]>>(
      endpoints.stocks.history,
      { params: cleanParams }
    )
    return normalizeHistoryList(response.data.data)
  },
}
