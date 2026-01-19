"use client"

import { rolesApi } from "@/lib/api/roles"
import { AssignUserToRoleInput, CreateRoleInput, UpdateRoleInput } from "@/lib/validations/roles"
import { Role } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesApi.getRoles(),
  })
}

export function useRole(id: string | undefined) {
  return useQuery({
    queryKey: ["role", id],
    queryFn: () => rolesApi.getRoleById(id!),
    enabled: !!id,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateRoleInput) => rolesApi.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      toast.success("Role created successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create role. Please try again."
      toast.error(message)
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleInput }) =>
      rolesApi.updateRole(id, data),
    onSuccess: (updatedRole) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      queryClient.invalidateQueries({ queryKey: ["role", updatedRole.id] })
      toast.success("Role updated successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update role. Please try again."
      toast.error(message)
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => rolesApi.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      toast.success("Role deleted successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete role. Please try again."
      toast.error(message)
    },
  })
}

export function useAssignUserToRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: AssignUserToRoleInput }) =>
      rolesApi.assignUserToRole(roleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      toast.success("User assigned to role successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to assign user to role. Please try again."
      toast.error(message)
    },
  })
}
