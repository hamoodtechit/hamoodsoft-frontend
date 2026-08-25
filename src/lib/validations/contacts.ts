import { z } from "zod"

const baseContactSchema = z.object({
  type: z.enum(["CUSTOMER", "SUPPLIER"]),
  name: z.string().optional(),
  email: z.string().email("Invalid email address").or(z.literal("")).optional(),
  isIndividual: z.boolean().default(true),
  phone: z.string().optional(),
  address: z.string().optional(),
  binNumber: z.string().optional(),
  contactPersons: z.array(z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(1, "Phone number is required"),
    designation: z.string().optional()
  })).optional(),
  balance: z.coerce.number().default(0),
  creditLimit: z.number().min(0, "Credit limit must be greater than or equal to 0").default(0),
  vehicles: z.array(z.object({
    id: z.string().optional(),
    vehicleNo: z.string().min(1, "Vehicle number is required"),
    vehicleType: z.string().optional(),
    driverName: z.string().optional()
  })).optional(),
})

export const createContactSchema = baseContactSchema.extend({
  isIndividual: z.boolean(),
}).refine(data => data.name && data.name.trim().length > 0, {
  message: "Name is required",
  path: ["name"]
})

export const updateContactSchema = baseContactSchema
  .extend({
    isIndividual: z.boolean().optional(),
  })
  .partial()

export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>
