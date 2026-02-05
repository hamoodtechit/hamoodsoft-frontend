import { z } from "zod"

// Permission pattern: lowercase letters and underscores only, format: resource:action
const permissionPattern = /^[a-z_]+:[a-z_]+$/

// Helper function to normalize permission strings (convert camelCase to snake_case)
export function normalizePermission(permission: string): string {
  if (!permission || typeof permission !== "string") {
    return permission
  }
  
  // If already in correct format, return as-is
  if (permissionPattern.test(permission)) {
    return permission
  }
  
  // Convert camelCase to snake_case
  // Example: productCategories:read -> product_categories:read
  const [resource, action] = permission.split(":")
  if (!resource || !action) {
    return permission // Return as-is if format is invalid
  }
  
  // Convert camelCase resource to snake_case
  const normalizedResource = resource
    .replace(/([a-z])([A-Z])/g, "$1_$2") // Insert underscore before capital letters
    .toLowerCase()
  
  const normalizedAction = action.toLowerCase()
  const normalized = `${normalizedResource}:${normalizedAction}`
  
  // Only return if it matches the pattern after normalization
  return permissionPattern.test(normalized) ? normalized : permission
}

// Validate and normalize permissions array
const permissionSchema = z
  .string()
  .min(1, "Permission cannot be empty")
  .transform((val) => normalizePermission(val))
  .refine((val) => permissionPattern.test(val), {
    message: "Permission must match pattern: resource:action (lowercase with underscores)",
  })

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, "Role name is required")
    .min(2, "Role name must be at least 2 characters")
    .max(100, "Role name must be less than 100 characters"),
  permissions: z
    .array(permissionSchema)
    .min(1, "At least one permission is required")
    .default([])
    .transform((perms) => {
      // Remove duplicates and filter invalid permissions
      const normalized = perms
        .map(normalizePermission)
        .filter((p) => permissionPattern.test(p))
      return Array.from(new Set(normalized))
    }),
  allowedBranchIds: z
    .array(z.string().uuid("Invalid branch ID"))
    .optional()
    .default([]),
})

export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(100, "Role name must be less than 100 characters")
    .optional(),
  permissions: z
    .array(permissionSchema)
    .optional()
    .transform((perms) => {
      if (!perms) return undefined
      // Remove duplicates and filter invalid permissions
      const normalized = perms
        .map(normalizePermission)
        .filter((p) => permissionPattern.test(p))
      return Array.from(new Set(normalized))
    }),
  allowedBranchIds: z
    .array(z.string().uuid("Invalid branch ID"))
    .optional(),
})

export const assignUserToRoleSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
})

export type CreateRoleInput = z.infer<typeof createRoleSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>
export type AssignUserToRoleInput = z.infer<typeof assignUserToRoleSchema>
