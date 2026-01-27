import { z } from "zod"

export const uploadMediaSchema = z.object({
  file: z.instanceof(File),
  name: z.string().optional(),
})

export const updateMediaSchema = z.object({
  name: z.string().optional(),
  file: z.instanceof(File).optional(),
})

export type UploadMediaInput = z.infer<typeof uploadMediaSchema>
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>
