"use client"

import { paymentsApi, type PaymentsListParams } from "@/lib/api/payments"
import { CreatePaymentInput } from "@/lib/validations/payments"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { extractError } from "@/lib/utils/error"

export function usePayments(params?: PaymentsListParams) {
  const queryKey = [
    "payments",
    params?.page ?? 1,
    params?.limit ?? 10,
    params?.search ?? "",
    params?.type ?? null,
    params?.accountId ?? null,
    params?.saleId ?? null,
    params?.purchaseId ?? null,
    params?.contactId ?? null,
    params?.branchId ?? null,
    params?.startDate ?? null,
    params?.endDate ?? null,
  ] as const

  return useQuery({
    queryKey,
    queryFn: () => paymentsApi.getPayments(params),
    refetchOnWindowFocus: true,
    staleTime: 0,
  })
}

export function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: ["payment", id],
    queryFn: () => paymentsApi.getPaymentById(id!),
    enabled: !!id,
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePaymentInput) => paymentsApi.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      queryClient.invalidateQueries({ queryKey: ["purchases"] })
      toast.success("Payment created successfully!")
    },
    onError: (error) => {
      toast.error(extractError(error, "Failed to create payment. Please try again."))
    },
  })
}

export function useDeletePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => paymentsApi.deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      queryClient.invalidateQueries({ queryKey: ["purchases"] })
      toast.success("Payment deleted successfully!")
    },
    onError: (error) => {
      toast.error(extractError(error, "Failed to delete payment. Please try again."))
    },
  })
}
