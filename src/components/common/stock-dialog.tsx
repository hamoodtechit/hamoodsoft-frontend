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
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBranches } from "@/lib/hooks/use-branches"
import { useProducts } from "@/lib/hooks/use-products"
import { useCreateStock, useStocks } from "@/lib/hooks/use-stocks"
import { useUnits } from "@/lib/hooks/use-units"
import { createStockSchema, type CreateStockInput } from "@/lib/validations/stocks"
import { zodResolver } from "@hookform/resolvers/zod"
import { Package } from "lucide-react"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"

interface StockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultBranchId?: string
  defaultProductId?: string
}

/**
 * Generates the next available unique SKU by examining existing stock SKUs.
 * Given a base SKU like "PROD-001", it finds all stocks matching the pattern
 * "PROD-001", "PROD-001-001", "PROD-001-002", etc. and returns the next suffix.
 */
function generateNextSku(baseSku: string, existingSkus: string[]): string {
  if (!baseSku) return ""

  // Check if the base SKU itself is already taken
  const isBaseTaken = existingSkus.some(s => s === baseSku)
  if (!isBaseTaken) return baseSku

  // Find all existing suffixed variants matching the pattern: baseSku-NNN
  const suffixPattern = new RegExp(`^${baseSku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d{3})$`)
  let maxSuffix = 0

  existingSkus.forEach(sku => {
    const match = sku.match(suffixPattern)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > maxSuffix) maxSuffix = num
    }
  })

  const nextSuffix = (maxSuffix + 1).toString().padStart(3, '0')
  return `${baseSku}-${nextSuffix}`
}

export function StockDialog({ open, onOpenChange, defaultBranchId, defaultProductId }: StockDialogProps) {
  const t = useTranslations("stocks")
  const tCommon = useTranslations("common")
  const { data: branches = [] } = useBranches()
  const { data: productsData } = useProducts()
  const products = useMemo(() => productsData?.items || [], [productsData])
  const { data: units = [] } = useUnits()
  const createMutation = useCreateStock()

  const isLoading = createMutation.isPending

  const defaultValues = useMemo(() => {
    return {
      branchId: defaultBranchId || "",
      productId: defaultProductId || "",
      variantId: "",
      unitId: "",
      sku: "",
      quantity: 0,
      purchasePrice: 0,
      salePrice: 0,
    }
  }, [defaultBranchId, defaultProductId])

  const form = useForm<CreateStockInput>({
    resolver: zodResolver(createStockSchema),
    defaultValues,
  })

  // Watch productId and variantId to auto-fill prices
  const watchedFields = useWatch({
    control: form.control,
    name: ["productId", "variantId"],
  })
  const productId = watchedFields[0]
  const variantId = watchedFields[1]

  // Fetch existing stocks for the selected product (business-wide) to determine unique SKU suffix
  const { data: existingStocksData } = useStocks({
    productId: productId || undefined,
    limit: 200,
  })

  // Collect all existing stock SKUs for the current product
  const existingStockSkus = useMemo(() => {
    const skus: string[] = []
    if (existingStocksData?.items) {
      existingStocksData.items.forEach(stock => {
        if (stock.sku) skus.push(stock.sku)
      })
    }
    return skus
  }, [existingStocksData])

  const getUniqueSku = useCallback((baseSku: string) => {
    return generateNextSku(baseSku, existingStockSkus)
  }, [existingStockSkus])

  // Auto-fill price and unit when product/variant is selected
  useEffect(() => {
    if (productId) {
      const selectedProduct = products.find((p) => p.id === productId)
      
      // If product changed, reset variantId if it doesn't belong to new product
      if (variantId && selectedProduct && !selectedProduct.variants?.some(v => v.id === variantId)) {
        form.setValue("variantId", "")
      }

      if (selectedProduct) {
        // If variant is selected, use variant price, otherwise use product price
        const selectedVariant = selectedProduct.variants?.find(v => v.id === variantId)
        const price = selectedVariant?.price ?? selectedProduct.price
        const baseSku = selectedVariant?.sku ?? selectedProduct.sku ?? ""
        const unitId = selectedVariant?.unitId ?? selectedProduct.unitId

        if (price !== undefined) {
          form.setValue("salePrice", price, { shouldValidate: false })
        }
        if (unitId) {
          form.setValue("unitId", unitId, { shouldValidate: false })
        }
        if (baseSku) {
          // Generate a unique SKU by appending a suffix if the base SKU is already taken
          const uniqueSku = getUniqueSku(baseSku)
          form.setValue("sku", uniqueSku, { shouldValidate: false })
        }
      }
    } else {
      form.setValue("salePrice", 0, { shouldValidate: false })
      form.setValue("unitId", "", { shouldValidate: false })
      form.setValue("sku", "", { shouldValidate: false })
      form.setValue("variantId", "")
    }
  }, [productId, variantId, products, form, getUniqueSku])

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
    }
  }, [open, defaultValues, form])

  const onSubmit = (data: CreateStockInput) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        onOpenChange(false)
        form.reset(defaultValues)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t("createStock")}
          </DialogTitle>
          <DialogDescription>{t("createDescription")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <ScrollArea className="h-[calc(90vh-220px)]">
              <div className="px-6 pb-6 space-y-4">
                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("branch")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectBranch")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("product")}</FormLabel>
                      <Select 
                        onValueChange={(val) => {
                          field.onChange(val)
                          form.setValue("variantId", "") // Reset variant when product changes
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectProduct")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {productId && products.find(p => p.id === productId)?.isVariable && (
                  <FormField
                    control={form.control}
                    name="variantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("variant") || "Variant"}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("selectVariant") || "Select a variant"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.find(p => p.id === productId)?.variants?.map((variant) => (
                              <SelectItem key={variant.id || ""} value={variant.id || ""}>
                                {variant.variantName} {variant.sku ? `(${variant.sku})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="unitId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("unit")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectUnit")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.name} ({unit.suffix})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("sku")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("skuPlaceholder") || "Enter SKU (leave blank to auto-generate)"}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("quantity")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={t("quantityPlaceholder")}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("purchasePrice")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={t("purchasePricePlaceholder")}
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("salePrice")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={t("salePricePlaceholder")}
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <DialogFooter className="px-6 pb-6 pt-4 border-t flex-shrink-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    {tCommon("loading")}
                  </span>
                ) : (
                  tCommon("create")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
