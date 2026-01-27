import { z } from "zod"

const optionsKeySchema = z
  .string()
  .uuid({ message: "Option key must be a valid UUID" })

export const productVariantOptionsSchema = z.record(optionsKeySchema, z.string().min(1))

export const createProductVariantSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(120, "SKU must be less than 120 characters").optional(),
  price: z
    .number({ invalid_type_error: "Price must be a number" })
    .int("Price must be an integer")
    .min(0, "Price must be 0 or greater")
    .optional(),
  unitId: z.string().uuid({ message: "Unit ID must be a valid UUID" }).optional(),
  variantName: z
    .string()
    .min(1, "Variant name is required")
    .max(160, "Variant name must be less than 160 characters")
    .optional(),
  options: productVariantOptionsSchema,
  thumbnailUrl: z.string().min(1).optional(),
  images: z.array(z.string().min(1)).optional(),
})

export const updateProductVariantSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(120, "SKU must be less than 120 characters").optional(),
  price: z
    .number({ invalid_type_error: "Price must be a number" })
    .int("Price must be an integer")
    .min(0, "Price must be 0 or greater")
    .optional(),
  unitId: z.string().uuid({ message: "Unit ID must be a valid UUID" }).optional(),
  variantName: z
    .string()
    .min(1, "Variant name is required")
    .max(160, "Variant name must be less than 160 characters")
    .optional(),
  options: productVariantOptionsSchema.optional(),
  thumbnailUrl: z.string().min(1).optional(),
  images: z.array(z.string().min(1)).optional(),
})

export type CreateProductVariantInput = z.infer<typeof createProductVariantSchema>
export type UpdateProductVariantInput = z.infer<typeof updateProductVariantSchema>

