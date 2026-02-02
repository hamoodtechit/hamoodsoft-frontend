import { z } from "zod"

export const createPaymentSchema = z.object({
  type: z.enum(["SALE_PAYMENT", "PURCHASE_PAYMENT", "DEPOSIT"]),
  accountId: z.string().min(1, "Account is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  saleId: z.string().optional(),
  purchaseId: z.string().optional(),
  contactId: z.string().optional(),
  branchId: z.string().optional(),
  occurredAt: z.string().optional(),
  notes: z.string().optional(),
})

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
