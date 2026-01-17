import { z } from "zod"
import { modules } from "@/constants/modules"

export const createBusinessSchema = z.object({
  name: z
    .string()
    .min(1, "Business name is required")
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be less than 100 characters"),
  modules: z
    .array(z.enum(modules as [string, ...string[]]))
    .optional()
    .default([]),
})

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>
