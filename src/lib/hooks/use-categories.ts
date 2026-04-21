"use client"

import { categoriesApi } from "@/lib/api/categories"
import { CreateCategoryInput, UpdateCategoryInput } from "@/lib/validations/categories"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { extractError } from "@/lib/utils/error"

export function useCategories(branchId?: string) {
  return useQuery({
    queryKey: ["categories", branchId],
    queryFn: () => categoriesApi.getCategories(branchId),
  })
}

export function useCategory(id: string | undefined) {
  return useQuery({
    queryKey: ["category", id],
    queryFn: () => categoriesApi.getCategoryById(id!),
    enabled: !!id,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCategoryInput) => categoriesApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.success("Category created successfully!")
    },
    onError: (error) => {
      toast.error(extractError(error, "Failed to create category. Please try again."))
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryInput }) =>
      categoriesApi.updateCategory(id, data),
    onSuccess: (updatedCategory) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      queryClient.invalidateQueries({ queryKey: ["category", updatedCategory.id] })
      toast.success("Category updated successfully!")
    },
    onError: (error) => {
      toast.error(extractError(error, "Failed to update category. Please try again."))
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.success("Category deleted successfully!")
    },
    onError: (error) => {
      toast.error(extractError(error, "Failed to delete category. Please try again."))
    },
  })
}
