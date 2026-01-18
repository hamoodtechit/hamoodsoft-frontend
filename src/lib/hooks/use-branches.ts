"use client"

import { branchesApi } from "@/lib/api/branches"
import { CreateBranchInput, UpdateBranchInput } from "@/lib/validations/branches"
import { Branch } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn: () => branchesApi.getBranches(),
  })
}

export function useBranch(id: string | undefined) {
  return useQuery({
    queryKey: ["branch", id],
    queryFn: () => branchesApi.getBranchById(id!),
    enabled: !!id,
  })
}

export function useCreateBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBranchInput) => branchesApi.createBranch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] })
      toast.success("Branch created successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create branch. Please try again."
      toast.error(message)
    },
  })
}

export function useUpdateBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBranchInput }) =>
      branchesApi.updateBranch(id, data),
    onSuccess: (updatedBranch) => {
      queryClient.invalidateQueries({ queryKey: ["branches"] })
      queryClient.invalidateQueries({ queryKey: ["branch", updatedBranch.id] })
      toast.success("Branch updated successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update branch. Please try again."
      toast.error(message)
    },
  })
}

export function useDeleteBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => branchesApi.deleteBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] })
      toast.success("Branch deleted successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete branch. Please try again."
      toast.error(message)
    },
  })
}
