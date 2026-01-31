import { z } from "zod"

// Base variant schema for both create and update
// For updates, include 'id' to identify existing variants
const productVariantSchema = z.object({
  id: z.string().uuid().optional(), // Required for updates to identify existing variants
  variantName: z.string().min(1, "Variant name is required"),
  sku: z.string().optional(), // SKU is managed by backend, optional in payload
  price: z.number({ invalid_type_error: "Price must be a number" }).min(0, "Price must be 0 or greater"),
  unitId: z.string().uuid().optional(),
  options: z.record(z.string().min(1), z.string().min(1)), // Backend expects attribute names as keys (e.g., "Color", "Size")
  thumbnailUrl: z.string().min(1).optional(),
  images: z.array(z.string().min(1)).optional(),
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
  alertQuantity: z.number().min(0, "Alert quantity must be 0 or greater").nullable().optional(),
  barcode: z.string().nullable().optional(),
  barcodeType: z.string().nullable().optional(),
  weight: z.number().min(0, "Weight must be 0 or greater").nullable().optional(),
  profitMarginAmount: z.number().min(0, "Profit margin amount must be 0 or greater").optional(),
  profitMarginPercent: z.number().min(0, "Profit margin percent must be 0 or greater").max(100, "Profit margin percent cannot exceed 100").optional(),
  purchasePrice: z.number().min(0, "Purchase price must be 0 or greater").optional(),
  salePrice: z.number().min(0, "Sale price must be 0 or greater").optional(),
  thumbnailUrl: z.string().nullable().optional(),
  images: z.array(z.string().min(1)).optional(),
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
  alertQuantity: z.number().min(0, "Alert quantity must be 0 or greater").nullable().optional(),
  barcode: z.string().nullable().optional(),
  barcodeType: z.string().nullable().optional(),
  weight: z.number().min(0, "Weight must be 0 or greater").nullable().optional(),
  profitMarginAmount: z.number().min(0, "Profit margin amount must be 0 or greater").optional(),
  profitMarginPercent: z.number().min(0, "Profit margin percent must be 0 or greater").max(100, "Profit margin percent cannot exceed 100").optional(),
  purchasePrice: z.number().min(0, "Purchase price must be 0 or greater").optional(),
  salePrice: z.number().min(0, "Sale price must be 0 or greater").optional(),
  thumbnailUrl: z.string().nullable().optional(),
  images: z.array(z.string().min(1)).optional(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>

