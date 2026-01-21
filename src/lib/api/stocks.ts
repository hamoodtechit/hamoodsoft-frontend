import { AdjustStockInput, CreateStockInput } from "@/lib/validations/stocks"
import { ApiResponse, PaginatedResult, Stock, StockHistory } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

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

export const stocksApi = {
  create: async (data: CreateStockInput): Promise<Stock> => {
    const response = await apiClient.post<ApiResponse<Stock>>(endpoints.stocks.create, data)
    return response.data.data
  },

  adjust: async (data: AdjustStockInput): Promise<StockHistory> => {
    const response = await apiClient.post<ApiResponse<StockHistory>>(endpoints.stocks.adjust, data)
    return response.data.data
  },

  list: async (): Promise<PaginatedResult<Stock>> => {
    const response = await apiClient.get<ApiResponse<StocksListResponse>>(endpoints.stocks.list)
    return normalizeList(response.data.data)
  },

  getById: async (id: string): Promise<Stock> => {
    const response = await apiClient.get<ApiResponse<Stock>>(endpoints.stocks.getById(id))
    return response.data.data
  },

  listByBranch: async (branchId: string): Promise<PaginatedResult<Stock>> => {
    const response = await apiClient.get<ApiResponse<StocksListResponse>>(
      endpoints.stocks.listByBranch(branchId)
    )
    return normalizeList(response.data.data)
  },

  listByProduct: async (productId: string): Promise<PaginatedResult<Stock>> => {
    const response = await apiClient.get<ApiResponse<StocksListResponse>>(
      endpoints.stocks.listByProduct(productId)
    )
    return normalizeList(response.data.data)
  },

  historyByBranch: async (branchId: string): Promise<StockHistory[]> => {
    const response = await apiClient.get<ApiResponse<StockHistory[]>>(
      endpoints.stocks.historyByBranch(branchId)
    )
    return response.data.data
  },

  historyByProduct: async (productId: string): Promise<StockHistory[]> => {
    const response = await apiClient.get<ApiResponse<StockHistory[]>>(
      endpoints.stocks.historyByProduct(productId)
    )
    return response.data.data
  },

  historyByBranchAndProduct: async (branchId: string, productId: string): Promise<StockHistory[]> => {
    const response = await apiClient.get<ApiResponse<StockHistory[]>>(
      endpoints.stocks.historyByBranchAndProduct(branchId, productId)
    )
    return response.data.data
  },

  historyByStock: async (stockId: string): Promise<StockHistory[]> => {
    const response = await apiClient.get<ApiResponse<StockHistory[]>>(
      endpoints.stocks.historyByStock(stockId)
    )
    return response.data.data
  },
}

