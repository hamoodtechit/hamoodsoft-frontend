import { z } from "zod"
import { modules } from "@/constants/modules"

// Convert readonly array to mutable tuple for z.enum
// modules has at least one element, so this is safe
const modulesTuple = modules as unknown as [string, ...string[]]

export const selectModulesSchema = z.object({
  modules: z
    .array(z.enum(modulesTuple))
    .optional()
    .default([]),
})

export type SelectModulesInput = z.infer<typeof selectModulesSchema>
