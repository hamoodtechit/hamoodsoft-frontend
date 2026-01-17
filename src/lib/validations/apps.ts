import { z } from "zod"

export const selectAppsSchema = z.object({
  apps: z
    .array(z.string())
    .min(1, "Please select at least one app"),
})

export type SelectAppsInput = z.infer<typeof selectAppsSchema>
