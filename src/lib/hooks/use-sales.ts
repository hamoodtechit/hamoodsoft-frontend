"use client"

import { salesApi, type SalesListParams } from "@/lib/api/sales"
import { CreateSaleInput, UpdateSaleInput } from "@/lib/validations/sales"
import { Sale } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useSales(params?: SalesListParams) {
  // Create a stable query key that includes all relevant params
  const branchId = params?.branchId
  const queryKey = [
    "sales",
    params?.page ?? 1,
    params?.limit ?? 10,
    params?.search ?? "",
    params?.contactId ?? null,
    params?.status ?? null,
    params?.paymentStatus ?? null,
    branchId ?? null, // Explicitly include branchId (null if undefined) so changes trigger refetch
  ] as const

  return useQuery({
    queryKey,
    queryFn: () => salesApi.getSales(params),
    refetchOnWindowFocus: true,
    staleTime: 0,
  })
}

export function useSale(id: string | undefined) {
  return useQuery({
    queryKey: ["sale", id],
    queryFn: () => salesApi.getSaleById(id!),
    enabled: !!id,
  })
}

export function useCreateSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSaleInput) => salesApi.createSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      toast.success("Sale created successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create sale. Please try again."
      toast.error(message)
    },
  })
}

export function useUpdateSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSaleInput }) =>
      salesApi.updateSale(id, data),
    onSuccess: (updatedSale: Sale) => {
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      queryClient.invalidateQueries({ queryKey: ["sale", updatedSale.id] })
      toast.success("Sale updated successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update sale. Please try again."
      toast.error(message)
    },
  })
}

export function useDeleteSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => salesApi.deleteSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      toast.success("Sale deleted successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete sale. Please try again."
      toast.error(message)
    },
  })
}
