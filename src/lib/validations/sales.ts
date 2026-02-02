import { z } from "zod"

export const saleItemSchema = z.object({
  sku: z.string().min(1, "SKU is required"), // Required as per DTO
  itemName: z.string().min(1, "Item name is required"),
  itemDescription: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  price: z.number().min(0, "Price must be greater than or equal to 0"),
  quantity: z.number().min(1, "Quantity must be greater than 0"),
  discountType: z.enum(["NONE", "PERCENTAGE", "FIXED"]).optional().default("NONE"),
  discountAmount: z.number().min(0, "Discount amount must be greater than or equal to 0").optional().default(0),
  totalPrice: z.number().min(0, "Total price must be greater than or equal to 0"),
})

export const paymentSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  amount: z.number().min(0, "Amount must be greater than or equal to 0"),
  branchId: z.string().optional(),
  contactId: z.string().optional(),
  notes: z.string().optional(),
  occurredAt: z.string().optional(),
  type: z.enum(["SALE_PAYMENT", "PURCHASE_PAYMENT"]).default("SALE_PAYMENT"),
})

export const createSaleSchema = z.object({
  branchId: z.string().min(1, "Branch is required"),
  contactId: z.string().min(1, "Contact is required"),
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
  status: z.enum(["DRAFT", "SOLD", "PENDING"]).optional().default("SOLD"),
  paymentStatus: z.enum(["PAID", "DUE", "PARTIAL"]).optional().default("DUE"),
  paidAmount: z.number().min(0, "Paid amount must be greater than or equal to 0").optional().default(0),
  totalPrice: z.number().min(0, "Total price must be greater than or equal to 0"),
  discountType: z.enum(["NONE", "PERCENTAGE", "FIXED"]).optional().default("NONE"),
  discountAmount: z.number().min(0, "Discount amount must be greater than or equal to 0").optional().default(0),
  payments: z.array(paymentSchema).optional(),
})

export const updateSaleSchema = z.object({
  branchId: z.string().min(1, "Branch is required").optional(),
  contactId: z.string().min(1, "Contact is required").optional(),
  status: z.enum(["DRAFT", "SOLD", "PENDING"]).optional(),
  paymentStatus: z.enum(["PAID", "DUE", "PARTIAL"]).optional(),
  paidAmount: z.number().min(0, "Paid amount must be greater than or equal to 0").optional(),
})

export type CreateSaleInput = z.infer<typeof createSaleSchema>
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>
export type SaleItemInput = z.infer<typeof saleItemSchema>
