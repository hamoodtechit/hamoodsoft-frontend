import { z } from "zod"

export const createIncomeTransactionSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  branchId: z.string().optional(),
  contactId: z.string().optional(),
  categoryId: z.string().optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  occurredAt: z.string().optional(),
  note: z.string().optional(),
})

export const createExpenseTransactionSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  branchId: z.string().optional(),
  contactId: z.string().optional(),
  categoryId: z.string().optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  paidAmount: z.number().min(0, "Paid amount must be greater than or equal to 0").optional(),
  occurredAt: z.string().optional(),
  note: z.string().optional(),
})

export type CreateIncomeTransactionInput = z.infer<typeof createIncomeTransactionSchema>
export type CreateExpenseTransactionInput = z.infer<typeof createExpenseTransactionSchema>
