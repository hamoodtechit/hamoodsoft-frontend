import { z } from "zod"

export const createStockSchema = z.object({
  branchId: z.string().min(1, "Branch is required"),
  productId: z.string().min(1, "Product is required"),
  unitId: z.string().min(1, "Unit is required"),
  itemType: z.enum(["PRODUCT", "FUEL"]).optional(),
  quantity: z
    .number({ invalid_type_error: "Quantity must be a number" })
    .min(0, "Quantity must be 0 or greater"),
  sku: z.string().optional(),
  variantId: z.string().optional().nullable().or(z.literal("")),
  purchasePrice: z
    .number({ invalid_type_error: "Purchase price must be a number" })
    .min(0, "Purchase price must be 0 or greater"),
  salePrice: z
    .number({ invalid_type_error: "Sale price must be a number" })
    .min(0, "Sale price must be 0 or greater"),
})

export const updateStockSchema = z.object({
  unitId: z.string().min(1, "Unit is required").optional().or(z.literal("")),
  purchasePrice: z
    .number({ invalid_type_error: "Purchase price must be a number" })
    .min(0, "Purchase price must be 0 or greater")
    .optional(),
  salePrice: z
    .number({ invalid_type_error: "Sale price must be a number" })
    .min(0, "Sale price must be 0 or greater")
    .optional(),
})

export const adjustStockSchema = z.object({
  branchId: z.string().min(1, "Branch is required"),
  stockId: z.string().min(1, "Stock ID is required").optional().or(z.literal("")),
  productId: z.string().min(1, "Product is required"),
  variantId: z.string().optional().nullable().or(z.literal("")),
  unitId: z.string().min(1, "Unit is required").optional().or(z.literal("")),
  transactionType: z.enum(["IN", "OUT"]),
  quantity: z
    .number({ invalid_type_error: "Quantity must be a number" })
    .min(0, "Quantity must be 0 or greater"),
  reason: z.string().min(1).optional(),
})

export const updateAdjustmentSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
})

export type CreateStockInput = z.infer<typeof createStockSchema>
export type UpdateStockInput = z.infer<typeof updateStockSchema>
export type AdjustStockInput = z.infer<typeof adjustStockSchema>
export type UpdateAdjustmentInput = z.infer<typeof updateAdjustmentSchema>

