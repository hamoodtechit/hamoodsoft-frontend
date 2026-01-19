import { z } from "zod"

export const createUnitSchema = z.object({
  name: z
    .string()
    .min(1, "Unit name is required")
    .min(2, "Unit name must be at least 2 characters")
    .max(50, "Unit name must be less than 50 characters"),
  suffix: z
    .string()
    .min(1, "Unit suffix is required")
    .max(10, "Unit suffix must be less than 10 characters"),
})

export const updateUnitSchema = z.object({
  name: z
    .string()
    .min(2, "Unit name must be at least 2 characters")
    .max(50, "Unit name must be less than 50 characters")
    .optional(),
  suffix: z
    .string()
    .min(1, "Unit suffix is required")
    .max(10, "Unit suffix must be less than 10 characters")
    .optional(),
})

export type CreateUnitInput = z.infer<typeof createUnitSchema>
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>
