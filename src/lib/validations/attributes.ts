import { z } from "zod"

export const createAttributeSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  name: z
    .string()
    .min(1, "Attribute name is required")
    .min(2, "Attribute name must be at least 2 characters")
    .max(60, "Attribute name must be less than 60 characters"),
  values: z
    .array(z.string().min(1))
    .min(1, "At least one value is required"),
})

export const updateAttributeSchema = z.object({
  productId: z.string().min(1, "Product ID is required").optional(),
  name: z.string().min(2).max(60).optional(),
  values: z.array(z.string().min(1)).min(1).optional(),
})

export type CreateAttributeInput = z.infer<typeof createAttributeSchema>
export type UpdateAttributeInput = z.infer<typeof updateAttributeSchema>

