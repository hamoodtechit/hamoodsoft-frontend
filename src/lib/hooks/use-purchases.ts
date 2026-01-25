"use client"

import { purchasesApi, type PurchasesListParams } from "@/lib/api/purchases"
import { CreatePurchaseInput, UpdatePurchaseInput } from "@/lib/validations/purchases"
import { Purchase } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function usePurchases(params?: PurchasesListParams) {
  const branchId = params?.branchId
  const queryKey = [
    "purchases",
    params?.page ?? 1,
    params?.limit ?? 10,
    params?.search ?? "",
    params?.contactId ?? null,
    params?.status ?? null,
    branchId ?? null,
  ] as const

  return useQuery({
    queryKey,
    queryFn: () => purchasesApi.getPurchases(params),
    refetchOnWindowFocus: true,
    staleTime: 0,
  })
}

export function usePurchase(id: string | undefined) {
  return useQuery({
    queryKey: ["purchase", id],
    queryFn: () => purchasesApi.getPurchaseById(id!),
    enabled: !!id,
  })
}

export function useCreatePurchase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePurchaseInput) => purchasesApi.createPurchase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] })
      toast.success("Purchase created successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create purchase. Please try again."
      toast.error(message)
    },
  })
}

export function useUpdatePurchase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePurchaseInput }) =>
      purchasesApi.updatePurchase(id, data),
    onSuccess: (updatedPurchase: Purchase) => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] })
      queryClient.invalidateQueries({ queryKey: ["purchase", updatedPurchase.id] })
      toast.success("Purchase updated successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update purchase. Please try again."
      toast.error(message)
    },
  })
}

export function useDeletePurchase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => purchasesApi.deletePurchase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] })
      toast.success("Purchase deleted successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete purchase. Please try again."
      toast.error(message)
    },
  })
}
