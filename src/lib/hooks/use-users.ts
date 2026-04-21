"use client"

import { usersApi } from "@/lib/api/users"
import { UpdateUserInput } from "@/lib/validations/users"
import { useAuthStore } from "@/store"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { User } from "@/types"
import { extractError } from "@/lib/utils/error"

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
      const cachedUser = queryClient.getQueryData<User>(["auth", "profile"])
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
    onError: (error) => {
      console.error("Update user error:", error)
      toast.error(extractError(error, "Failed to update profile. Please try again."))
    },
  })
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()
  const { updateUserPreferences } = useAuthStore()

  return useMutation({
    mutationFn: (preferences: Record<string, unknown>) => {
      return usersApi.updatePreferences(preferences)
    },
    onMutate: async (newPreferences) => {
      // Optimistic upate (handled in UI or in store via updateUserPreferences if exported)
      if (updateUserPreferences) {
        updateUserPreferences(newPreferences)
      }
    },
    onSuccess: () => {
      // Refresh profile data or let it be
      queryClient.invalidateQueries({ queryKey: ["auth", "profile"] })
    },
    onError: (error) => {
      console.error("Update preferences error:", error)
      toast.error(extractError(error, "Failed to save layout preferences"))
    },
  })
}
