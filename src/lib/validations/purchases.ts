import { z } from "zod"

export const purchaseItemSchema = z.object({
  sku: z.string().optional().default(""),
  itemName: z.string().min(1, "Item name is required"),
  itemDescription: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  price: z.number().min(0, "Price must be greater than or equal to 0"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  discountType: z.enum(["NONE", "PERCENTAGE", "FIXED"]).optional().default("NONE"),
  discountAmount: z.number().min(0, "Discount amount must be greater than or equal to 0").optional().default(0),
  totalPrice: z.number().min(0, "Total price must be greater than or equal to 0"),
  productId: z.string().optional(),
  itemType: z.enum(["PRODUCT", "SERVICE", "FUEL"]).optional(),
  fuelTypeId: z.string().optional(),
  tankerId: z.string().optional(),
})

/** Schema for a single tanker allocation within a fuel purchase */
export const fuelTankerAllocationSchema = z.object({
  tankerId: z.string().min(1, "Tanker is required"),
  tankerName: z.string().optional(),
  quantity: z.number().min(0.01, "Quantity must be > 0"),
})

/** Schema for a fuel item (one fuel type → multiple tanker allocations) */
export const fuelItemSchema = z.object({
  fuelTypeId: z.string().min(1, "Fuel type is required"),
  fuelTypeName: z.string().optional(),
  costPrice: z.number().min(0, "Cost price must be >= 0"),
  unit: z.string().default("L"),
  tankerAllocations: z.array(fuelTankerAllocationSchema).default([]),
})

export const paymentSchema = z.object({
  type: z.enum(["SALE_PAYMENT", "PURCHASE_PAYMENT", "DEPOSIT"]).default("PURCHASE_PAYMENT"),
  accountId: z.string().min(1, "Account is required"),
  amount: z.number().min(0, "Amount must be greater than or equal to 0"),
  saleId: z.string().optional(),
  purchaseId: z.string().optional(),
  contactId: z.string().optional(),
  branchId: z.string().optional(),
  occurredAt: z.string().optional(),
  note: z.string().optional(),
})

export const createPurchaseSchema = z.object({
  purchaseType: z.enum(["PRODUCT", "FUEL"]).default("PRODUCT"),
  branchId: z.string().min(1, "Branch is required"),
  contactId: z.string().min(1, "Contact is required"),
  items: z.array(purchaseItemSchema).optional().default([]),
  fuelItems: z.array(fuelItemSchema).optional().default([]),
  payments: z.array(paymentSchema).optional(),
  status: z.enum(["ORDERED", "PENDING", "RETURNED", "COMPLETED"]).optional().default("ORDERED"),
  paymentStatus: z.enum(["PAID", "DUE", "PARTIAL"]).optional().default("DUE"),
  paidAmount: z.number().min(0, "Paid amount must be greater than or equal to 0").optional().default(0),
  totalPrice: z.number().min(0, "Total price must be greater than or equal to 0"),
  discountType: z.enum(["NONE", "PERCENTAGE", "FIXED"]).optional().default("NONE"),
  discountAmount: z.number().min(0, "Discount amount must be greater than or equal to 0").optional().default(0),
  taxType: z.enum(["NONE", "PERCENTAGE", "FIXED"]).optional().default("NONE"),
  taxRate: z.number().min(0, "Tax rate must be greater than or equal to 0").optional().default(0),
  taxAmount: z.number().min(0, "Tax amount must be greater than or equal to 0").optional().default(0),
})

export const updatePurchaseSchema = z.object({
  branchId: z.string().min(1, "Branch is required").optional(),
  contactId: z.string().min(1, "Contact is required").optional(),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).optional(),
})

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>
export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>
export type FuelItemInput = z.infer<typeof fuelItemSchema>
export type FuelTankerAllocation = z.infer<typeof fuelTankerAllocationSchema>
