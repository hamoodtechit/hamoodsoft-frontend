"use client"

import { incomeExpenseCategoriesApi, type IncomeExpenseCategoriesListParams } from "@/lib/api/income-expense-categories"
import { CreateIncomeExpenseCategoryInput, UpdateIncomeExpenseCategoryInput } from "@/lib/validations/income-expense-categories"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useIncomeExpenseCategories(params?: IncomeExpenseCategoriesListParams) {
  const queryKey = [
    "income-expense-categories",
    params?.page ?? 1,
    params?.limit ?? 10,
    params?.search ?? "",
    params?.type ?? null,
    params?.isActive ?? null,
  ] as const

  return useQuery({
    queryKey,
    queryFn: () => incomeExpenseCategoriesApi.getIncomeExpenseCategories(params),
    refetchOnWindowFocus: true,
    staleTime: 0,
  })
}

export function useIncomeExpenseCategory(id: string | undefined) {
  return useQuery({
    queryKey: ["income-expense-category", id],
    queryFn: () => incomeExpenseCategoriesApi.getIncomeExpenseCategoryById(id!),
    enabled: !!id,
  })
}

export function useCreateIncomeExpenseCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateIncomeExpenseCategoryInput) => incomeExpenseCategoriesApi.createIncomeExpenseCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income-expense-categories"] })
      toast.success("Category created successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create category. Please try again."
      toast.error(message)
    },
  })
}

export function useUpdateIncomeExpenseCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIncomeExpenseCategoryInput }) =>
      incomeExpenseCategoriesApi.updateIncomeExpenseCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income-expense-categories"] })
      queryClient.invalidateQueries({ queryKey: ["income-expense-category"] })
      toast.success("Category updated successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update category. Please try again."
      toast.error(message)
    },
  })
}

export function useDeleteIncomeExpenseCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => incomeExpenseCategoriesApi.deleteIncomeExpenseCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income-expense-categories"] })
      toast.success("Category deleted successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete category. Please try again."
      toast.error(message)
    },
  })
}
