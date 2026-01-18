import { z } from "zod"

export const createBranchSchema = z.object({
  name: z
    .string()
    .min(1, "Branch name is required")
    .min(2, "Branch name must be at least 2 characters")
    .max(100, "Branch name must be less than 100 characters"),
  address: z
    .string()
    .min(1, "Address is required")
    .min(5, "Address must be at least 5 characters")
    .max(255, "Address must be less than 255 characters"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .max(20, "Phone number must be less than 20 characters"),
})

export const updateBranchSchema = z.object({
  name: z
    .string()
    .min(2, "Branch name must be at least 2 characters")
    .max(100, "Branch name must be less than 100 characters")
    .optional(),
  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(255, "Address must be less than 255 characters")
    .optional(),
  phone: z
    .string()
    .max(20, "Phone number must be less than 20 characters")
    .optional(),
})

export type CreateBranchInput = z.infer<typeof createBranchSchema>
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>
