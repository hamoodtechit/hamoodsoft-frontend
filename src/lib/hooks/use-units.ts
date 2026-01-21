"use client"

import { unitsApi } from "@/lib/api/units"
import { CreateUnitInput, UpdateUnitInput } from "@/lib/validations/units"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useUnits(branchId?: string) {
  return useQuery({
    queryKey: ["units", branchId],
    queryFn: () => unitsApi.getUnits(branchId),
  })
}

export function useUnit(id: string | undefined) {
  return useQuery({
    queryKey: ["unit", id],
    queryFn: () => unitsApi.getUnitById(id!),
    enabled: !!id,
  })
}

export function useCreateUnit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateUnitInput) => unitsApi.createUnit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] })
      toast.success("Unit created successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create unit. Please try again."
      toast.error(message)
    },
  })
}

export function useUpdateUnit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUnitInput }) =>
      unitsApi.updateUnit(id, data),
    onSuccess: (updatedUnit) => {
      queryClient.invalidateQueries({ queryKey: ["units"] })
      queryClient.invalidateQueries({ queryKey: ["unit", updatedUnit.id] })
      toast.success("Unit updated successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update unit. Please try again."
      toast.error(message)
    },
  })
}

export function useDeleteUnit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => unitsApi.deleteUnit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] })
      toast.success("Unit deleted successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete unit. Please try again."
      toast.error(message)
    },
  })
}
