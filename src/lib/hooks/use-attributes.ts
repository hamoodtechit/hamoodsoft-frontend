"use client"

import { attributesApi, type AttributesListParams } from "@/lib/api/attributes"
import { CreateAttributeInput, UpdateAttributeInput } from "@/lib/validations/attributes"
import { Attribute } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useAttributes(params?: AttributesListParams) {
  return useQuery({
    queryKey: ["attributes", params],
    queryFn: () => attributesApi.list(params),
  })
}

export function useAttribute(id: string | undefined) {
  return useQuery({
    queryKey: ["attribute", id],
    queryFn: () => attributesApi.getById(id!),
    enabled: !!id,
  })
}

export function useCreateAttribute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAttributeInput) => attributesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] })
      toast.success("Attribute created successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create attribute. Please try again."
      toast.error(message)
    },
  })
}

export function useUpdateAttribute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAttributeInput }) =>
      attributesApi.update(id, data),
    onSuccess: (updated: Attribute) => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] })
      queryClient.invalidateQueries({ queryKey: ["attribute", updated.id] })
      toast.success("Attribute updated successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update attribute. Please try again."
      toast.error(message)
    },
  })
}

export function useDeleteAttribute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => attributesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] })
      toast.success("Attribute deleted successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete attribute. Please try again."
      toast.error(message)
    },
  })
}

