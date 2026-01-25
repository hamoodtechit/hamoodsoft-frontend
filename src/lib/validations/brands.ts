import { z } from "zod"

export const createBrandSchema = z.object({
  name: z
    .string()
    .min(1, "Brand name is required")
    .min(2, "Brand name must be at least 2 characters")
    .max(120, "Brand name must be less than 120 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
})

export const updateBrandSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(1000).optional(),
})

export type CreateBrandInput = z.infer<typeof createBrandSchema>
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>
