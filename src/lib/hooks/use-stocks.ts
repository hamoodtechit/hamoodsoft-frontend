"use client"

import { stocksApi } from "@/lib/api/stocks"
import { AdjustStockInput, CreateStockInput } from "@/lib/validations/stocks"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useStocks() {
  return useQuery({
    queryKey: ["stocks"],
    queryFn: () => stocksApi.list(),
  })
}

export function useStock(id: string | undefined) {
  return useQuery({
    queryKey: ["stock", id],
    queryFn: () => stocksApi.getById(id!),
    enabled: !!id,
  })
}

export function useStocksByBranch(branchId: string | undefined) {
  return useQuery({
    queryKey: ["stocks", "branch", branchId],
    queryFn: () => stocksApi.listByBranch(branchId!),
    enabled: !!branchId,
  })
}

export function useStocksByProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ["stocks", "product", productId],
    queryFn: () => stocksApi.listByProduct(productId!),
    enabled: !!productId,
  })
}

export function useStockHistoryByBranch(branchId: string | undefined) {
  return useQuery({
    queryKey: ["stockHistory", "branch", branchId],
    queryFn: () => stocksApi.historyByBranch(branchId!),
    enabled: !!branchId,
  })
}

export function useStockHistoryByProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ["stockHistory", "product", productId],
    queryFn: () => stocksApi.historyByProduct(productId!),
    enabled: !!productId,
  })
}

export function useStockHistoryByBranchAndProduct(branchId: string | undefined, productId: string | undefined) {
  return useQuery({
    queryKey: ["stockHistory", "branch", branchId, "product", productId],
    queryFn: () => stocksApi.historyByBranchAndProduct(branchId!, productId!),
    enabled: !!branchId && !!productId,
  })
}

export function useStockHistoryByStock(stockId: string | undefined) {
  return useQuery({
    queryKey: ["stockHistory", "stock", stockId],
    queryFn: () => stocksApi.historyByStock(stockId!),
    enabled: !!stockId,
  })
}

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

export function useAdjustStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AdjustStockInput) => stocksApi.adjust(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] })
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

