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
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { useBranches } from "@/lib/hooks/use-branches"
import { useContacts } from "@/lib/hooks/use-contacts"
import { useProducts } from "@/lib/hooks/use-products"
import { useCreateSale, useUpdateSale } from "@/lib/hooks/use-sales"
import { useStocks } from "@/lib/hooks/use-stocks"
import { useUnits } from "@/lib/hooks/use-units"
import {
  createSaleSchema,
  updateSaleSchema,
  type CreateSaleInput,
  type UpdateSaleInput,
} from "@/lib/validations/sales"
import { Product, ProductVariant, Sale } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Search, ShoppingCart, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"

interface SaleDialogProps {
  sale: Sale | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SaleDialog({ sale, open, onOpenChange }: SaleDialogProps) {
  const t = useTranslations("sales")
  const tCommon = useTranslations("common")
  const { data: branches = [] } = useBranches()
  const { selectedBranchId } = useBranchSelection()
  const { data: units = [] } = useUnits(selectedBranchId || undefined)
  const { data: contactsData } = useContacts({ type: "CUSTOMER" })
  const contacts = contactsData?.items || []
  const createMutation = useCreateSale()
  const updateMutation = useUpdateSale()

  const isEdit = !!sale
  const isLoading = createMutation.isPending || updateMutation.isPending

  const schema = isEdit ? updateSaleSchema : createSaleSchema

  const defaultValues = useMemo(() => {
    if (!sale) {
      return {
        branchId: selectedBranchId || "",
        contactId: "",
        items: [
          {
            sku: "",
            itemName: "",
            itemDescription: "",
            unit: "",
            price: 0,
            quantity: 1,
            discountType: "NONE" as const,
            discountAmount: 0,
            totalPrice: 0,
          },
        ],
        status: "SOLD" as const,
        paymentStatus: "DUE" as const,
        paidAmount: 0,
        totalPrice: 0,
        discountType: "NONE" as const,
        discountAmount: 0,
      }
    }
    // For update, only include fields that can be updated
    return {
      branchId: sale.branchId || selectedBranchId || "",
      contactId: sale.contactId || "",
      status: sale.status || "SOLD",
      paymentStatus: sale.paymentStatus || "DUE",
      paidAmount: sale.paidAmount || 0,
    }
  }, [sale, selectedBranchId])

  const form = useForm<CreateSaleInput | UpdateSaleInput>({
    resolver: zodResolver(schema as any),
    defaultValues,
  })

  // Fetch products for selection - watch branchId from form
  const branchId = useWatch({ control: form.control, name: "branchId" })
  const { data: productsData } = useProducts({ 
    branchId: branchId || selectedBranchId || undefined,
    limit: 1000 // Get all products for selection
  })
  const products = productsData?.items || []
  
  // Fetch stocks for the selected branch
  const { data: stocksData } = useStocks({ 
    branchId: branchId || selectedBranchId || undefined 
  })
  const stocks = stocksData?.items || []
  
  // Create stock map by SKU and productId for quick lookup
  const stockMapBySku = useMemo(() => {
    const map = new Map<string, any>()
    
    // Add stocks from separate query
    stocks.forEach((stock: any) => {
      if (stock.sku) {
        map.set(stock.sku, stock)
      }
      // Also map by productId for non-variable products
      if (stock.productId) {
        map.set(stock.productId, stock)
      }
    })
    
    // Also add stocks from product.stocks array (if available)
    products.forEach((product) => {
      if (product.stocks && Array.isArray(product.stocks)) {
        product.stocks.forEach((stock: any) => {
          if (stock.sku) {
            // Only add if not already in map (separate query takes precedence)
            if (!map.has(stock.sku)) {
              map.set(stock.sku, stock)
            }
          }
          // Also map by productId
          if (stock.productId && !map.has(stock.productId)) {
            map.set(stock.productId, stock)
          }
        })
      }
    })
    
    return map
  }, [stocks, products])
  
  // Helper function to find stock for a product/variant (multiple strategies)
  const findStock = (product: Product, variant?: ProductVariant | null): any => {
    const currentBranchId = branchId || selectedBranchId
    
    if (variant) {
      // For variants, try multiple strategies
      const sku = variant.sku || variant.id
      
      // Strategy 1: Find by SKU in stockMapBySku
      let stock = stockMapBySku.get(sku)
      
      // Strategy 2: Find by SKU in product.stocks
      if (!stock && product.stocks && Array.isArray(product.stocks)) {
        stock = product.stocks.find((s: any) => s.sku === sku && s.branchId === currentBranchId)
      }
      
      // Strategy 3: Try from separate stocks query by SKU
      if (!stock) {
        stock = stocks.find((s: any) => s.sku === sku && s.branchId === currentBranchId)
      }
      
      // Strategy 4: For variable products, try by productId if SKU doesn't match
      if (!stock && product.isVariable) {
        stock = product.stocks?.find((s: any) => 
          s.branchId === currentBranchId && s.productId === product.id
        ) || stocks.find((s: any) => 
          s.productId === product.id && s.branchId === currentBranchId
        )
      }
      
      return stock
    } else {
      // For non-variable products, check by productId
      // Strategy 1: Find by productId in stockMapBySku
      let stock = stockMapBySku.get(product.id)
      
      // Strategy 2: Find in product.stocks by productId and branchId
      if (!stock && product.stocks && Array.isArray(product.stocks)) {
        stock = product.stocks.find((s: any) => 
          s.productId === product.id && s.branchId === currentBranchId
        )
      }
      
      // Strategy 3: Try from separate stocks query
      if (!stock) {
        stock = stocks.find((s: any) => 
          s.productId === product.id && s.branchId === currentBranchId
        )
      }
      
      return stock
    }
  }
  
  // Helper function to check if product/variant is in stock
  const isProductInStock = (product: Product, variant?: ProductVariant | null): boolean => {
    // If stock management is disabled, allow sale
    if (!product.manageStocks) {
      return true
    }
    
    // For variable products without variant selected, check if any variant has stock
    if (product.isVariable && product.productVariants && product.productVariants.length > 0 && !variant) {
      return product.productVariants.some((v) => {
        const vStock = findStock(product, v)
        return vStock && vStock.quantity > 0
      })
    }
    
    const stock = findStock(product, variant || undefined)
    return stock && stock.quantity > 0
  }
  
  // Helper function to get available stock quantity
  const getAvailableStock = (product: Product, variant?: ProductVariant | null): number => {
    if (!product.manageStocks) {
      return Infinity // No stock management, unlimited
    }
    
    // For variable products without variant selected, return 0 (need to select variant first)
    if (product.isVariable && product.productVariants && product.productVariants.length > 0 && !variant) {
      return 0
    }
    
    const stock = findStock(product, variant || undefined)
    return stock?.quantity || 0
  }

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items" as any,
  })

  // Track selected products and variants for each item
  const [selectedProducts, setSelectedProducts] = useState<Record<number, Product | null>>({})
  const [selectedVariants, setSelectedVariants] = useState<Record<number, ProductVariant | null>>({})
  const [productSearchQueries, setProductSearchQueries] = useState<Record<number, string>>({})

  // Watch paidAmount to calculate total in create mode
  const paidAmount = useWatch({
    control: form.control,
    name: "paidAmount" as any,
  })

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
      if (!isEdit) {
        // Reset items array for create
        form.setValue("items" as any, [
          {
            sku: "",
            itemName: "",
            itemDescription: "",
            unit: "",
            price: 0,
            quantity: 1,
            discountType: "NONE",
            discountAmount: 0,
            totalPrice: 0,
          },
        ])
        // Auto-select branch if available
        if (selectedBranchId) {
          form.setValue("branchId", selectedBranchId)
        }
        // Reset product selections
        setSelectedProducts({})
        setSelectedVariants({})
        setProductSearchQueries({})
      }
    }
  }, [open, defaultValues, form, isEdit, selectedBranchId])

  const onSubmit = (data: CreateSaleInput | UpdateSaleInput) => {
    // Validate stock availability before submitting
    if (!isEdit && 'items' in data && data.items) {
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i]
        const product = selectedProducts[i]
        
        if (product && product.manageStocks) {
          const variant = selectedVariants[i]
          const availableStock = getAvailableStock(product, variant)
          const requestedQuantity = item.quantity || 1
          
          if (requestedQuantity > availableStock) {
            form.setError(`items.${i}.quantity` as any, {
              type: "manual",
              message: `Only ${availableStock} available in stock. Requested: ${requestedQuantity}`
            })
            return
          }
          
          if (availableStock === 0) {
            form.setError(`items.${i}.itemName` as any, {
              type: "manual",
              message: "This product is out of stock"
            })
            return
          }
        }
      }
    }
    
    if (isEdit && sale) {
      updateMutation.mutate(
        { id: sale.id, data: data as UpdateSaleInput },
        {
          onSuccess: () => {
            onOpenChange(false)
          },
        }
      )
      return
    }

    createMutation.mutate(data as CreateSaleInput, {
      onSuccess: () => {
        onOpenChange(false)
        form.reset(defaultValues)
      },
    })
  }

  const addItem = () => {
    const newIndex = fields.length
    append({
      sku: "",
      itemName: "",
      itemDescription: "",
      unit: "",
      price: 0,
      quantity: 1,
      discountType: "NONE" as const,
      discountAmount: 0,
      totalPrice: 0,
    })
    setSelectedProducts(prev => ({ ...prev, [newIndex]: null }))
    setSelectedVariants(prev => ({ ...prev, [newIndex]: null }))
    setProductSearchQueries(prev => ({ ...prev, [newIndex]: "" }))
  }

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index)
      // Clean up state for removed item
      setSelectedProducts(prev => {
        const updated = { ...prev }
        delete updated[index]
        // Reindex remaining items
        const reindexed: Record<number, Product | null> = {}
        Object.keys(updated).forEach(key => {
          const oldIndex = parseInt(key)
          if (oldIndex > index) {
            reindexed[oldIndex - 1] = updated[oldIndex]
          } else if (oldIndex < index) {
            reindexed[oldIndex] = updated[oldIndex]
          }
        })
        return reindexed
      })
      setSelectedVariants(prev => {
        const updated = { ...prev }
        delete updated[index]
        const reindexed: Record<number, ProductVariant | null> = {}
        Object.keys(updated).forEach(key => {
          const oldIndex = parseInt(key)
          if (oldIndex > index) {
            reindexed[oldIndex - 1] = updated[oldIndex]
          } else if (oldIndex < index) {
            reindexed[oldIndex] = updated[oldIndex]
          }
        })
        return reindexed
      })
      setProductSearchQueries(prev => {
        const updated = { ...prev }
        delete updated[index]
        const reindexed: Record<number, string> = {}
        Object.keys(updated).forEach(key => {
          const oldIndex = parseInt(key)
          if (oldIndex > index) {
            reindexed[oldIndex - 1] = updated[oldIndex]
          } else if (oldIndex < index) {
            reindexed[oldIndex] = updated[oldIndex]
          }
        })
        return reindexed
      })
    }
  }

  // Calculate item total price (price * quantity - discount)
  const calculateItemTotal = (item: any) => {
    const subtotal = (item.price || 0) * (item.quantity || 0)
    const discountType = item.discountType || "NONE"
    const discountAmount = item.discountAmount || 0
    
    let discount = 0
    if (discountType === "PERCENTAGE") {
      discount = (subtotal * discountAmount) / 100
    } else if (discountType === "FIXED") {
      discount = discountAmount
    }
    
    return Math.max(0, subtotal - discount)
  }

  // Calculate sale total
  const calculateTotal = () => {
    if (isEdit) return null
    const items = form.watch("items" as any) || []
    const saleDiscountType = form.watch("discountType" as any) || "NONE"
    const saleDiscountAmount = form.watch("discountAmount" as any) || 0
    
    const itemsTotal = items.reduce((sum: number, item: any) => {
      return sum + calculateItemTotal(item)
    }, 0)
    
    let discount = 0
    if (saleDiscountType === "PERCENTAGE") {
      discount = (itemsTotal * saleDiscountAmount) / 100
    } else if (saleDiscountType === "FIXED") {
      discount = saleDiscountAmount
    }
    
    return Math.max(0, itemsTotal - discount)
  }

  const total = calculateTotal()

  // Watch items to update totalPrice
  const watchedItems = form.watch("items" as any) || []
  const watchedDiscountType = form.watch("discountType" as any) || "NONE"
  const watchedDiscountAmount = form.watch("discountAmount" as any) || 0

  // Update item totalPrice when item fields change
  useEffect(() => {
    watchedItems.forEach((item: any, index: number) => {
      const itemTotal = calculateItemTotal(item)
      form.setValue(`items.${index}.totalPrice` as any, itemTotal, { shouldValidate: false })
    })
  }, [watchedItems, form])

  // Update sale totalPrice when items or discount change
  useEffect(() => {
    if (!isEdit && total !== null) {
      form.setValue("totalPrice" as any, total, { shouldValidate: false })
    }
  }, [total, isEdit, form, watchedDiscountType, watchedDiscountAmount])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {isEdit ? t("editSale") : t("createSale")}
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
                    name="contactId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("contact")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isEdit}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("selectContact")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contacts.map((contact) => (
                              <SelectItem key={contact.id} value={contact.id}>
                                {contact.name} {contact.email ? `(${contact.email})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {isEdit && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("status")}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || "DRAFT"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="DRAFT">{t("statusDraft")}</SelectItem>
                                <SelectItem value="SOLD">{t("statusSold")}</SelectItem>
                                <SelectItem value="PENDING">{t("statusPending")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="paymentStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("paymentStatus")}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || "PAID"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="PAID">{t("paymentStatusPaid")}</SelectItem>
                                <SelectItem value="DUE">{t("paymentStatusDue")}</SelectItem>
                                <SelectItem value="PARTIAL">{t("paymentStatusPartial")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="paidAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("paidAmount")}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
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
                  </>
                )}

                {!isEdit && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("status")}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || "DRAFT"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="DRAFT">{t("statusDraft")}</SelectItem>
                                <SelectItem value="SOLD">{t("statusSold")}</SelectItem>
                                <SelectItem value="PENDING">{t("statusPending")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="paymentStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("paymentStatus")}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || "PAID"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="PAID">{t("paymentStatusPaid")}</SelectItem>
                                <SelectItem value="DUE">{t("paymentStatusDue")}</SelectItem>
                                <SelectItem value="PARTIAL">{t("paymentStatusPartial")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="paidAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("paidAmount")}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
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

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">{t("items")}</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addItem}>
                          <Plus className="mr-2 h-4 w-4" />
                          {t("addItem")}
                        </Button>
                      </div>

                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="p-4 border rounded-lg space-y-4 bg-muted/50"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{t("item")} {index + 1}</h4>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(index)}
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>

                          {/* Product Selection */}
                          <FormField
                            control={form.control}
                            name={`items.${index}.itemName` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("itemName")} / {t("product") || "Product"}</FormLabel>
                                <FormControl>
                                  <div className="space-y-2">
                                    <div className="relative">
                                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                      <Input
                                        placeholder={t("searchPlaceholder") || "Search products..."}
                                        value={productSearchQueries[index] || ""}
                                        onChange={(e) => {
                                          setProductSearchQueries(prev => ({
                                            ...prev,
                                            [index]: e.target.value
                                          }))
                                        }}
                                        className="pl-9"
                                      />
                                    </div>
                                    <Select
                                      value={selectedProducts[index]?.id || ""}
                                      onValueChange={(productId) => {
                                        const product = products.find(p => p.id === productId)
                                        if (product) {
                                          // Check if product is in stock
                                          if (!isProductInStock(product)) {
                                            form.setError(`items.${index}.itemName` as any, {
                                              type: "manual",
                                              message: "This product is out of stock"
                                            })
                                            return
                                          }
                                          
                                          setSelectedProducts(prev => ({ ...prev, [index]: product }))
                                          setSelectedVariants(prev => ({ ...prev, [index]: null }))
                                          
                                          // Auto-fill item fields
                                          field.onChange(product.name)
                                          form.setValue(`items.${index}.itemDescription` as any, product.description || "")
                                          form.setValue(`items.${index}.unit` as any, product.unit?.suffix || "")
                                          
                                          // Get price from stock if available, otherwise use product price
                                          // Priority: stock.salePrice > product.price (use ?? to handle 0 prices correctly)
                                          const stock = product.stocks?.find((s: any) => 
                                            s.branchId === (branchId || selectedBranchId)
                                          ) || stockMapBySku.get(product.id)
                                          
                                          const price = stock?.salePrice ?? product.price ?? 0
                                          form.setValue(`items.${index}.price` as any, price)
                                          
                                          // Set SKU - use first variant SKU if variable, or product barcode
                                          if (product.isVariable && product.productVariants && product.productVariants.length > 0) {
                                            // Don't set SKU yet, wait for variant selection
                                            form.setValue(`items.${index}.sku` as any, "")
                                          } else {
                                            const sku = stock?.sku || product.barcode || ""
                                            form.setValue(`items.${index}.sku` as any, sku)
                                          }
                                          
                                          // Set max quantity based on available stock
                                          const availableStock = getAvailableStock(product)
                                          if (product.manageStocks && availableStock > 0) {
                                            const currentQuantity = form.getValues(`items.${index}.quantity` as any) || 1
                                            if (currentQuantity > availableStock) {
                                              form.setValue(`items.${index}.quantity` as any, availableStock)
                                            }
                                          }
                                        }
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder={t("selectProduct") || "Select a product"} />
                                      </SelectTrigger>
                                      <SelectContent className="max-h-[300px]">
                                        {products
                                          .filter((p) => {
                                            const query = (productSearchQueries[index] || "").toLowerCase()
                                            if (!query) return true
                                            return p.name.toLowerCase().includes(query) ||
                                              p.barcode?.toLowerCase().includes(query) ||
                                              p.description?.toLowerCase().includes(query)
                                          })
                                          .map((product) => {
                                            const inStock = isProductInStock(product)
                                            const availableStock = getAvailableStock(product)
                                            return (
                                              <SelectItem 
                                                key={product.id} 
                                                value={product.id}
                                                disabled={product.manageStocks && !inStock}
                                              >
                                                <div className="flex items-center justify-between w-full">
                                                  <span className={product.manageStocks && !inStock ? "text-muted-foreground" : ""}>
                                                    {product.name}
                                                    {product.manageStocks && !inStock && " (Out of Stock)"}
                                                  </span>
                                                  <span className="text-xs text-muted-foreground ml-2">
                                                    {product.price} {product.unit?.suffix || ""}
                                                    {product.manageStocks && inStock && ` (Stock: ${availableStock})`}
                                                  </span>
                                                </div>
                                              </SelectItem>
                                            )
                                          })}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Variant Selection for Variable Products */}
                          {selectedProducts[index]?.isVariable && selectedProducts[index]?.productVariants && selectedProducts[index]!.productVariants!.length > 0 && (
                            <FormField
                              control={form.control}
                              name={`items.${index}.sku` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("variant") || "Variant"}</FormLabel>
                                  <Select
                                    value={selectedVariants[index]?.id || ""}
                                    onValueChange={(variantId) => {
                                      // Find variant from productVariants or variants array
                                      const product = selectedProducts[index]
                                      if (!product) return
                                      
                                      const variantRaw = (product.productVariants || product.variants || []).find((v: any) => v.id === variantId)
                                      if (!variantRaw) return
                                      
                                      // Ensure variant has productId for type safety
                                      const variant: ProductVariant = {
                                        ...variantRaw,
                                        productId: (variantRaw as any).productId || product.id,
                                        id: variantRaw.id || variantId,
                                        sku: variantRaw.sku || variantRaw.id || "",
                                        price: variantRaw.price ?? 0,
                                        variantName: variantRaw.variantName || "",
                                        unitId: variantRaw.unitId || product.unitId || "",
                                      }
                                      
                                      // Check if variant is in stock
                                      if (!isProductInStock(product, variant)) {
                                        form.setError(`items.${index}.sku` as any, {
                                          type: "manual",
                                          message: "This variant is out of stock"
                                        })
                                        return
                                      }
                                      
                                      setSelectedVariants(prev => ({ ...prev, [index]: variant }))
                                      
                                      // Update SKU
                                      field.onChange(variant.sku || "")
                                      
                                      // Update price from variant or stock
                                      // For variants: Priority is variant.price > stock.salePrice > product.price
                                      // IMPORTANT: Variant price should take priority over stock salePrice for variant-specific pricing
                                      const stock = (variant.sku ? stockMapBySku.get(variant.sku) : undefined) || 
                                                   (variant.id ? stockMapBySku.get(variant.id) : undefined) ||
                                                   product.stocks?.find((s: any) => 
                                                     s.branchId === (branchId || selectedBranchId) && s.sku === variant.sku
                                                   )
                                      
                                      // For variants: Use variant.price first (it's the specific price for this variant)
                                      // Only use stock.salePrice if variant.price is not set
                                      // Priority: variant.price > stock.salePrice > product.price
                                      const variantPrice = variant.price !== null && variant.price !== undefined ? variant.price : null
                                      const price = variantPrice ?? stock?.salePrice ?? product.price ?? 0
                                      
                                      // Debug log in development
                                      if (process.env.NODE_ENV === "development") {
                                        console.log("💰 Variant Price Selection:", {
                                          variantId: variant.id,
                                          variantName: variant.variantName,
                                          variantPrice: variant.price,
                                          variantPriceType: typeof variant.price,
                                          stockSalePrice: stock?.salePrice,
                                          productPrice: product.price,
                                          finalPrice: price
                                        })
                                      }
                                      
                                      form.setValue(`items.${index}.price` as any, price)
                                      
                                      // Update item name to include variant
                                      const itemName = `${product.name} - ${variant.variantName}`
                                      form.setValue(`items.${index}.itemName` as any, itemName)
                                      
                                      // Set max quantity based on available stock
                                      const availableStock = getAvailableStock(product, variant)
                                      if (product.manageStocks && availableStock > 0) {
                                        const currentQuantity = form.getValues(`items.${index}.quantity` as any) || 1
                                        if (currentQuantity > availableStock) {
                                          form.setValue(`items.${index}.quantity` as any, availableStock)
                                        }
                                      }
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={t("selectVariant") || "Select a variant"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {selectedProducts[index]?.productVariants?.map((variant) => {
                                        const inStock = isProductInStock(selectedProducts[index]!, variant)
                                        const availableStock = getAvailableStock(selectedProducts[index]!, variant)
                                        return (
                                          <SelectItem 
                                            key={variant.id} 
                                            value={variant.id}
                                            disabled={selectedProducts[index]!.manageStocks && !inStock}
                                          >
                                            <div className="flex items-center justify-between w-full">
                                              <span className={selectedProducts[index]!.manageStocks && !inStock ? "text-muted-foreground" : ""}>
                                                {variant.variantName}
                                                {selectedProducts[index]!.manageStocks && !inStock && " (Out of Stock)"}
                                              </span>
                                              <span className="text-xs text-muted-foreground ml-2">
                                                {variant.price} {variant.unit?.suffix || selectedProducts[index]?.unit?.suffix || ""}
                                                {selectedProducts[index]!.manageStocks && inStock && ` (Stock: ${availableStock})`}
                                              </span>
                                            </div>
                                          </SelectItem>
                                        )
                                      })}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          {/* SKU Field (read-only if product selected) */}
                          {(!selectedProducts[index] || (!selectedProducts[index]?.isVariable || selectedVariants[index])) && (
                            <FormField
                              control={form.control}
                              name={`items.${index}.sku` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("sku") || "SKU"}</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder={t("skuPlaceholder") || "SKU"} 
                                      {...field}
                                      readOnly={!!selectedProducts[index]}
                                      className={selectedProducts[index] ? "bg-muted" : ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`items.${index}.unit` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("unit")}</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder={t("unitPlaceholder")} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {units.map((unit) => (
                                        <SelectItem key={unit.id} value={unit.suffix}>
                                          {unit.name} ({unit.suffix})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`items.${index}.itemDescription` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("itemDescription")}</FormLabel>
                                <FormControl>
                                  <Input placeholder={t("itemDescriptionPlaceholder")} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`items.${index}.price` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("price")}</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      placeholder="0.00"
                                      {...field}
                                      value={field.value || ""}
                                      onChange={(e) =>
                                        field.onChange(parseFloat(e.target.value) || 0)
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity` as any}
                              render={({ field }) => {
                                const product = selectedProducts[index]
                                const variant = selectedVariants[index]
                                const availableStock = product ? getAvailableStock(product, variant) : Infinity
                                const maxQuantity = product?.manageStocks ? availableStock : undefined
                                
                                return (
                                  <FormItem>
                                    <FormLabel>{t("quantity")}</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="1"
                                        min="1"
                                        max={maxQuantity}
                                        placeholder="1"
                                        {...field}
                                        value={field.value || ""}
                                        onChange={(e) => {
                                          const value = parseInt(e.target.value) || 1
                                          if (product?.manageStocks && value > availableStock) {
                                            form.setError(`items.${index}.quantity` as any, {
                                              type: "manual",
                                              message: `Only ${availableStock} available in stock`
                                            })
                                            return
                                          }
                                          field.onChange(value)
                                        }}
                                      />
                                    </FormControl>
                                    {product?.manageStocks && (
                                      <p className="text-xs text-muted-foreground">
                                        Available: {availableStock}
                                      </p>
                                    )}
                                    <FormMessage />
                                  </FormItem>
                                )
                              }}
                            />

                            <div className="space-y-2">
                              <Label className="text-sm font-medium">{t("totalPrice") || "Total"}</Label>
                              <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">
                                {calculateItemTotal(form.watch(`items.${index}` as any)).toFixed(2)}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`items.${index}.discountType` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("discountType") || "Discount Type"}</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || "NONE"}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="NONE">{t("discountNone") || "None"}</SelectItem>
                                      <SelectItem value="PERCENTAGE">{t("discountPercentage") || "Percentage"}</SelectItem>
                                      <SelectItem value="FIXED">{t("discountFixed") || "Fixed"}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`items.${index}.discountAmount` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("discountAmount") || "Discount Amount"}</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      placeholder="0.00"
                                      {...field}
                                      value={field.value || ""}
                                      onChange={(e) =>
                                        field.onChange(parseFloat(e.target.value) || 0)
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}

                      {!isEdit && (
                        <div className="space-y-4 pt-4 border-t">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="discountType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("discountType") || "Sale Discount Type"}</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || "NONE"}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="NONE">{t("discountNone") || "None"}</SelectItem>
                                      <SelectItem value="PERCENTAGE">{t("discountPercentage") || "Percentage"}</SelectItem>
                                      <SelectItem value="FIXED">{t("discountFixed") || "Fixed"}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="discountAmount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("discountAmount") || "Sale Discount Amount"}</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      placeholder="0.00"
                                      {...field}
                                      value={field.value || ""}
                                      onChange={(e) =>
                                        field.onChange(parseFloat(e.target.value) || 0)
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}

                      {total !== null && (
                        <div className="flex justify-end pt-4 border-t">
                          <div className="text-right">
                            <Label className="text-sm text-muted-foreground">{t("total")}</Label>
                            <p className="text-2xl font-bold">{total.toFixed(2)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? tCommon("loading") : isEdit ? tCommon("save") : tCommon("create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
