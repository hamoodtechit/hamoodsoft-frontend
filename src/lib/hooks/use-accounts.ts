"use client"

import { accountsApi, type AccountsListParams, type AccountLedgerParams } from "@/lib/api/accounts"
import { CreateAccountInput, UpdateAccountInput } from "@/lib/validations/accounts"
import { Account } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useAccounts(params?: AccountsListParams) {
  const queryKey = [
    "accounts",
    params?.page ?? 1,
    params?.limit ?? 10,
    params?.search ?? "",
    params?.type ?? null,
    params?.isActive ?? null,
  ] as const

  return useQuery({
    queryKey,
    queryFn: () => accountsApi.getAccounts(params),
    refetchOnWindowFocus: true,
    staleTime: 0,
  })
}

export function useAccount(id: string | undefined) {
  return useQuery({
    queryKey: ["account", id],
    queryFn: () => accountsApi.getAccountById(id!),
    enabled: !!id,
  })
}

export function useAccountLedger(id: string | undefined, params?: AccountLedgerParams) {
  return useQuery({
    queryKey: ["account-ledger", id, params?.startDate, params?.endDate],
    queryFn: () => accountsApi.getAccountLedger(id!, params),
    enabled: !!id,
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAccountInput) => accountsApi.createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      toast.success("Account created successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create account. Please try again."
      toast.error(message)
    },
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAccountInput }) =>
      accountsApi.updateAccount(id, data),
    onSuccess: (updatedAccount: Account) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      queryClient.invalidateQueries({ queryKey: ["account", updatedAccount.id] })
      toast.success("Account updated successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update account. Please try again."
      toast.error(message)
    },
  })
}
