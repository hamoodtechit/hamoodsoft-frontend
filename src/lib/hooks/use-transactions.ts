"use client"

import { transactionsApi, type TransactionsListParams } from "@/lib/api/transactions"
import { CreateIncomeTransactionInput, CreateExpenseTransactionInput } from "@/lib/validations/transactions"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useTransactions(params?: TransactionsListParams) {
  const queryKey = [
    "transactions",
    params?.page ?? 1,
    params?.limit ?? 10,
    params?.search ?? "",
    params?.type ?? null,
    params?.accountId ?? null,
    params?.branchId ?? null,
    params?.contactId ?? null,
    params?.categoryId ?? null,
    params?.startDate ?? null,
    params?.endDate ?? null,
  ] as const

  return useQuery({
    queryKey,
    queryFn: () => transactionsApi.getTransactions(params),
    refetchOnWindowFocus: true,
    staleTime: 0,
  })
}

export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: ["transaction", id],
    queryFn: () => transactionsApi.getTransactionById(id!),
    enabled: !!id,
  })
}

export function useCreateIncomeTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateIncomeTransactionInput) => transactionsApi.createIncomeTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      toast.success("Income transaction created successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create income transaction. Please try again."
      toast.error(message)
    },
  })
}

export function useCreateExpenseTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateExpenseTransactionInput) => transactionsApi.createExpenseTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      toast.success("Expense transaction created successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create expense transaction. Please try again."
      toast.error(message)
    },
  })
}
