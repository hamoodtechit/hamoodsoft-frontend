"use client"

import { mediaApi, type MediaListParams } from "@/lib/api/media"
import { UpdateMediaInput, UploadMediaInput } from "@/lib/validations/media"
import { Media } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useMedia(params?: MediaListParams) {
  return useQuery({
    queryKey: ["media", params],
    queryFn: () => mediaApi.list(params),
  })
}

export function useMediaById(id: string | undefined) {
  return useQuery({
    queryKey: ["media", id],
    queryFn: () => {
      // Since there's no getById endpoint, we'll need to fetch from list
      // This is a placeholder - you might want to add a getById endpoint
      throw new Error("getById not implemented")
    },
    enabled: false,
  })
}

export function useUploadMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UploadMediaInput) => mediaApi.upload(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] })
      toast.success("Media uploaded successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to upload media. Please try again."
      toast.error(message)
    },
  })
}

export function useUpdateMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMediaInput }) =>
      mediaApi.update(id, data),
    onSuccess: (updated: Media) => {
      queryClient.invalidateQueries({ queryKey: ["media"] })
      queryClient.invalidateQueries({ queryKey: ["media", updated.id] })
      toast.success("Media updated successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update media. Please try again."
      toast.error(message)
    },
  })
}

export function useDeleteMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => mediaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] })
      toast.success("Media deleted successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete media. Please try again."
      toast.error(message)
    },
  })
}
