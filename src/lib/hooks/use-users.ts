"use client"

import { usersApi } from "@/lib/api/users"
import type { CreateUserInput, ResetUserPasswordInput } from "@/lib/api/users"
import type { UpdateUserInput } from "@/lib/validations/users"
import type { EditUserInput } from "@/lib/validations/users"
import { useAuthStore } from "@/store"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { User } from "@/types"
import { extractError } from "@/lib/utils/error"

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.getUsers(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateUserInput) => usersApi.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("Team member added successfully!")
    },
    onError: (error) => {
      toast.error(extractError(error, "Failed to add team member. Please try again."))
    },
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

export function useEditUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditUserInput }) => {
      const apiData: { name?: string; email?: string; roleId?: string } = {
        name: data.name,
        email: data.email,
        roleId: data.roleId && data.roleId.length > 0 ? data.roleId : undefined,
      }
      return usersApi.updateUser(id, apiData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("Team member updated successfully!")
    },
    onError: (error) => {
      toast.error(extractError(error, "Failed to update team member. Please try again."))
    },
  })
}

export function useRemoveUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => usersApi.removeUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("Team member removed successfully!")
    },
    onError: (error) => {
      toast.error(extractError(error, "Failed to remove team member. Please try again."))
    },
  })
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResetUserPasswordInput }) =>
      usersApi.resetUserPassword(id, data),
    onSuccess: () => {
      toast.success("Password reset successfully!")
    },
    onError: (error) => {
      toast.error(extractError(error, "Failed to reset password. Please try again."))
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
