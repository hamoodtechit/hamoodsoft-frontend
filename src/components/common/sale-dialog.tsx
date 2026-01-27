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
import { useCreateSale, useUpdateSale } from "@/lib/hooks/use-sales"
import { useUnits } from "@/lib/hooks/use-units"
import {
    createSaleSchema,
    updateSaleSchema,
    type CreateSaleInput,
    type UpdateSaleInput,
} from "@/lib/validations/sales"
import { Sale } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, ShoppingCart, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo } from "react"
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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items" as any,
  })

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
      }
    }
  }, [open, defaultValues, form, isEdit, selectedBranchId])

  const onSubmit = (data: CreateSaleInput | UpdateSaleInput) => {
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
  }

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index)
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

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`items.${index}.sku` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("sku") || "SKU"}</FormLabel>
                                  <FormControl>
                                    <Input placeholder={t("skuPlaceholder") || "SKU"} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`items.${index}.itemName` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("itemName")}</FormLabel>
                                  <FormControl>
                                    <Input placeholder={t("itemNamePlaceholder")} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

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
                                      step="1"
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
