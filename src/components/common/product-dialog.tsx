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
import { useBranches } from "@/lib/hooks/use-branches"
import { useCategories } from "@/lib/hooks/use-categories"
import { useCreateProduct, useUpdateProduct } from "@/lib/hooks/use-products"
import { useUnits } from "@/lib/hooks/use-units"
import { cn } from "@/lib/utils"
import {
    createProductSchema,
    updateProductSchema,
    type CreateProductInput,
    type UpdateProductInput,
} from "@/lib/validations/products"
import { Branch, Category, Product, Unit } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { Package } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"

interface ProductDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductDialog({ product, open, onOpenChange }: ProductDialogProps) {
  const t = useTranslations("products")
  const tCommon = useTranslations("common")
  const { data: units = [] } = useUnits()
  const { data: categories = [] } = useCategories()
  const { data: branches = [] } = useBranches()
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()

  const isEdit = !!product
  const isLoading = createMutation.isPending || updateMutation.isPending

  const schema = isEdit ? updateProductSchema : createProductSchema

  const defaultValues = useMemo(() => {
    if (!product) {
      return {
        name: "",
        description: "",
        price: 0,
        unitId: "",
        categoryIds: [] as string[],
        branchIds: [] as string[],
      }
    }
    return {
      name: product.name || "",
      description: product.description || "",
      price: typeof product.price === "number" ? product.price : 0,
      unitId: product.unitId || "",
      categoryIds: product.categoryIds || product.categories?.map((c) => c.id) || [],
      branchIds: product.branchIds || [],
    }
  }, [product])

  const form = useForm<CreateProductInput | UpdateProductInput>({
    resolver: zodResolver(schema as any),
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const onSubmit = (data: CreateProductInput | UpdateProductInput) => {
    if (isEdit && product) {
      updateMutation.mutate(
        { id: product.id, data: data as UpdateProductInput },
        {
          onSuccess: () => {
            onOpenChange(false)
          },
        }
      )
      return
    }

    createMutation.mutate(data as CreateProductInput, {
      onSuccess: () => {
        onOpenChange(false)
        form.reset()
      },
    })
  }

  const unitOptions = units as Unit[]
  const categoryOptions = categories as Category[]
  const branchOptions = branches as Branch[]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{isEdit ? t("editProduct") : t("createProduct")}</DialogTitle>
              <DialogDescription>
                {isEdit ? t("editProductDescription") : t("createProductDescription")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("namePlaceholder")}
                      disabled={isLoading}
                    />
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
                  <FormLabel>{t("descriptionLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("descriptionPlaceholder")}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("price")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={typeof field.value === "number" ? field.value : 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        placeholder={t("pricePlaceholder")}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("unit")}</FormLabel>
                    <FormControl>
                      <select
                        className={cn(
                          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          "disabled:cursor-not-allowed disabled:opacity-50"
                        )}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        disabled={isLoading}
                      >
                        <option value="" disabled>
                          {t("selectUnit")}
                        </option>
                        {unitOptions.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.suffix})
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="categoryIds"
              render={({ field }) => {
                const selected = Array.isArray(field.value) ? field.value : []
                return (
                  <FormItem>
                    <FormLabel>{t("categories")}</FormLabel>
                    <FormControl>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {categoryOptions.length === 0 ? (
                          <p className="text-sm text-muted-foreground">{t("noCategoriesHint")}</p>
                        ) : (
                          categoryOptions.map((cat) => {
                            const checked = selected.includes(cat.id)
                            return (
                              <label
                                key={cat.id}
                                className={cn(
                                  "flex items-center gap-2 rounded-md border p-2",
                                  checked ? "border-primary bg-primary/5" : "border-border"
                                )}
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(val) => {
                                    const next = val
                                      ? [...selected, cat.id]
                                      : selected.filter((id) => id !== cat.id)
                                    field.onChange(next)
                                  }}
                                  disabled={isLoading}
                                />
                                <span className="text-sm">{cat.name}</span>
                              </label>
                            )
                          })
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            <FormField
              control={form.control}
              name="branchIds"
              render={({ field }) => {
                const selected = Array.isArray(field.value) ? field.value : []
                return (
                  <FormItem>
                    <FormLabel>{t("branchesOptional")}</FormLabel>
                    <FormControl>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {branchOptions.length === 0 ? (
                          <p className="text-sm text-muted-foreground">{t("noBranchesHint")}</p>
                        ) : (
                          branchOptions.map((b) => {
                            const checked = selected.includes(b.id)
                            return (
                              <label
                                key={b.id}
                                className={cn(
                                  "flex items-center gap-2 rounded-md border p-2",
                                  checked ? "border-primary bg-primary/5" : "border-border"
                                )}
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(val) => {
                                    const next = val
                                      ? [...selected, b.id]
                                      : selected.filter((id) => id !== b.id)
                                    field.onChange(next)
                                  }}
                                  disabled={isLoading}
                                />
                                <span className="text-sm">{b.name}</span>
                              </label>
                            )
                          })
                        )}
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">{t("branchesHint")}</p>
                    <FormMessage />
                  </FormItem>
                )
              }}
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

