import { z } from "zod"

export const updateSettingSchema = z.object({
  name: z.string().min(1, "Setting name is required"),
  configs: z.record(z.any()), // configs can be any object structure
})

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>
