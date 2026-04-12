"use client"

import { usersApi } from "@/lib/api/users"
import { UpdateUserInput } from "@/lib/validations/users"
import { useAuthStore } from "@/store"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.getUsers(),
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  const { user: storeUser, setUser } = useAuthStore()

  return useMutation({
    mutationFn: (data: UpdateUserInput) => {
      // Get user from query cache first, fallback to store
      const cachedUser = queryClient.getQueryData<any>(["auth", "profile"])
      const user = cachedUser || storeUser
      
      if (!user?.id) {
        throw new Error("User ID is required. Please refresh the page and try again.")
      }
      return usersApi.updateUser(user.id, data)
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser)
      queryClient.setQueryData(["auth", "profile"], updatedUser)
      toast.success("Profile updated successfully!")
    },
    onError: (error: any) => {
      console.error("Update user error:", error)
      console.error("Error response:", error?.response?.data)
      console.error("Error status:", error?.response?.status)
      console.error("Request URL:", error?.config?.url)
      console.error("Request data:", error?.config?.data)
      
      const message =
        error?.response?.data?.message || 
        error?.message ||
        "Failed to update profile. Please try again."
      toast.error(message)
    },
  })
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()
  const { user: storeUser, updateUserPreferences } = useAuthStore()

  return useMutation({
    mutationFn: (preferences: Record<string, any>) => {
      return usersApi.updatePreferences(preferences)
    },
    onMutate: async (newPreferences) => {
      // Optimistic upate (handled in UI or in store via updateUserPreferences if exported)
      if (updateUserPreferences) {
        updateUserPreferences(newPreferences)
      }
    },
    onSuccess: (data) => {
      // Refresh profile data or let it be
      queryClient.invalidateQueries({ queryKey: ["auth", "profile"] })
    },
    onError: (error: any) => {
      console.error("Update preferences error:", error)
      toast.error("Failed to save layout preferences")
    },
  })
}
