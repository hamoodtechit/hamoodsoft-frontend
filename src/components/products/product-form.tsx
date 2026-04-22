"use client"

import { ProductBasicInfoSection } from "@/components/products/product-basic-info-section"
import { ProductCategoriesSection } from "@/components/products/product-categories-section"
import { ProductImagesSection } from "@/components/products/product-images-section"
import { ProductInventorySection } from "@/components/products/product-inventory-section"
import { ProductAttributesSection, useAvailableAttributes } from "@/components/products/product-attributes-section"
import { ProductVariantsSection } from "@/components/products/product-variants-section"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { useCreateProduct, useUpdateProduct } from "@/lib/hooks/use-products"
import { useQueryClient } from "@tanstack/react-query"
import {
  createProductSchema,
  updateProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from "@/lib/validations/products"
import { Product, ProductVariant, ProductVariantInput } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { Package } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"

// Helper function to generate cartesian product
function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]]
  if (arrays.length === 1) return arrays[0].map((item) => [item])
  
  const [first, ...rest] = arrays
  const restProduct = cartesianProduct(rest)
  
  const result: T[][] = []
  for (const item of first) {
    for (const combination of restProduct) {
      result.push([item, ...combination])
    }
  }
  return result
}

type PRODUCT_VARIANT_FIELDS = {
  id?: string
  variantName: string
  sku: string
  price: number
  costPrice?: number
  quantity?: number
  branchId?: string
  unitId?: string
  options: Record<string, string>
  thumbnailUrl?: string | null
  images?: string[]
}

interface ProductFormProps {
  product?: Product | null
}

export function ProductForm({ product }: ProductFormProps) {
  const t = useTranslations("products")
  const tCommon = useTranslations("common")
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = params.locale as string

  // Determine where to redirect after save/cancel based on returnTo query param
  const returnTo = searchParams.get("returnTo")
  const redirectUrl = returnTo === "pos"
    ? `/${locale}/dashboard/point-of-sale`
    : `/${locale}/dashboard/products`

  const queryClient = useQueryClient()
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()

  const isEdit = !!product
  const isLoading = createMutation.isPending || updateMutation.isPending

  // Get the currently selected branch from the topbar to use as default for variants
  const { selectedBranchId: defaultBranchId } = useBranchSelection()

  const schema = isEdit ? updateProductSchema : createProductSchema

  const defaultValues = useMemo(() => {
    if (!product) {
      return {
        name: "",
        description: "",
        price: 0,
        purchasePrice: undefined,
        unitId: "",
        categoryIds: [] as string[],
        branchIds: [] as string[],
        brandId: "",
        variants: [] as Array<{ 
          variantName: string
          options: Record<string, string>
          thumbnailUrl?: string
          images?: string[]
        }>,
        barcodeType: "EAN_13",
      }
    }
    // Handle both variants and productVariants from API
    const variantsRaw = product.productVariants || product.variants || []

    // Normalize variants to ensure they have the correct structure for the form
    const variants = (variantsRaw as (ProductVariant | ProductVariantInput)[]).map((v) => ({
      id: v.id,
      variantName: v.variantName || "",
      sku: v.sku || "",
      price: v.price ?? 0,
      costPrice: (v as PRODUCT_VARIANT_FIELDS).costPrice ?? undefined,
      quantity: (v as PRODUCT_VARIANT_FIELDS).quantity ?? undefined,
      branchId: (v as PRODUCT_VARIANT_FIELDS).branchId || undefined,
      unitId: v.unitId || "",
      options: v.options || {},
      thumbnailUrl: v.thumbnailUrl || undefined,
      images: v.images && Array.isArray(v.images) && v.images.length > 0 ? v.images : undefined,
    }))
    return {
      name: product.name || "",
      description: product.description || "",
      price: typeof product.price === "number" ? product.price : 0,
      purchasePrice: (product as unknown as { purchasePrice?: number }).purchasePrice ?? undefined,
      unitId: product.unitId || "",
      categoryIds: product.categoryIds || product.categories?.map((c) => c.id) || [],
      branchIds: product.branchIds || [],
      brandId: product.brandId || "",
      variants: variants,
      alertQuantity: product.alertQuantity ?? null,
      barcode: product.barcode ?? null,
      barcodeType: "EAN_13",
      weight: product.weight ?? null,
      thumbnailUrl: product.thumbnailUrl ?? null,
      images: product.images && Array.isArray(product.images) && product.images.length > 0 ? product.images : undefined,
    }
  }, [product])

  const form = useForm<CreateProductInput | UpdateProductInput>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onChange",
  })

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "variants",
  })

  const selectedBrandId = useWatch({ control: form.control, name: "brandId" })
  // Fetch attributes filtered by brand (if brand is selected)
  const brandIdForAttributes = product?.brandId || selectedBrandId
  const availableAttributes = useAvailableAttributes(brandIdForAttributes)

  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([])
  const [selectedAttributeValues, setSelectedAttributeValues] = useState<Record<string, string[]>>({})

  const lastProcessedAttributesRef = useRef<string>("")
  const hasInitializedFromProduct = useRef(false)
  const userHasModifiedSelections = useRef(false)
  const previousProductIdRef = useRef<string | null>(null)

  // Effect 1: Initialize form and attribute selections when editing
  useEffect(() => {
    // Check if product actually changed
    const currentProductId = product?.id || null
    const productChanged = previousProductIdRef.current !== currentProductId
    
    // Only reset form if product actually changed
    if (productChanged) {
      form.reset(defaultValues)
      previousProductIdRef.current = currentProductId
      hasInitializedFromProduct.current = false
      userHasModifiedSelections.current = false
    }
    
    // Handle both variants and productVariants from API
    const existingVariants = product?.productVariants || product?.variants || []

    // Only initialize if we have variants, attributes are loaded, and haven't initialized yet
    if (
      product &&
      existingVariants.length > 0 &&
      availableAttributes.length > 0 &&
      !hasInitializedFromProduct.current
    ) {
      // Extract selected attributes and values from existing variants
      const attrIds = new Set<string>()
      const attrValuesMap: Record<string, Set<string>> = {}

      ;(existingVariants as (ProductVariant | ProductVariantInput)[]).forEach((v) => {
        Object.entries(v.options || {}).forEach(([key, value]) => {
          let attr: { id: string; name: string } | undefined
          
          // Handle "attr-{name}" format
          if (key.startsWith("attr-")) {
            const attrName = key.replace(/^attr-/, "").replace(/-/g, " ")
            const normalizedName = attrName
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(" ")
            attr = availableAttributes.find(
              (a) => a.name.toLowerCase() === normalizedName.toLowerCase()
            )
          } else {
            attr = availableAttributes.find((a) => a.name === key)
            if (!attr) {
              attr = availableAttributes.find((a) => a.id === key)
            }
          }
          
          if (attr) {
            attrIds.add(attr.id)
            if (!attrValuesMap[attr.id]) {
              attrValuesMap[attr.id] = new Set<string>()
            }
            attrValuesMap[attr.id].add(value as string)
          }
        })
      })
      
      // Mark as initialized BEFORE setting state to prevent re-entry
      hasInitializedFromProduct.current = true

      if (attrIds.size > 0) {
        setSelectedAttributeIds(Array.from(attrIds))
        const selectedValues: Record<string, string[]> = {}
        Object.entries(attrValuesMap).forEach(([attrId, values]) => {
          selectedValues[attrId] = Array.from(values)
        })
        setSelectedAttributeValues(selectedValues)
        
        // Set the processed attributes ref to prevent immediate regeneration
        const initAttributesKey = JSON.stringify({
          ids: Array.from(attrIds).sort(),
          values: Object.entries(attrValuesMap).map(([attrId, values]) => ({
            id: attrId,
            values: Array.from(values).sort(),
          })),
        })
        lastProcessedAttributesRef.current = initAttributesKey

        // Load existing variants into the form
        replace(
          (existingVariants as (ProductVariant & PRODUCT_VARIANT_FIELDS)[]).map((v) => ({
            id: v.id,
            variantName: v.variantName || "",
            sku: v.sku || "",
            price: v.price ?? 0,
            unitId: v.unitId || undefined,
            options: v.options || {},
            thumbnailUrl: v.thumbnailUrl || undefined,
            images: v.images && Array.isArray(v.images) && v.images.length > 0 ? v.images : undefined,
          }))
        )
      } else {
        // No matching attributes found, but still load variants
        replace(existingVariants.map((v) => ({
          id: v.id,
          variantName: v.variantName || "",
          sku: v.sku || "",
          price: v.price ?? 0,
          unitId: v.unitId || undefined,
          options: v.options || {},
          thumbnailUrl: v.thumbnailUrl || undefined,
          images: v.images && Array.isArray(v.images) && v.images.length > 0 ? v.images : undefined,
        })))
      }
    } else if (!product && !hasInitializedFromProduct.current) {
      // For new products, clear on initial render
      setSelectedAttributeIds([])
      setSelectedAttributeValues({})
      replace([])
      hasInitializedFromProduct.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, availableAttributes])

  // Effect 2: Auto-generate variants when user manually changes attribute selections
  useEffect(() => {
    // Skip during initial load
    if (!userHasModifiedSelections.current) {
      return
    }

    // Create a key from selected attribute IDs and their values
    const selectedAttributes = availableAttributes.filter((attr) =>
      selectedAttributeIds.includes(attr.id)
    )
    const attributesKey = JSON.stringify({
      ids: selectedAttributeIds.sort(),
      values: selectedAttributes.map((attr) => ({
        id: attr.id,
        values: (selectedAttributeValues[attr.id] || []).sort(),
      })),
    })

    // Skip if we've already processed this combination
    if (lastProcessedAttributesRef.current === attributesKey) {
      return
    }

    lastProcessedAttributesRef.current = attributesKey

    // Check if any attributes have selected values
    const hasSelectedValues = Object.values(selectedAttributeValues).some((values) => values.length > 0)
    
    // Clear variants if no attributes or values are selected
    if (!hasSelectedValues || selectedAttributeIds.length === 0 || selectedAttributes.length === 0) {
      const currentVariants = form.getValues("variants") || []
      if (currentVariants.length > 0) {
        replace([])
        lastProcessedAttributesRef.current = ""
      }
      return
    }

    // Generate all combinations from selected values only
    const valueArrays = selectedAttributes
      .filter((attr) => {
        const selectedVals = selectedAttributeValues[attr.id] || []
        return selectedVals.length > 0
      })
      .map((attr) => {
        const selectedVals = selectedAttributeValues[attr.id] || []
        return selectedVals.map((value) => ({ attributeId: attr.id, attributeName: attr.name, value }))
      })

    if (valueArrays.length === 0) {
      replace([])
      lastProcessedAttributesRef.current = ""
      return
    }

    const combinations = cartesianProduct(valueArrays)

    // Get current variants to preserve user-filled data
    const currentVariants = form.getValues("variants") || []
    
    // Get product-level prices to use as defaults for new variants
    const productSellPrice = form.getValues("price") ?? 0
    const productCostPrice = form.getValues("purchasePrice")

    // Build a map of existing variants by their options key for quick lookup
    const existingVariantsMap = new Map<string, typeof currentVariants[number]>()
    currentVariants.forEach((v) => {
      if (v.options) {
        // Create a stable key from options
        const optionsKey = Object.entries(v.options)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, val]) => `${k}=${val}`)
          .join("|")
        existingVariantsMap.set(optionsKey, v)
      }
    })

    const newVariants = combinations.map((combination) => {
      const options: Record<string, string> = {}
      const variantNameParts: string[] = []

      combination.forEach(({ attributeName, value }) => {
        const key = `attr-${attributeName.toLowerCase().replace(/\s+/g, "-")}`
        options[key] = value
        variantNameParts.push(value)
      })

      // Create options key for matching
      const optionsKey = Object.entries(options)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, val]) => `${k}=${val}`)
        .join("|")

      // Check if this combination already exists — preserve user-filled data
      const existing = existingVariantsMap.get(optionsKey)
      if (existing) {
        return {
          ...existing,
          options, // Keep normalized options
          variantName: existing.variantName || variantNameParts.join(" / "),
        }
      }

      // New variant — auto-fill prices from product-level defaults and branch from topbar
      return {
        variantName: variantNameParts.join(" / "),
        options,
        sku: "",
        price: productSellPrice,
        costPrice: productCostPrice,
        quantity: undefined as number | undefined,
        branchId: defaultBranchId || undefined,
        thumbnailUrl: "",
        images: [] as string[],
      }
    })

    replace(newVariants)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAttributeIds, selectedAttributeValues, availableAttributes])

  const handleBrandChange = useCallback(() => {
    userHasModifiedSelections.current = true
    setSelectedAttributeIds([])
    setSelectedAttributeValues({})
    replace([])
  }, [replace])

  const handleUserModified = useCallback(() => {
    userHasModifiedSelections.current = true
  }, [])

  const onSubmit = (data: CreateProductInput | UpdateProductInput) => {
    // Clean up empty strings - convert to undefined for optional fields
    if (data.description === "" || data.description === null) {
      data.description = undefined
    }
    if (data.barcode === "" || data.barcode === null) {
      data.barcode = undefined
    }
    if (data.thumbnailUrl === "" || data.thumbnailUrl === null) {
      data.thumbnailUrl = undefined
    }
    if (data.images && (data.images.length === 0 || data.images.every(img => !img || img.trim() === ""))) {
      data.images = undefined
    }

    // Remove unused pricing fields
    const cleanedData = { ...data } as CreateProductInput & { salePrice?: number; profitMarginAmount?: number; profitMarginPercent?: number }
    delete cleanedData.salePrice
    delete cleanedData.profitMarginAmount
    delete cleanedData.profitMarginPercent

    // Clean up empty variants array
    if (data.variants && data.variants.length === 0) {
      data.variants = undefined
    }

    // Clean up variant options
    if (data.variants && data.variants.length > 0) {
      // Check for duplicate SKUs
      const skus = data.variants
        .map((v) => v.sku)
        .filter((sku): sku is string => !!sku && sku.trim().length > 0)
      const duplicateSkus = skus.filter((sku, index) => skus.indexOf(sku) !== index)
      
      if (duplicateSkus.length > 0) {
        form.setError("variants", {
          type: "manual",
          message: `Duplicate SKUs found: ${[...new Set(duplicateSkus)].join(", ")}. Each variant must have a unique SKU for stock management.`,
        })
        return
      }

      data.variants = data.variants.map((variant) => {
        const cleanedOptions: Record<string, string> = {}
        if (variant.options && typeof variant.options === "object") {
          Object.entries(variant.options).forEach(([key, value]) => {
            if (
              key &&
              typeof key === "string" &&
              key.trim().length > 0 &&
              value !== null &&
              value !== undefined &&
              typeof value === "string" &&
              value.trim().length > 0
            ) {
              cleanedOptions[key.trim()] = value.trim()
            }
          })
        }

        const v = variant as unknown as PRODUCT_VARIANT_FIELDS
        const cleanedVariant: Record<string, unknown> = {
          variantName: v.variantName || "",
          price: v.price ?? 0,
          options: Object.keys(cleanedOptions).length > 0 ? cleanedOptions : {},
        }

        if (v.id && typeof v.id === "string") {
          cleanedVariant.id = v.id
        }

        // Include cost price if provided
        if (v.costPrice !== undefined && v.costPrice !== null) {
          cleanedVariant.costPrice = v.costPrice
        }

        // Include quantity if provided (for initial stock)
        if (v.quantity !== undefined && v.quantity !== null) {
          cleanedVariant.quantity = v.quantity
        }

        // Include branch ID if provided
        if (v.branchId && typeof v.branchId === "string" && v.branchId.trim().length > 0) {
          cleanedVariant.branchId = v.branchId.trim()
        }

        const thumbnailUrl =
          typeof v.thumbnailUrl === "string" && v.thumbnailUrl.trim().length > 0 ? v.thumbnailUrl.trim() : null
        if (thumbnailUrl) {
          cleanedVariant.thumbnailUrl = thumbnailUrl
        }

        const imagesRaw = v.images
        const images =
          Array.isArray(imagesRaw) && imagesRaw.length > 0
            ? imagesRaw
                .filter((u: unknown): u is string => typeof u === "string" && u.trim().length > 0)
                .map((u: string) => u.trim())
            : null
        if (images && images.length > 0) {
          cleanedVariant.images = images
        }

        const unitId = v.unitId
        if (unitId && typeof unitId === "string" && unitId.trim().length > 0) {
          cleanedVariant.unitId = unitId.trim()
        }

        return cleanedVariant
      }).filter((v) => v.variantName && (v.variantName as string).length > 0) as typeof data.variants
    }

    // Always set barcodeType to EAN_13
    data.barcodeType = "EAN_13"

    // Build stocks[] array from variant-level stock data (Option A: frontend transform)
    // The backend accepts a top-level `stocks[]` array for initial stock creation.
    // We extract branchId/quantity/costPrice from variants and create stock entries.
    interface StockEntry {
      branchId: string
      quantity: number
      purchasePrice?: number
      salePrice?: number
      sku?: string
      variantId?: string
    }
    const stocks: StockEntry[] = []

    if (data.variants && data.variants.length > 0) {
      data.variants = data.variants.map((variant) => {
        const v = variant as unknown as PRODUCT_VARIANT_FIELDS

        // Extract stock data from variant before sending
        if (v.branchId && typeof v.quantity === "number" && v.quantity > 0) {
          stocks.push({
            branchId: v.branchId,
            quantity: v.quantity,
            purchasePrice: v.costPrice ?? data.purchasePrice ?? undefined,
            salePrice: v.price ?? data.price ?? undefined,
            sku: v.sku || undefined,
          })
        }

        // Remove stock-specific fields from variant payload — backend doesn't expect them
        const { costPrice: _cp, quantity: _q, branchId: _bid, ...cleanVariant } = variant as Record<string, unknown>
        return cleanVariant as typeof variant
      })
    }

    // Attach stocks to payload
    const payload = { ...data, stocks: stocks.length > 0 ? stocks : undefined } as Record<string, unknown>

    if (process.env.NODE_ENV === "development") {
      console.log("Submitting product data:", payload)
    }

    if (isEdit && product) {
      updateMutation.mutate(
        { id: product.id, data: payload as unknown as UpdateProductInput },
        {
          onSuccess: async () => {
            // Wait for cache invalidation to complete before navigating
            // so the products list shows the updated data
            await queryClient.invalidateQueries({ queryKey: ["products"] })
            await queryClient.invalidateQueries({ queryKey: ["products-infinite"] })
            await queryClient.invalidateQueries({ queryKey: ["product", product.id] })
            router.push(redirectUrl)
          },
          onError: (error) => {
            if (process.env.NODE_ENV === "development") {
              console.error("Error updating product:", error)
            }
          },
        }
      )
      return
    }

    createMutation.mutate(payload as unknown as CreateProductInput, {
      onSuccess: async () => {
        // Wait for cache invalidation to complete before navigating
        await queryClient.invalidateQueries({ queryKey: ["products"] })
        await queryClient.invalidateQueries({ queryKey: ["products-infinite"] })
        router.push(redirectUrl)
      },
      onError: (error) => {
        if (process.env.NODE_ENV === "development") {
          console.error("Error creating product:", error)
        }
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t("basicInformation") || "Basic Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ProductBasicInfoSection
              form={form}
              isLoading={isLoading}
              onBrandChange={handleBrandChange}
            />
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>{t("categories")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductCategoriesSection
              form={form}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Product Images */}
        <Card>
          <CardHeader>
            <CardTitle>{t("images") || "Product Images"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductImagesSection
              form={form}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Barcode & Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>{t("barcode") || "Barcode & Inventory"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductInventorySection
              form={form}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Attributes Selection */}
        <Card>
          <CardHeader>
            <CardTitle>{t("attributes") || "Attributes"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductAttributesSection
              brandId={brandIdForAttributes}
              isLoading={isLoading}
              selectedAttributeIds={selectedAttributeIds}
              setSelectedAttributeIds={setSelectedAttributeIds}
              selectedAttributeValues={selectedAttributeValues}
              setSelectedAttributeValues={setSelectedAttributeValues}
              onUserModified={handleUserModified}
            />
          </CardContent>
        </Card>

        {/* Variants Preview */}
        {fields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("variants")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductVariantsSection
                form={form}
                fields={fields}
                isLoading={isLoading}
                isEdit={isEdit}
                availableAttributes={availableAttributes}
                existingStocks={product?.stocks}
              />
            </CardContent>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(redirectUrl)}
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
        </div>
      </form>
    </Form>
  )
}
