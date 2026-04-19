import { z } from "zod"

export const createStockSchema = z.object({
  branchId: z.string().uuid("Branch is required"),
  productId: z.string().uuid("Product is required"),
  unitId: z.string().uuid("Unit is required"),
  itemType: z.enum(["PRODUCT", "FUEL"]).optional(),
  quantity: z
    .number({ invalid_type_error: "Quantity must be a number" })
    .min(0, "Quantity must be 0 or greater"),
  sku: z.string().optional(),
  purchasePrice: z
    .number({ invalid_type_error: "Purchase price must be a number" })
    .min(0, "Purchase price must be 0 or greater"),
  salePrice: z
    .number({ invalid_type_error: "Sale price must be a number" })
    .min(0, "Sale price must be 0 or greater"),
})

export const updateStockSchema = z.object({
  unitId: z.string().uuid("Unit is required").optional(),
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
  branchId: z.string().uuid("Branch is required"),
  stockId: z.string().uuid("Stock ID is required").optional(),
  productId: z.string().uuid("Product is required"),
  unitId: z.string().uuid("Unit is required").optional(),
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

