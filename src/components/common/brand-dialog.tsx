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
import { useCreateBrand, useUpdateBrand } from "@/lib/hooks/use-brands"
import {
  createBrandSchema,
  updateBrandSchema,
  type CreateBrandInput,
  type UpdateBrandInput,
} from "@/lib/validations/brands"
import { Brand } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"

interface BrandDialogProps {
  brand: Brand | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitCreate: (data: CreateBrandInput) => void
  onSubmitUpdate: (id: string, data: UpdateBrandInput) => void
  isLoading: boolean
}

export function BrandDialog({
  brand,
  open,
  onOpenChange,
  onSubmitCreate,
  onSubmitUpdate,
  isLoading: externalIsLoading,
}: BrandDialogProps) {
  const t = useTranslations("brands")
  const tCommon = useTranslations("common")
  const createMutation = useCreateBrand()
  const updateMutation = useUpdateBrand()

  const isEdit = !!brand
  const isLoading = externalIsLoading || createMutation.isPending || updateMutation.isPending
  const schema = isEdit ? updateBrandSchema : createBrandSchema

  const defaultValues = useMemo(() => {
    if (!brand) {
      return {
        name: "",
        description: "",
      }
    }
    return {
      name: brand.name || "",
      description: brand.description || "",
    }
  }, [brand])

  const form = useForm<CreateBrandInput | UpdateBrandInput>({
    resolver: zodResolver(schema as any),
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const onSubmit = (data: CreateBrandInput | UpdateBrandInput) => {
    if (isEdit && brand) {
      updateMutation.mutate(
        { id: brand.id, data: data as UpdateBrandInput },
        {
          onSuccess: () => {
            onSubmitUpdate(brand.id, data as UpdateBrandInput)
            onOpenChange(false)
          },
        }
      )
    } else {
      createMutation.mutate(data as CreateBrandInput, {
        onSuccess: () => {
          onSubmitCreate(data as CreateBrandInput)
          onOpenChange(false)
          form.reset()
        },
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{isEdit ? t("editBrand") : t("createBrand")}</DialogTitle>
              <DialogDescription>
                {isEdit ? t("editBrandDescription") : t("createBrandDescription")}
              </DialogDescription>
            </div>
          </div>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("descriptionPlaceholder")} disabled={isLoading} />
                  </FormControl>
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
