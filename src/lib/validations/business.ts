import { z } from "zod"
import { modules } from "@/constants/modules"

// Convert readonly array to mutable tuple for z.enum
// modules has at least one element, so this is safe
const modulesTuple = modules as unknown as [string, ...string[]]

export const createBusinessSchema = z.object({
  name: z
    .string()
    .min(1, "Business name is required")
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be less than 100 characters"),
  modules: z
    .array(z.enum(modulesTuple))
    .optional()
    .default([]),
})

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>
