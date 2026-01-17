import { z } from "zod"

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .optional(),
  currentBusinessId: z.string().nullable().optional(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>
