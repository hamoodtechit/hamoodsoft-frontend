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
import { useBranches } from "@/lib/hooks/use-branches"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { useContacts } from "@/lib/hooks/use-contacts"
import { useCreatePurchase, useUpdatePurchase } from "@/lib/hooks/use-purchases"
import { useUnits } from "@/lib/hooks/use-units"
import { cn } from "@/lib/utils"
import {
  createPurchaseSchema,
  updatePurchaseSchema,
  type CreatePurchaseInput,
  type UpdatePurchaseInput,
} from "@/lib/validations/purchases"
import { Purchase } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { Minus, Package, Plus, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo } from "react"
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
            itemName: "",
            itemDescription: "",
            unit: "",
            price: 0,
            quantity: 1,
          },
        ],
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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items" as any,
  })

  // Watch paidAmount to auto-calculate dueAmount in edit mode
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
            itemName: "",
            itemDescription: "",
            unit: "",
            price: 0,
            quantity: 1,
          },
        ])
        // Auto-select branch if available
        if (selectedBranchId) {
          form.setValue("branchId", selectedBranchId)
        }
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

    createMutation.mutate(data as CreatePurchaseInput, {
      onSuccess: () => {
        onOpenChange(false)
        form.reset(defaultValues)
      },
    })
  }

  const addItem = () => {
    append({
      itemName: "",
      itemDescription: "",
      unit: "",
      price: 0,
      quantity: 1,
    })
  }

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const calculateTotal = () => {
    if (isEdit) return null
    const items = form.watch("items" as any) || []
    return items.reduce((sum: number, item: any) => {
      return sum + (item.price || 0) * (item.quantity || 0)
    }, 0)
  }

  const total = calculateTotal()

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
                      <div className="p-4 border rounded-lg bg-primary/5">
                        <div className="flex items-center justify-between text-lg font-semibold">
                          <span>{t("total")}:</span>
                          <span>{total.toFixed(2)}</span>
                        </div>
                      </div>
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
