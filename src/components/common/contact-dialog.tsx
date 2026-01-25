"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateContact, useUpdateContact } from "@/lib/hooks/use-contacts"
import {
  createContactSchema,
  updateContactSchema,
  type CreateContactInput,
  type UpdateContactInput,
} from "@/lib/validations/contacts"
import { Contact } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { User } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"

interface ContactDialogProps {
  contact: Contact | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContactDialog({ contact, open, onOpenChange }: ContactDialogProps) {
  const t = useTranslations("contacts")
  const tCommon = useTranslations("common")
  const createMutation = useCreateContact()
  const updateMutation = useUpdateContact()

  const isEdit = !!contact
  const isLoading = createMutation.isPending || updateMutation.isPending

  const schema = isEdit ? updateContactSchema : createContactSchema

  const defaultValues = useMemo(() => {
    if (!contact) {
      return {
        type: "CUSTOMER" as const,
        name: "",
        email: "",
        phone: "",
        address: "",
        isIndividual: true,
        companyName: "",
        companyAddress: "",
        companyPhone: "",
        balance: 0,
        creditLimit: 0,
      }
    }
    return {
      type: contact.type || ("CUSTOMER" as const),
      name: contact.name || "",
      email: contact.email || "",
      phone: contact.phone || "",
      address: contact.address || "",
      isIndividual: contact.isIndividual ?? true,
      companyName: contact.companyName || "",
      companyAddress: contact.companyAddress || "",
      companyPhone: contact.companyPhone || "",
      balance: contact.balance || 0,
      creditLimit: contact.creditLimit || 0,
    }
  }, [contact])

  const form = useForm<CreateContactInput | UpdateContactInput>({
    resolver: zodResolver(schema as any),
    defaultValues,
  })

  // Watch isIndividual to conditionally show/hide company fields
  const isIndividual = useWatch({
    control: form.control,
    name: "isIndividual" as any,
    defaultValue: defaultValues.isIndividual,
  })

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
    }
  }, [open, defaultValues, form])

  // Clear company fields when isIndividual is true
  useEffect(() => {
    if (isIndividual) {
      form.setValue("companyName" as any, "")
      form.setValue("companyAddress" as any, "")
      form.setValue("companyPhone" as any, "")
    }
  }, [isIndividual, form])

  const onSubmit = (data: CreateContactInput | UpdateContactInput) => {
    if (isEdit && contact) {
      updateMutation.mutate(
        { id: contact.id, data: data as UpdateContactInput },
        {
          onSuccess: () => {
            onOpenChange(false)
          },
        }
      )
      return
    }

    createMutation.mutate(data as CreateContactInput, {
      onSuccess: () => {
        onOpenChange(false)
        form.reset(defaultValues)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isEdit ? t("editContact") : t("createContact")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <ScrollArea className="h-[calc(90vh-220px)]">
              <div className="px-6 pb-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("type")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CUSTOMER">{t("typeCustomer")}</SelectItem>
                            <SelectItem value="SUPPLIER">{t("typeSupplier")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("name")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("namePlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("email")}</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder={t("emailPlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("phone")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("phonePlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("address")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("addressPlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isEdit && (
                  <FormField
                    control={form.control}
                    name="isIndividual"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>{t("isIndividual")}</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            {t("isIndividualDescription")}
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                {!isIndividual && (
                  <>
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-4">{t("companyInformation")}</h4>
                    </div>

                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("companyName")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("companyNamePlaceholder")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("companyAddress")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("companyAddressPlaceholder")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("companyPhone")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("companyPhonePlaceholder")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="balance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("balance")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="creditLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("creditLimit")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    {tCommon("loading")}
                  </>
                ) : (
                  tCommon("save")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
