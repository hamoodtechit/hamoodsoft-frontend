import { modules } from "@/constants/modules"
import { z } from "zod"

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

export const updateBusinessSchema = z.object({
  name: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be less than 100 characters")
    .optional(),
  modules: z
    .array(z.enum(modulesTuple))
    .optional(),
})

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>