import { z } from "zod"

export const createIncomeExpenseCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["INCOME", "EXPENSE"]),
  isActive: z.boolean().default(true),
})

export const updateIncomeExpenseCategorySchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  isActive: z.boolean().optional(),
})

export type CreateIncomeExpenseCategoryInput = z.infer<typeof createIncomeExpenseCategorySchema>
export type UpdateIncomeExpenseCategoryInput = z.infer<typeof updateIncomeExpenseCategorySchema>
