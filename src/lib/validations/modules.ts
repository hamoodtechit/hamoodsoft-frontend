import { z } from "zod"
import { modules } from "@/constants/modules"

export const selectModulesSchema = z.object({
  modules: z
    .array(z.enum(modules as [string, ...string[]]))
    .optional()
    .default([]),
})

export type SelectModulesInput = z.infer<typeof selectModulesSchema>
