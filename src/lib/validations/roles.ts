import { z } from "zod"

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, "Role name is required")
    .min(2, "Role name must be at least 2 characters")
    .max(100, "Role name must be less than 100 characters"),
  permissions: z
    .array(z.string())
    .min(1, "At least one permission is required")
    .default([]),
})

export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(100, "Role name must be less than 100 characters")
    .optional(),
  permissions: z
    .array(z.string())
    .optional(),
})

export const assignUserToRoleSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
})

export type CreateRoleInput = z.infer<typeof createRoleSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>
export type AssignUserToRoleInput = z.infer<typeof assignUserToRoleSchema>
