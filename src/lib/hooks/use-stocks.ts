"use client"

import { stocksApi, StocksListParams, StockHistoryListParams, StockAdjustmentsListParams } from "@/lib/api/stocks"
import { AdjustStockInput, CreateStockInput, UpdateStockInput, UpdateAdjustmentInput } from "@/lib/validations/stocks"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

// List stocks with pagination and filters
export function useStocks(params?: StocksListParams) {
  return useQuery({
    queryKey: ["stocks", params?.page, params?.limit, params?.search, params?.branchId, params?.productId, params?.sku, params?.unitId],
    queryFn: () => stocksApi.list(params),
    refetchOnWindowFocus: true,
  })
}

// Get single stock by ID
export function useStock(id: string | undefined) {
  return useQuery({
    queryKey: ["stock", id],
    queryFn: () => stocksApi.getById(id!),
    enabled: !!id,
  })
}

// List stock history with pagination and filters
export function useStockHistory(params?: StockHistoryListParams) {
  return useQuery({
    queryKey: ["stockHistory", params?.page, params?.limit, params?.search, params?.branchId, params?.productId, params?.stockId],
    queryFn: () => stocksApi.listHistory(params),
    refetchOnWindowFocus: true,
  })
}

// List stock adjustments with pagination and filters
export function useStockAdjustments(params?: StockAdjustmentsListParams) {
  return useQuery({
    queryKey: ["stockAdjustments", params?.page, params?.limit, params?.search, params?.branchId, params?.productId, params?.stockId],
    queryFn: () => stocksApi.listAdjustments(params),
    refetchOnWindowFocus: true,
  })
}

// Create stock mutation
export function useCreateStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateStockInput) => stocksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] })
      toast.success("Stock created successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create stock. Please try again."
      toast.error(message)
    },
  })
}

// Update stock mutation
export function useUpdateStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStockInput }) => stocksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] })
      queryClient.invalidateQueries({ queryKey: ["stock"] })
      toast.success("Stock updated successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update stock. Please try again."
      toast.error(message)
    },
  })
}

// Create stock adjustment mutation
export function useAdjustStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AdjustStockInput) => stocksApi.createAdjustment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] })
      queryClient.invalidateQueries({ queryKey: ["stockHistory"] })
      queryClient.invalidateQueries({ queryKey: ["stockAdjustments"] })
      toast.success("Stock adjusted successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to adjust stock. Please try again."
      toast.error(message)
    },
  })
}

// Update stock adjustment mutation
export function useUpdateStockAdjustment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdjustmentInput }) => 
      stocksApi.updateAdjustment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stockAdjustments"] })
      queryClient.invalidateQueries({ queryKey: ["stockHistory"] })
      toast.success("Stock adjustment updated successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update stock adjustment. Please try again."
      toast.error(message)
    },
  })
}
