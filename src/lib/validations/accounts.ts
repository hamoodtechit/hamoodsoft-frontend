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

export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
