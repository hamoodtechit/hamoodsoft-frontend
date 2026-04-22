"use client"

import { attributesApi, type AttributesListParams } from "@/lib/api/attributes"
import { CreateAttributeInput, UpdateAttributeInput } from "@/lib/validations/attributes"
import { Attribute } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { extractError } from "@/lib/utils/error"

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
    onError: (error) => {
      toast.error(extractError(error, "Failed to create attribute. Please try again."))
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
    onError: (error) => {
      toast.error(extractError(error, "Failed to update attribute. Please try again."))
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
    onError: (error) => {
      toast.error(extractError(error, "Failed to delete attribute. Please try again."))
    },
  })
}

