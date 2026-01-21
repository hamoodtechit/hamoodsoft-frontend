"use client"

import { Button } from "@/components/ui/button"
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
import {
  createAttributeSchema,
  updateAttributeSchema,
  type CreateAttributeInput,
  type UpdateAttributeInput,
} from "@/lib/validations/attributes"
import { Attribute } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"

interface AttributeDialogProps {
  productId: string
  attribute: Attribute | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitCreate: (data: CreateAttributeInput) => void
  onSubmitUpdate: (id: string, data: UpdateAttributeInput) => void
  isLoading: boolean
}

export function AttributeDialog({
  productId,
  attribute,
  open,
  onOpenChange,
  onSubmitCreate,
  onSubmitUpdate,
  isLoading,
}: AttributeDialogProps) {
  const t = useTranslations("attributes")
  const tCommon = useTranslations("common")

  const isEdit = !!attribute
  const schema = isEdit ? updateAttributeSchema : createAttributeSchema

  const defaultValues = useMemo(() => {
    if (!attribute) {
      return { productId, name: "", values: [] as string[] }
    }
    return {
      productId: attribute.productId || productId,
      name: attribute.name || "",
      values: attribute.values || [],
    }
  }, [attribute, productId])

  const [valuesText, setValuesText] = useState<string>((defaultValues.values || []).join(", "))

  const form = useForm<CreateAttributeInput | UpdateAttributeInput>({
    resolver: zodResolver(schema as any),
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
    setValuesText((defaultValues.values || []).join(", "))
  }, [defaultValues, form])

  const parseValues = (text: string) =>
    text
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)

  const onSubmit = (data: CreateAttributeInput | UpdateAttributeInput) => {
    const values = parseValues(valuesText)
    data = { ...data, productId, values }

    if (isEdit && attribute) {
      onSubmitUpdate(attribute.id, data as UpdateAttributeInput)
      return
    }
    onSubmitCreate(data as CreateAttributeInput)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editAttribute") : t("createAttribute")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("editAttributeDescription") : t("createAttributeDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("namePlaceholder")} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="values"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("values")}</FormLabel>
                  <FormControl>
                    <Input
                      value={valuesText}
                      onChange={(e) => {
                        setValuesText(e.target.value)
                        const parsed = parseValues(e.target.value)
                        field.onChange(parsed)
                      }}
                      placeholder={t("valuesPlaceholder")}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">{t("valuesHelp")}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
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
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    {tCommon("loading")}
                  </span>
                ) : isEdit ? (
                  tCommon("save")
                ) : (
                  tCommon("submit")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

