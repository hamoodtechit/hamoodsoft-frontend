"use client"

import { AttributeDialog } from "@/components/common/attribute-dialog"
import { BrandDialog } from "@/components/common/brand-dialog"
import { CategoryDialog } from "@/components/common/category-dialog"
import { UnitDialog } from "@/components/common/unit-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAttributes, useCreateAttribute } from "@/lib/hooks/use-attributes"
import { useBranches } from "@/lib/hooks/use-branches"
import { useBrands, useCreateBrand } from "@/lib/hooks/use-brands"
import { useCategories, useCreateCategory } from "@/lib/hooks/use-categories"
import { useCreateProduct, useUpdateProduct } from "@/lib/hooks/use-products"
import { useCreateUnit, useUnits } from "@/lib/hooks/use-units"
import { cn } from "@/lib/utils"
import {
  createProductSchema,
  updateProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from "@/lib/validations/products"
import { Branch, Brand, Category, Product, Unit } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDown, Package, Plus, Search, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useRef, useState } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"

interface ProductDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

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

export function ProductDialog({ product, open, onOpenChange }: ProductDialogProps) {
  const t = useTranslations("products")
  const tCommon = useTranslations("common")
  const tAttributes = useTranslations("attributes")
  const { data: units = [] } = useUnits()
  const { data: categories = [] } = useCategories()
  const { data: branches = [] } = useBranches()
  const { data: brandsData } = useBrands()
  const brands = brandsData?.items || []
  
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
        brandId: "",
        variants: [] as Array<{ variantName: string; options: Record<string, string> }>,
      }
    }
    // Handle both variants and productVariants from API
    const variants = (product as any).productVariants || product.variants || []
    return {
      name: product.name || "",
      description: product.description || "",
      price: typeof product.price === "number" ? product.price : 0,
      unitId: product.unitId || "",
      categoryIds: product.categoryIds || product.categories?.map((c) => c.id) || [],
      branchIds: product.branchIds || [],
      brandId: product.brandId || "",
      variants: variants,
    }
  }, [product])

  const form = useForm<CreateProductInput | UpdateProductInput>({
    resolver: zodResolver(schema as any),
    defaultValues,
    mode: "onChange", // Enable validation on change
  })

  // Debug form errors (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && Object.keys(form.formState.errors).length > 0) {
      console.error("Form validation errors:", form.formState.errors)
    }
  }, [form.formState.errors])

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "variants",
  })

  const selectedBrandId = useWatch({ control: form.control, name: "brandId" })
  // Fetch attributes filtered by brand (if brand is selected)
  // For edit mode, use product's brandId; for create mode, use selectedBrandId
  const brandIdForAttributes = product?.brandId || selectedBrandId
  const { data: attributesData } = useAttributes(
    brandIdForAttributes ? { brandId: brandIdForAttributes } : undefined
  )
  // Group attributes by name and combine their values
  const availableAttributes = useMemo(() => {
    const attrs = attributesData?.items || []
    // Group attributes with the same name together
    const grouped = new Map<string, { id: string; name: string; values: string[]; allIds: string[] }>()
    
    attrs.forEach((attr) => {
      const key = attr.name.toLowerCase()
      if (grouped.has(key)) {
        const existing = grouped.get(key)!
        // Merge values, avoiding duplicates
        const mergedValues = [...new Set([...existing.values, ...attr.values])]
        existing.values = mergedValues
        existing.allIds.push(attr.id)
        // Use the first attribute's ID as the primary ID
      } else {
        grouped.set(key, {
          id: attr.id, // Use first attribute's ID
          name: attr.name,
          values: [...attr.values],
          allIds: [attr.id],
        })
      }
    })
    
    const groupedAttrs = Array.from(grouped.values())
    
    return groupedAttrs
  }, [attributesData?.items])

  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([])
  // Track selected values per attribute: { attributeId: [value1, value2, ...] }
  const [selectedAttributeValues, setSelectedAttributeValues] = useState<Record<string, string[]>>({})
  const [isAttributeDialogOpen, setIsAttributeDialogOpen] = useState(false)
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false)
  const [isBrandDialogOpen, setIsBrandDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [categorySearchQuery, setCategorySearchQuery] = useState("")
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const createAttributeMutation = useCreateAttribute()
  const createUnitMutation = useCreateUnit()
  const createBrandMutation = useCreateBrand()
  const createCategoryMutation = useCreateCategory()
  const lastProcessedAttributesRef = useRef<string>("")

  // Track if we've initialized from product variants (to prevent resetting user selections)
  const hasInitializedFromProduct = useRef(false)
  const previousProductIdRef = useRef<string | null>(null)

  useEffect(() => {
    // Only reset form when product changes or dialog opens/closes
    if (!open) {
      hasInitializedFromProduct.current = false
      previousProductIdRef.current = null
      return
    }

    // Check if product actually changed (not just brand or other fields)
    const currentProductId = product?.id || null
    const productChanged = previousProductIdRef.current !== currentProductId
    
    // Only reset form if product actually changed
    if (productChanged) {
      form.reset(defaultValues)
      previousProductIdRef.current = currentProductId
    } else if (previousProductIdRef.current === null && !product && open) {
      // First time opening for new product - only reset once
      if (!hasInitializedFromProduct.current) {
        form.reset(defaultValues)
        previousProductIdRef.current = null
      }
    }
    
    // Handle both variants and productVariants from API
    const existingVariants = (product as any)?.productVariants || product?.variants || []
    
    // Only initialize if we have variants, attributes are loaded, and haven't initialized yet
    // Wait for attributes to be available before trying to match them
    // Also ensure product exists (for edit mode)
    if (product && existingVariants.length > 0 && availableAttributes.length > 0 && !hasInitializedFromProduct.current && open) {
      // Extract selected attributes and values from existing variants
      // Options keys might be in format: "attr-color", "attr-size", or attribute IDs, or attribute names
      const attrIds = new Set<string>()
      const attrValuesMap: Record<string, Set<string>> = {}
      
      existingVariants.forEach((v: any) => {
        Object.entries(v.options || {}).forEach(([key, value]) => {
          let attr: { id: string; name: string } | undefined
          
          // Handle "attr-{name}" format (e.g., "attr-color" -> "Color")
          if (key.startsWith("attr-")) {
            const attrName = key.replace(/^attr-/, "").replace(/-/g, " ")
            // Convert to title case: "color" -> "Color", "size" -> "Size"
            const normalizedName = attrName
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(" ")
            attr = availableAttributes.find(
              (a) => a.name.toLowerCase() === normalizedName.toLowerCase()
            )
          } else {
            // Try to find attribute by name (if API returns names as keys)
            attr = availableAttributes.find((a) => a.name === key)
            if (!attr) {
              // Otherwise, assume it's an ID
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
      
      // Only set selections if we found matching attributes
      if (attrIds.size > 0) {
        setSelectedAttributeIds(Array.from(attrIds))
        // Convert Sets to arrays for selectedAttributeValues
        const selectedValues: Record<string, string[]> = {}
        Object.entries(attrValuesMap).forEach(([attrId, values]) => {
          selectedValues[attrId] = Array.from(values)
        })
        setSelectedAttributeValues(selectedValues)
        
        // Set the processed attributes ref to prevent immediate regeneration during initialization
        const initAttributesKey = JSON.stringify({
          ids: Array.from(attrIds).sort(),
          values: Object.entries(attrValuesMap).map(([attrId, values]) => ({
            id: attrId,
            values: Array.from(values).sort(),
          })),
        })
        lastProcessedAttributesRef.current = initAttributesKey
        
        // Load existing variants into the form (preserve existing options format)
        replace(existingVariants.map((v: any) => ({
          variantName: v.variantName || "",
          sku: v.sku || "",
          price: v.price ?? 0, // Price is required
          options: v.options || {},
        })))
        
        hasInitializedFromProduct.current = true
      } else {
        // No matching attributes found, but still load variants
        replace(existingVariants.map((v: any) => ({
          variantName: v.variantName || "",
          sku: v.sku || "",
          price: v.price ?? 0,
          options: v.options || {},
        })))
        hasInitializedFromProduct.current = true
      }
    } else if (!product) {
      // For new products, only clear on initial open if no selections exist
      // This preserves user selections when they scroll/interact with form
      if (!hasInitializedFromProduct.current && Object.keys(selectedAttributeValues).length === 0) {
        setSelectedAttributeIds([])
        setSelectedAttributeValues({})
        replace([])
        hasInitializedFromProduct.current = true
      }
    }
  }, [open, product?.id, form, replace, availableAttributes, attributesData])

  // Reset state when dialog closes completely
  useEffect(() => {
    if (!open) {
      // Reset flag when dialog closes so state can be re-initialized on next open
      hasInitializedFromProduct.current = false
      // Clear selections when dialog closes
      setSelectedAttributeIds([])
      setSelectedAttributeValues({})
      lastProcessedAttributesRef.current = ""
    }
  }, [open])

  // Auto-generate variants when attributes are selected
  useEffect(() => {
    // Skip variant generation if we're still initializing from existing product
    // This prevents regeneration during the initial load
    if (hasInitializedFromProduct.current && product) {
      const existingVariants = (product as any)?.productVariants || product?.variants || []
      if (existingVariants.length > 0) {
        const currentVariants = form.getValues("variants") || []
        // Only skip if variants are loaded and selections haven't changed
        if (currentVariants.length > 0) {
          // Check if selected values match existing variant options
          const existingValuesMap: Record<string, Set<string>> = {}
          existingVariants.forEach((v: any) => {
            Object.entries(v.options || {}).forEach(([key, value]) => {
              let attr: { id: string; name: string } | undefined
              
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
                attr = availableAttributes.find((a) => a.name === key || a.id === key)
              }
              
              if (attr) {
                if (!existingValuesMap[attr.id]) {
                  existingValuesMap[attr.id] = new Set<string>()
                }
                existingValuesMap[attr.id].add(value as string)
              }
            })
          })
          
          // Compare with selected values
          const selectedValuesMatch = Object.keys(existingValuesMap).every((attrId) => {
            const existingValues = Array.from(existingValuesMap[attrId] || []).sort()
            const selectedValues = (selectedAttributeValues[attrId] || []).sort()
            return (
              existingValues.length === selectedValues.length &&
              existingValues.every((val) => selectedValues.includes(val))
            )
          })
          
          // If they match and same number of attributes, don't regenerate (user hasn't changed selections yet)
          if (selectedValuesMatch && Object.keys(existingValuesMap).length === Object.keys(selectedAttributeValues).length) {
            // Mark that initialization is complete, allow future regenerations
            hasInitializedFromProduct.current = false
            return
          } else {
            // Selections have changed, allow regeneration
            hasInitializedFromProduct.current = false
          }
        }
      } else {
        // No existing variants, allow regeneration
        hasInitializedFromProduct.current = false
      }
    }

    // Create a key from selected attribute IDs and their values
    const selectedAttributes = availableAttributes.filter((attr) =>
      selectedAttributeIds.includes(attr.id)
    )
    const attributesKey = JSON.stringify({
      ids: selectedAttributeIds.sort(),
      values: selectedAttributes.map((attr) => ({
        id: attr.id,
        values: (selectedAttributeValues[attr.id] || []).sort(), // Use SELECTED values, not all values
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
        const selectedValues = selectedAttributeValues[attr.id] || []
        return selectedValues.length > 0
      })
      .map((attr) => {
        const selectedValues = selectedAttributeValues[attr.id] || []
        return selectedValues.map((value) => ({ attributeId: attr.id, attributeName: attr.name, value }))
      })

    // Handle edge case: if no arrays, return empty
    if (valueArrays.length === 0) {
      replace([])
      lastProcessedAttributesRef.current = ""
      return
    }

    const combinations = cartesianProduct(valueArrays)

    // Convert to variant format
    const newVariants = combinations.map((combination) => {
      const options: Record<string, string> = {}
      const variantNameParts: string[] = []

      combination.forEach(({ attributeId, attributeName, value }) => {
        // Use "attr-{name}" format as key (e.g., "attr-color", "attr-size") - matches backend DTO example
        const key = `attr-${attributeName.toLowerCase().replace(/\s+/g, "-")}`
        options[key] = value
        variantNameParts.push(value)
      })

      return {
        variantName: variantNameParts.join(" / "),
        options,
        sku: "", // Empty SKU - user can fill or auto-generate
        price: 0, // Required - default to 0, user must set
      }
    })

    replace(newVariants)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAttributeIds, selectedAttributeValues, availableAttributes])

  const onSubmit = (data: CreateProductInput | UpdateProductInput) => {
    // Clean up empty brandId
    if (data.brandId === "") {
      data.brandId = undefined
    }

    // Clean up empty variants array
    if (data.variants && data.variants.length === 0) {
      data.variants = undefined
    }

    // Clean up variant options - ensure all keys and values are valid strings
    if (data.variants && data.variants.length > 0) {
      // Check for duplicate SKUs (if SKUs are provided)
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
            // Only include non-empty string keys and string values
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
        return {
          variantName: variant.variantName || "",
          sku: variant.sku?.trim() || undefined, // Clean SKU, make undefined if empty
          price: variant.price ?? 0, // Price is required, default to 0 if not set
          options: Object.keys(cleanedOptions).length > 0 ? cleanedOptions : {}, // Ensure options is always an object
        }
      }).filter((variant) => variant.variantName && variant.variantName.length > 0) // Remove variants with empty names
    }

    // Log for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.log("Submitting product data:", data)
    }

    if (isEdit && product) {
      updateMutation.mutate(
        { id: product.id, data: data as UpdateProductInput },
        {
          onSuccess: () => {
            onOpenChange(false)
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

    createMutation.mutate(data as CreateProductInput, {
      onSuccess: () => {
        onOpenChange(false)
        form.reset()
        setSelectedAttributeIds([])
      },
      onError: (error) => {
        if (process.env.NODE_ENV === "development") {
          console.error("Error creating product:", error)
        }
      },
    })
  }

  const unitOptions = units as Unit[]
  const branchOptions = branches as Branch[]
  const brandOptions = brands as Brand[]

  // Flatten categories to include all (parent + children) for selection
  const flattenCategoriesForSelection = useMemo(() => {
    const flattened: Array<Category & { parentName?: string; level: number }> = []
    
    const traverse = (cats: Category[], level = 0, parentName?: string) => {
      cats.forEach((cat) => {
        flattened.push({
          ...cat,
          children: undefined,
          parentName,
          level,
        })
        
        // Recursively traverse children if they exist
        if ((cat as any).children && Array.isArray((cat as any).children) && (cat as any).children.length > 0) {
          traverse((cat as any).children, level + 1, cat.name)
        }
      })
    }
    
    traverse(categories)
    return flattened
  }, [categories])

  // Create a map of category ID to all its children IDs (recursive)
  const categoryChildrenMap = useMemo(() => {
    const map = new Map<string, string[]>()
    
    const getChildrenIds = (cat: Category): string[] => {
      const childrenIds: string[] = []
      if ((cat as any).children && Array.isArray((cat as any).children)) {
        (cat as any).children.forEach((child: Category) => {
          childrenIds.push(child.id)
          childrenIds.push(...getChildrenIds(child))
        })
      }
      return childrenIds
    }
    
    flattenCategoriesForSelection.forEach((cat) => {
      map.set(cat.id, getChildrenIds(cat))
    })
    
    return map
  }, [flattenCategoriesForSelection])

  const selectedAttributes = availableAttributes.filter((attr) =>
    selectedAttributeIds.includes(attr.id)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
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
                    <div className="flex gap-2">
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
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setIsUnitDialogOpen(true)}
                        disabled={isLoading}
                        title={t("createUnit") || "Create Unit"}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="brandId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("brand")}</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <select
                        className={cn(
                          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          "disabled:cursor-not-allowed disabled:opacity-50"
                        )}
                        value={field.value || ""}
                        onChange={(e) => {
                          const newBrandId = e.target.value
                          field.onChange(newBrandId)
                          // Clear selected attributes when brand changes (but don't reset form)
                          setSelectedAttributeIds([])
                          setSelectedAttributeValues({})
                          replace([])
                        }}
                        disabled={isLoading}
                      >
                        <option value="">{t("selectBrand")}</option>
                        {brandOptions.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsBrandDialogOpen(true)}
                      disabled={isLoading}
                      title={t("createBrand") || "Create Brand"}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryIds"
              render={({ field }) => {
                const selected = Array.isArray(field.value) ? field.value : []

                // Filter categories based on search
                const filteredCategories = flattenCategoriesForSelection.filter((cat) =>
                  cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
                )

                // Get selected category names for display
                const selectedCategoryNames = flattenCategoriesForSelection
                  .filter((cat) => selected.includes(cat.id))
                  .map((cat) => cat.name)

                // Handle category selection with auto-select children
                const handleCategoryToggle = (categoryId: string, checked: boolean) => {
                  let newSelected: string[]
                  
                  if (checked) {
                    // Add category and all its children
                    const childrenIds = categoryChildrenMap.get(categoryId) || []
                    newSelected = [...new Set([...selected, categoryId, ...childrenIds])]
                  } else {
                    // Remove category and all its children
                    const childrenIds = categoryChildrenMap.get(categoryId) || []
                    const idsToRemove = new Set([categoryId, ...childrenIds])
                    newSelected = selected.filter((id) => !idsToRemove.has(id))
                  }
                  
                  field.onChange(newSelected)
                }

                return (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>{t("categories")}</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCategoryDialogOpen(true)}
                        disabled={isLoading}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {t("createCategory") || "Create Category"}
                      </Button>
                    </div>
                    <FormControl>
                      <div>
                        <DropdownMenu open={isCategoryDropdownOpen} onOpenChange={setIsCategoryDropdownOpen}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-between"
                              disabled={isLoading}
                            >
                              <span className="truncate">
                                {selected.length === 0
                                  ? t("selectCategories") || "Select categories..."
                                  : `${selected.length} ${selected.length === 1 ? "category" : "categories"} selected`}
                              </span>
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[400px] p-0" align="start">
                            <div className="flex items-center border-b px-3">
                              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                              <Input
                                placeholder={t("searchCategories") || "Search categories..."}
                                value={categorySearchQuery}
                                onChange={(e) => setCategorySearchQuery(e.target.value)}
                                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <ScrollArea className="h-[300px]">
                              <div className="p-2">
                                {filteredCategories.length === 0 ? (
                                  <p className="py-6 text-center text-sm text-muted-foreground">
                                    {t("noCategoriesFound") || "No categories found"}
                                  </p>
                                ) : (
                                  filteredCategories.map((cat) => {
                                    const checked = selected.includes(cat.id)
                                    const childrenIds = categoryChildrenMap.get(cat.id) || []
                                    const allChildrenSelected = childrenIds.length > 0 && childrenIds.every((id) => selected.includes(id))
                                    
                                    return (
                                      <label
                                        key={cat.id}
                                        className={cn(
                                          "flex items-center gap-2 rounded-md p-2 hover:bg-accent",
                                          checked && "bg-accent"
                                        )}
                                      >
                                        <Checkbox
                                          checked={checked}
                                          onCheckedChange={(val) => handleCategoryToggle(cat.id, val === true)}
                                          disabled={isLoading}
                                        />
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{cat.name}</span>
                                            {cat.parentName && (
                                              <span className="text-xs text-muted-foreground">
                                                ({cat.parentName})
                                              </span>
                                            )}
                                            {childrenIds.length > 0 && (
                                              <Badge variant="secondary" className="text-xs">
                                                {childrenIds.length} {childrenIds.length === 1 ? "sub" : "subs"}
                                              </Badge>
                                            )}
                                          </div>
                                          {checked && childrenIds.length > 0 && !allChildrenSelected && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                              {childrenIds.filter((id) => selected.includes(id)).length} of {childrenIds.length} subcategories selected
                                            </p>
                                          )}
                                        </div>
                                      </label>
                                    )
                                  })
                                )}
                              </div>
                            </ScrollArea>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        {/* Display selected categories as badges */}
                        {selected.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selectedCategoryNames.map((name, idx) => {
                              const categoryId = flattenCategoriesForSelection.find((c) => c.name === name)?.id
                              return (
                                <Badge key={categoryId || idx} variant="secondary" className="gap-1">
                                  {name}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (categoryId) {
                                        handleCategoryToggle(categoryId, false)
                                      }
                                    }}
                                    className="ml-1 rounded-full hover:bg-secondary-foreground/20"
                                    disabled={isLoading}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              )
                            })}
                          </div>
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

            {/* Attributes Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{tAttributes("title")}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAttributeDialogOpen(true)}
                  disabled={isLoading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {tAttributes("createAttribute")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("selectAttributesDescription")}
              </p>
              {availableAttributes.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{t("noAttributesHint")}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAttributeDialogOpen(true)}
                    disabled={isLoading}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {tAttributes("createAttribute")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableAttributes.map((attr) => {
                    const selectedValues = selectedAttributeValues[attr.id] || []
                    const hasSelectedValues = selectedValues.length > 0
                    
                    
                    return (
                      <Card key={attr.id} className={cn("border", hasSelectedValues && "border-primary bg-primary/5")}>
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">{attr.name}</Label>
                              <Checkbox
                                checked={hasSelectedValues}
                                onCheckedChange={(val) => {
                                  if (val) {
                                    // Select all values
                                    setSelectedAttributeValues((prev) => ({
                                      ...prev,
                                      [attr.id]: attr.values,
                                    }))
                                    if (!selectedAttributeIds.includes(attr.id)) {
                                      setSelectedAttributeIds([...selectedAttributeIds, attr.id])
                                    }
                                  } else {
                                    // Deselect all values
                                    setSelectedAttributeValues((prev) => {
                                      const next = { ...prev }
                                      delete next[attr.id]
                                      return next
                                    })
                                    setSelectedAttributeIds(selectedAttributeIds.filter((id) => id !== attr.id))
                                  }
                                }}
                                disabled={isLoading}
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {attr.values.map((value) => {
                                const isValueSelected = selectedValues.includes(value)
                                return (
                                  <label
                                    key={value}
                                    className={cn(
                                      "flex items-center gap-2 rounded-md border px-2 py-1 cursor-pointer transition-colors",
                                      isValueSelected
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border hover:bg-muted"
                                    )}
                                  >
                                    <Checkbox
                                      checked={isValueSelected}
                                      onCheckedChange={(val) => {
                                        const currentValues = selectedAttributeValues[attr.id] || []
                                        let newValues: string[]
                                        
                                        if (val) {
                                          newValues = [...currentValues, value]
                                        } else {
                                          newValues = currentValues.filter((v) => v !== value)
                                        }
                                        
                                        setSelectedAttributeValues((prev) => ({
                                          ...prev,
                                          [attr.id]: newValues,
                                        }))
                                        
                                        // Update selectedAttributeIds based on whether any values are selected
                                        if (newValues.length > 0) {
                                          if (!selectedAttributeIds.includes(attr.id)) {
                                            setSelectedAttributeIds([...selectedAttributeIds, attr.id])
                                          }
                                        } else {
                                          setSelectedAttributeIds(selectedAttributeIds.filter((id) => id !== attr.id))
                                        }
                                      }}
                                      disabled={isLoading}
                                    />
                                    <span className="text-xs">{value}</span>
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Variants Preview */}
            {fields.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("variantsPreview")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("variantsWillBeCreated")} ({fields.length} {fields.length === 1 ? "variant" : "variants"})
                    </p>
                  </div>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                  {fields.map((field, index) => (
                    <Card key={field.id} className="border">
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <FormField
                            control={form.control}
                            name={`variants.${index}.variantName`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">{t("variantName")}</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder={t("variantName")}
                                    disabled={isLoading}
                                    className="h-8"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex flex-wrap gap-1.5">
                            {(() => {
                              const variantData = form.getValues(`variants.${index}`)
                              const options = variantData?.options || fields[index]?.options || {}
                              // Convert "attr-{name}" keys to readable attribute names for display
                              return Object.entries(options).map(([key, value], idx) => {
                                // Extract attribute name from "attr-color" -> "Color"
                                let displayName = key
                                if (key.startsWith("attr-")) {
                                  const attrName = key.replace(/^attr-/, "").replace(/-/g, " ")
                                  displayName = attrName
                                    .split(" ")
                                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                    .join(" ")
                                } else {
                                  // Try to find attribute by name or ID
                                  const attr = availableAttributes.find((a) => a.name === key || a.id === key)
                                  if (attr) {
                                    displayName = attr.name
                                  }
                                }
                                return (
                                  <Badge key={`${key}-${idx}-${value}`} variant="secondary" className="text-xs">
                                    <span className="font-medium">{displayName}:</span>{" "}
                                    <span className="ml-1">{String(value)}</span>
                                  </Badge>
                                )
                              })
                            })()}
                          </div>
                          
                          {/* SKU and Price fields for stock management */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t">
                            <FormField
                              control={form.control}
                              name={`variants.${index}.sku`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">
                                    SKU <span className="text-muted-foreground">(for stock)</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="SKU-001"
                                      disabled={isLoading}
                                      className="h-8"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`variants.${index}.price`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">
                                    Price <span className="text-destructive">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      placeholder="0.00"
                                      disabled={isLoading}
                                      className="h-8"
                                      value={field.value ?? ""}
                                      onChange={(e) => {
                                        const value = e.target.value
                                        field.onChange(value === "" ? undefined : parseFloat(value) || 0)
                                      }}
                                      required
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

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

      {/* Attribute Creation Dialog */}
      <AttributeDialog
        attribute={null}
        open={isAttributeDialogOpen}
        onOpenChange={setIsAttributeDialogOpen}
        onSubmitCreate={(data) => {
          createAttributeMutation.mutate(data, {
            onSuccess: () => {
              setIsAttributeDialogOpen(false)
            },
          })
        }}
        onSubmitUpdate={() => {}}
        isLoading={createAttributeMutation.isPending}
      />

      {/* Unit Creation Dialog */}
      <UnitDialog
        unit={null}
        open={isUnitDialogOpen}
        onOpenChange={setIsUnitDialogOpen}
      />

      {/* Brand Creation Dialog */}
      <BrandDialog
        brand={null}
        open={isBrandDialogOpen}
        onOpenChange={setIsBrandDialogOpen}
        onSubmitCreate={(data) => {
          createBrandMutation.mutate(data, {
            onSuccess: () => {
              setIsBrandDialogOpen(false)
            },
          })
        }}
        onSubmitUpdate={() => {}}
        isLoading={createBrandMutation.isPending}
      />

      {/* Category Creation Dialog */}
      <CategoryDialog
        category={null}
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
      />
    </Dialog>
  )
}
