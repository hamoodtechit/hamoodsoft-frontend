import { z } from "zod"

export const purchaseItemSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  itemDescription: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  price: z.number().min(0, "Price must be greater than or equal to 0"),
  quantity: z.number().min(1, "Quantity must be greater than 0"),
})

export const createPurchaseSchema = z.object({
  branchId: z.string().min(1, "Branch is required"),
  contactId: z.string().min(1, "Contact is required"),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
})

export const updatePurchaseSchema = z.object({
  branchId: z.string().min(1, "Branch is required").optional(),
  contactId: z.string().min(1, "Contact is required").optional(),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).optional(),
  paidAmount: z.number().min(0, "Paid amount must be greater than or equal to 0").optional(),
  dueAmount: z.number().min(0, "Due amount must be greater than or equal to 0").optional(),
})

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>
export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>
