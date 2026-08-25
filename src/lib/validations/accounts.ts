import { z } from "zod"

export const createAccountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  type: z.enum(["CASH", "BANK", "WALLET", "ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"]),
  description: z.string().optional(),
  openingBalance: z.number().default(0),
})

export const updateAccountSchema = z.object({
  name: z.string().min(1, "Account name is required").optional(),
  type: z.enum(["CASH", "BANK", "WALLET", "ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"]).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const transferAccountSchema = z
  .object({
    fromAccountId: z.string().min(1, "Source account is required"),
    toAccountId: z.string().min(1, "Destination account is required"),
    amount: z.number().min(0.01, "Amount must be greater than 0"),
    branchId: z.string().optional(),
    occurredAt: z.string().optional(),
    note: z.string().optional(),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: "Source and destination accounts must be different",
    path: ["toAccountId"],
  })

export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
export type TransferAccountInput = z.infer<typeof transferAccountSchema>
