import { z } from "zod"

const baseContactSchema = z.object({
  type: z.enum(["CUSTOMER", "SUPPLIER"]),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  balance: z.number().min(0, "Balance must be greater than or equal to 0").default(0),
  creditLimit: z.number().min(0, "Credit limit must be greater than or equal to 0").default(0),
})

export const createContactSchema = baseContactSchema.extend({
  isIndividual: z.boolean(),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),
}).refine(
  (data) => {
    // If isIndividual is true, company fields are not required
    if (data.isIndividual) {
      return true
    }
    // If isIndividual is false, company fields are required
    return !!data.companyName && !!data.companyAddress
  },
  {
    message: "Company name and address are required when not an individual",
    path: ["companyName"],
  }
)

export const updateContactSchema = baseContactSchema
  .extend({
    isIndividual: z.boolean().optional(),
    companyName: z.string().optional(),
    companyAddress: z.string().optional(),
    companyPhone: z.string().optional(),
  })
  .partial()
  .refine(
    (data) => {
      // If isIndividual is explicitly false, company fields should be provided
      if (data.isIndividual === false) {
        return !!(data.companyName && data.companyAddress)
      }
      return true
    },
    {
      message: "Company name and address are required when not an individual",
      path: ["companyName"],
    }
  )

export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>
