import { z } from "zod"

const productVariantSchema = z.object({
  variantName: z.string().min(1, "Variant name is required"),
  sku: z.string().optional(),
  price: z.number({ invalid_type_error: "Price must be a number" }).min(0, "Price must be 0 or greater"),
  unitId: z.string().uuid().optional(),
  options: z.record(z.string().min(1), z.string().min(1)), // Backend expects attribute names as keys (e.g., "Color", "Size")
})

export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .min(2, "Product name must be at least 2 characters")
    .max(120, "Product name must be less than 120 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  price: z
    .number({ invalid_type_error: "Price must be a number" })
    .min(0, "Price must be 0 or greater"),
  unitId: z.string().min(1, "Unit is required"),
  categoryIds: z.array(z.string()).optional(),
  branchIds: z.array(z.string()).optional(),
  brandId: z.string().optional(),
  variants: z.array(productVariantSchema).optional(),
})

export const updateProductSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters").max(120).optional(),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  price: z
    .number({ invalid_type_error: "Price must be a number" })
    .min(0, "Price must be 0 or greater")
    .optional(),
  unitId: z.string().min(1, "Unit is required").optional(),
  categoryIds: z.array(z.string()).optional(),
  branchIds: z.array(z.string()).optional(),
  brandId: z.string().optional(),
  variants: z.array(productVariantSchema).optional(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>

