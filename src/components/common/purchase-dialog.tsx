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
import { useAccounts } from "@/lib/hooks/use-accounts"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { useBranches } from "@/lib/hooks/use-branches"
import { useContacts } from "@/lib/hooks/use-contacts"
import { useProducts } from "@/lib/hooks/use-products"
import { useCreatePurchase, useUpdatePurchase } from "@/lib/hooks/use-purchases"
import { useUnits } from "@/lib/hooks/use-units"
import {
  createPurchaseSchema,
  updatePurchaseSchema,
  type CreatePurchaseInput,
  type UpdatePurchaseInput,
} from "@/lib/validations/purchases"
import { Purchase } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { Package, Plus, Search, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"

interface PurchaseDialogProps {
  purchase: Purchase | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PurchaseDialog({ purchase, open, onOpenChange }: PurchaseDialogProps) {
  const t = useTranslations("purchases")
  const tCommon = useTranslations("common")
  const { data: branches = [] } = useBranches()
  const { selectedBranchId } = useBranchSelection()
  const { data: units = [] } = useUnits(selectedBranchId || undefined)
  const { data: contactsData } = useContacts()
  const contacts = contactsData?.items || []
  const { data: accountsData } = useAccounts({ limit: 1000 })
  const accounts = accountsData?.items?.filter(acc => acc.isActive) || []
  const createMutation = useCreatePurchase()
  const updateMutation = useUpdatePurchase()

  const isEdit = !!purchase
  const isLoading = createMutation.isPending || updateMutation.isPending

  const schema = isEdit ? updatePurchaseSchema : createPurchaseSchema

  const defaultValues = useMemo(() => {
    if (!purchase) {
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
        status: "ORDERED" as const,
        paymentStatus: "DUE" as const,
        paidAmount: 0,
        totalPrice: 0,
        discountType: "NONE" as const,
        discountAmount: 0,
      }
    }
    // For update, only include fields that can be updated
    return {
      branchId: purchase.branchId || selectedBranchId || "",
      contactId: purchase.contactId || "",
      status: purchase.status || "PENDING",
      paidAmount: purchase.paidAmount || 0,
      dueAmount: purchase.dueAmount || 0,
    }
  }, [purchase, selectedBranchId])

  const form = useForm<CreatePurchaseInput | UpdatePurchaseInput>({
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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items" as any,
  })
  
  // Track selected products for each item
  const [selectedProducts, setSelectedProducts] = useState<Record<number, any | null>>({})
  const [productSearchQueries, setProductSearchQueries] = useState<Record<number, string>>({})
  
  // Payment method and account selection
  type PaymentMethod = "CASH" | "CARD" | "CREDIT" | "MIXED"
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH")
  const [cashAccountId, setCashAccountId] = useState<string>("")
  const [bankAccountId, setBankAccountId] = useState<string>("")
  
  // Payment splits for MIXED payment method
  interface PaymentSplit {
    id: string
    accountId: string
    amount: number
  }
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([])

  // Watch paidAmount to auto-calculate dueAmount in edit mode
  const paidAmount = useWatch({
    control: form.control,
    name: "paidAmount" as any,
  })

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
      if (!isEdit) {
        // Reset items array for create with all required fields
        form.setValue("items" as any, [
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
        ])
        // Set initial totalPrice
        form.setValue("totalPrice" as any, 0, { shouldValidate: false })
        // Auto-select branch if available
        if (selectedBranchId) {
          form.setValue("branchId", selectedBranchId)
        }
        // Reset product selections
        setSelectedProducts({})
        setProductSearchQueries({})
        // Reset payment method and accounts
        setPaymentMethod("CASH")
        setCashAccountId("")
        setBankAccountId("")
        setPaymentSplits([])
      }
    }
  }, [open, defaultValues, form, isEdit, selectedBranchId])

  // Auto-calculate dueAmount when paidAmount changes in edit mode
  useEffect(() => {
    if (isEdit && purchase && paidAmount !== undefined) {
      const totalAmount = purchase.totalPrice || purchase.totalAmount || 0
      const newPaidAmount = paidAmount || 0
      const newDueAmount = Math.max(0, totalAmount - newPaidAmount)
      form.setValue("dueAmount" as any, newDueAmount, { shouldValidate: false })
    }
  }, [paidAmount, isEdit, purchase, form])

  const onSubmit = (data: CreatePurchaseInput | UpdatePurchaseInput) => {
    console.log("Purchase form submitted", data)
    
    if (isEdit && purchase) {
      updateMutation.mutate(
        { id: purchase.id, data: data as UpdatePurchaseInput },
        {
          onSuccess: () => {
            onOpenChange(false)
          },
        }
      )
      return
    }

    // Calculate item totals and purchase total (same as sales)
    const items = (data as CreatePurchaseInput).items || []
    const calculatedItems = items.map((item: any, index: number) => {
      // Ensure SKU is set (required field)
      if (!item.sku || item.sku.trim() === "") {
        item.sku = `SKU-${Date.now()}-${index}`
      }
      
      // Ensure discount fields have defaults
      const discountType = item.discountType || "NONE"
      const discountAmount = item.discountAmount || 0
      
      const baseTotal = (item.price || 0) * (item.quantity || 0)
      let itemTotal = baseTotal
      
      if (discountType === "PERCENTAGE" && discountAmount) {
        itemTotal = baseTotal * (1 - discountAmount / 100)
      } else if (discountType === "FIXED" && discountAmount) {
        itemTotal = Math.max(0, baseTotal - discountAmount)
      }
      
      return {
        ...item,
        sku: item.sku,
        discountType,
        discountAmount,
        totalPrice: itemTotal,
      }
    })

    const itemsTotal = calculatedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
    const purchaseDiscountType = (data as any).discountType || "NONE"
    const purchaseDiscountAmount = (data as any).discountAmount || 0
    
    let purchaseTotal = itemsTotal
    if (purchaseDiscountType === "PERCENTAGE" && purchaseDiscountAmount) {
      purchaseTotal = itemsTotal * (1 - purchaseDiscountAmount / 100)
    } else if (purchaseDiscountType === "FIXED" && purchaseDiscountAmount) {
      purchaseTotal = Math.max(0, itemsTotal - purchaseDiscountAmount)
    }

    // Build payments array based on payment method (same as sales)
    const payments: Array<{ 
      type: "PURCHASE_PAYMENT"
      accountId: string
      amount: number
      branchId?: string
      contactId?: string
      note?: string
    }> = []
    const totalAmount = purchaseTotal
    
    if (paymentMethod === "CASH" && cashAccountId) {
      payments.push({
        accountId: cashAccountId,
        amount: totalAmount,
        type: "PURCHASE_PAYMENT",
        branchId: (data as CreatePurchaseInput).branchId,
        contactId: (data as CreatePurchaseInput).contactId,
      })
    } else if (paymentMethod === "CARD" && bankAccountId) {
      payments.push({
        accountId: bankAccountId,
        amount: totalAmount,
        type: "PURCHASE_PAYMENT",
        branchId: (data as CreatePurchaseInput).branchId,
        contactId: (data as CreatePurchaseInput).contactId,
      })
    } else if (paymentMethod === "MIXED" && paymentSplits.length > 0) {
      // Use payment splits
      paymentSplits.forEach(split => {
        if (split.accountId && split.amount > 0) {
          payments.push({
            accountId: split.accountId,
            amount: split.amount,
            type: "PURCHASE_PAYMENT",
            branchId: (data as CreatePurchaseInput).branchId,
            contactId: (data as CreatePurchaseInput).contactId,
          })
        }
      })
    }
    // CREDIT payment method doesn't add any payment (paymentStatus will be DUE)

    // Determine payment status and paid amount
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    let paymentStatus: "PAID" | "DUE" | "PARTIAL" = "DUE"
    if (totalPaid >= totalAmount) {
      paymentStatus = "PAID"
    } else if (totalPaid > 0) {
      paymentStatus = "PARTIAL"
    }

    const purchaseData: any = {
      ...(data as CreatePurchaseInput),
      items: calculatedItems,
      payments: payments.length > 0 ? payments : undefined,
      totalPrice: purchaseTotal,
      paidAmount: totalPaid,
      paymentStatus,
    }
    
    createMutation.mutate(purchaseData, {
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
        const reindexed: Record<number, any> = {}
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
    if (!item || typeof item !== 'object') {
      return 0
    }
    
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

  const calculateTotal = () => {
    if (isEdit) return null
    const items = form.watch("items" as any) || []
    const purchaseDiscountType = form.watch("discountType" as any) || "NONE"
    const purchaseDiscountAmount = form.watch("discountAmount" as any) || 0
    
    const itemsTotal = items.reduce((sum: number, item: any) => {
      return sum + calculateItemTotal(item)
    }, 0)
    
    let discount = 0
    if (purchaseDiscountType === "PERCENTAGE") {
      discount = (itemsTotal * purchaseDiscountAmount) / 100
    } else if (purchaseDiscountType === "FIXED") {
      discount = purchaseDiscountAmount
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
    if (!isEdit) {
      watchedItems.forEach((item: any, index: number) => {
        const itemTotal = calculateItemTotal(item)
        form.setValue(`items.${index}.totalPrice` as any, itemTotal, { shouldValidate: false })
      })
    }
  }, [watchedItems, form, isEdit])

  // Update purchase totalPrice when items or discount change
  useEffect(() => {
    if (!isEdit && total !== null) {
      form.setValue("totalPrice" as any, total, { shouldValidate: false })
    }
  }, [total, form, isEdit])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isEdit ? t("editPurchase") : t("createPurchase")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.log("Form validation errors:", errors)
            })} 
            className="flex flex-col flex-1 min-h-0"
          >
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
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("status")}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || "PENDING"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PENDING">{t("statusPending")}</SelectItem>
                              <SelectItem value="COMPLETED">{t("statusCompleted")}</SelectItem>
                              <SelectItem value="CANCELLED">{t("statusCancelled")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
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

                      <FormField
                        control={form.control}
                        name="dueAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("dueAmount")}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...field}
                                value={field.value || ""}
                                readOnly
                                className="bg-muted cursor-not-allowed"
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground">
                              {t("dueAmountAutoCalculated")}
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {!isEdit && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">{t("items")}</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addItem}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("selectItem") || t("addItem")}
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
                                        setSelectedProducts(prev => ({ ...prev, [index]: product }))
                                        
                                        // Auto-fill item fields
                                        field.onChange(product.name)
                                        // Set SKU from product barcode or generate one
                                        const sku = product.barcode || `SKU-${product.id}`
                                        form.setValue(`items.${index}.sku` as any, sku)
                                        form.setValue(`items.${index}.itemDescription` as any, product.description || "")
                                        form.setValue(`items.${index}.unit` as any, product.unit?.suffix || "")
                                        
                                        // Get price from product
                                        const price = product.price ?? 0
                                        form.setValue(`items.${index}.price` as any, price)
                                        
                                        // Set default discount values
                                        form.setValue(`items.${index}.discountType` as any, "NONE")
                                        form.setValue(`items.${index}.discountAmount` as any, 0)
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
                                        .map((product) => (
                                          <SelectItem key={product.id} value={product.id}>
                                            <div className="flex items-center justify-between w-full">
                                              <span>{product.name}</span>
                                              <span className="text-xs text-muted-foreground ml-2">
                                                {product.price} {product.unit?.suffix || ""}
                                              </span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

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
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("quantity")}</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    placeholder="1"
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) =>
                                      field.onChange(parseInt(e.target.value) || 1)
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="text-sm text-muted-foreground">
                          {t("subtotal")}:{" "}
                          {((form.watch(`items.${index}.price` as any) || 0) *
                            (form.watch(`items.${index}.quantity` as any) || 0)).toFixed(2)}
                        </div>
                      </div>
                    ))}

                    {total !== null && (
                      <>
                        {/* Payment Method Selection */}
                        <div className="space-y-4 pt-4 border-t">
                          <Label className="text-base font-medium">{t("paymentMethod")}</Label>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              type="button"
                              variant={paymentMethod === "CASH" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPaymentMethod("CASH")}
                              className="text-xs"
                            >
                              Cash
                            </Button>
                            <Button
                              type="button"
                              variant={paymentMethod === "CARD" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPaymentMethod("CARD")}
                              className="text-xs"
                            >
                              Card
                            </Button>
                            <Button
                              type="button"
                              variant={paymentMethod === "CREDIT" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPaymentMethod("CREDIT")}
                              className="text-xs"
                            >
                              Credit
                            </Button>
                            <Button
                              type="button"
                              variant={paymentMethod === "MIXED" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPaymentMethod("MIXED")}
                              className="text-xs"
                            >
                              Mixed
                            </Button>
                          </div>

                          {/* Account Selection for CASH */}
                          {paymentMethod === "CASH" && accounts.length > 0 && (
                            <div className="space-y-2">
                              <Label className="text-sm">{t("account")}</Label>
                              <Select value={cashAccountId} onValueChange={setCashAccountId}>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("selectAccount")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {accounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                      {account.name} ({account.type})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Account Selection for CARD */}
                          {paymentMethod === "CARD" && accounts.length > 0 && (
                            <div className="space-y-2">
                              <Label className="text-sm">{t("account")}</Label>
                              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("selectAccount")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {accounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                      {account.name} ({account.type})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Payment Splits for MIXED */}
                          {paymentMethod === "MIXED" && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm">{t("paymentSplit")}</Label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setPaymentSplits([
                                      ...paymentSplits,
                                      {
                                        id: `split-${Date.now()}-${Math.random()}`,
                                        accountId: "",
                                        amount: 0,
                                      },
                                    ])
                                  }}
                                  className="h-7 text-xs"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  {t("addAccount")}
                                </Button>
                              </div>

                              {paymentSplits.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                  {t("noPaymentSplits")}
                                </p>
                              )}

                              {paymentSplits.map((split, index) => {
                                const totalAllocated = paymentSplits.reduce((sum, s) => sum + (s.amount || 0), 0)
                                return (
                                  <div key={split.id} className="flex gap-2 items-start">
                                    <div className="flex-1 space-y-1">
                                      <Select
                                        value={split.accountId}
                                        onValueChange={(value) => {
                                          const updated = [...paymentSplits]
                                          updated[index].accountId = value
                                          setPaymentSplits(updated)
                                        }}
                                      >
                                        <SelectTrigger className="h-9 text-xs">
                                          <SelectValue placeholder={t("selectAccount")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {accounts.map((account) => (
                                            <SelectItem key={account.id} value={account.id}>
                                              {account.name} ({account.type})
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Input
                                        type="number"
                                        value={split.amount || ""}
                                        onChange={(e) => {
                                          const updated = [...paymentSplits]
                                          const amount = Math.max(0, Math.min(Number(e.target.value), total))
                                          updated[index].amount = amount
                                          setPaymentSplits(updated)
                                        }}
                                        className="h-9 text-xs"
                                        placeholder="Amount"
                                        min={0}
                                        max={total}
                                        step="0.01"
                                      />
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setPaymentSplits(paymentSplits.filter((_, i) => i !== index))
                                      }}
                                      className="h-9 w-9 p-0"
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                )
                              })}

                              {paymentSplits.length > 0 && (
                                <div className="pt-2 border-t space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">{t("totalAllocated")}:</span>
                                    <span className="font-medium">
                                      {paymentSplits.reduce((sum, s) => sum + (s.amount || 0), 0).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">{t("remaining")}:</span>
                                    <span
                                      className={
                                        total - paymentSplits.reduce((sum, s) => sum + (s.amount || 0), 0) < 0
                                          ? "text-destructive font-medium"
                                          : "font-medium"
                                      }
                                    >
                                      {(total - paymentSplits.reduce((sum, s) => sum + (s.amount || 0), 0)).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="p-4 border rounded-lg bg-primary/5">
                          <div className="flex items-center justify-between text-lg font-semibold">
                            <span>{t("total")}:</span>
                            <span>{total.toFixed(2)}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
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
