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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAccounts } from "@/lib/hooks/use-accounts"
import { useCreatePayment } from "@/lib/hooks/use-payments"
import { usePurchases } from "@/lib/hooks/use-purchases"
import { useSales } from "@/lib/hooks/use-sales"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { formatCurrency } from "@/lib/utils/currency"
import { createPaymentSchema, type CreatePaymentInput } from "@/lib/validations/payments"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType?: "SALE_PAYMENT" | "PURCHASE_PAYMENT" | "DEPOSIT"
  defaultAccountId?: string
  defaultSaleId?: string
  defaultPurchaseId?: string
  defaultContactId?: string
  defaultBranchId?: string
  defaultAmount?: number
}

export function PaymentDialog({
  open,
  onOpenChange,
  defaultType,
  defaultAccountId,
  defaultSaleId,
  defaultPurchaseId,
  defaultContactId,
  defaultBranchId,
  defaultAmount,
}: PaymentDialogProps) {
  const t = useTranslations("payments")
  const tCommon = useTranslations("common")
  const createMutation = useCreatePayment()
  const { data: accountsData } = useAccounts({ limit: 1000 })
  const accounts = accountsData?.items ?? []
  const { generalSettings } = useAppSettings()

  const defaultValues = useMemo<CreatePaymentInput>(() => {
    return {
      type: defaultType || "DEPOSIT",
      accountId: defaultAccountId || "",
      amount: defaultAmount || 0,
      saleId: defaultSaleId,
      purchaseId: defaultPurchaseId,
      contactId: defaultContactId,
      branchId: defaultBranchId,
      occurredAt: new Date().toISOString().split("T")[0],
      notes: "",
    }
  }, [defaultType, defaultAccountId, defaultSaleId, defaultPurchaseId, defaultContactId, defaultBranchId, defaultAmount])

  const form = useForm<CreatePaymentInput>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues,
  })

  const paymentType = form.watch("type")
  
  // Fetch sales - will be used when payment type is SALE_PAYMENT
  const { data: salesData } = useSales({
    limit: 100,
    status: "SOLD", // Only show completed sales
  })
  const sales = salesData?.items ?? []
  // Fetch purchases - will be used when payment type is PURCHASE_PAYMENT
  const { data: purchasesData } = usePurchases({
    limit: 100,
    status: "COMPLETED", // Only show completed purchases
  })
  const purchases = purchasesData?.items ?? []

  const isLoading = createMutation.isPending

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
    }
  }, [open, defaultValues, form])

  const onSubmit = async (data: CreatePaymentInput) => {
    try {
      await createMutation.mutateAsync(data)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("createPayment")}</DialogTitle>
          <DialogDescription>{t("createPaymentDescription")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("type")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("typePlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SALE_PAYMENT">{t("typeSalePayment")}</SelectItem>
                      <SelectItem value="PURCHASE_PAYMENT">{t("typePurchasePayment")}</SelectItem>
                      <SelectItem value="DEPOSIT">{t("typeDeposit")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("account")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("accountPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts
                        .filter((acc) => acc.isActive)
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name} ({account.type})
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("amount")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="occurredAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("occurredAt")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {paymentType === "SALE_PAYMENT" && !defaultSaleId && (
              <FormField
                control={form.control}
                name="saleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("saleId")}</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        // Clear selection if "none" is selected
                        field.onChange(value === "none" ? undefined : value)
                      }}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("saleIdPlaceholder") || "Select a sale (Optional)"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{tCommon("none")} ({tCommon("optional")})</SelectItem>
                        {sales.map((sale) => (
                          <SelectItem key={sale.id} value={sale.id}>
                            {sale.invoiceNumber || sale.id} - {sale.contact?.name || "No Contact"} - {sale.totalAmount ? formatCurrency(sale.totalAmount, { generalSettings }) : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {paymentType === "PURCHASE_PAYMENT" && !defaultPurchaseId && (
              <FormField
                control={form.control}
                name="purchaseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("purchaseId")}</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        // Clear selection if "none" is selected
                        field.onChange(value === "none" ? undefined : value)
                      }}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("purchaseIdPlaceholder") || "Select a purchase (Optional)"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{tCommon("none")} ({tCommon("optional")})</SelectItem>
                        {purchases.map((purchase) => (
                          <SelectItem key={purchase.id} value={purchase.id}>
                            {purchase.poNumber || purchase.id} - {purchase.contact?.name || "No Contact"} - {purchase.totalPrice ? formatCurrency(purchase.totalPrice, { generalSettings }) : ""}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("notes")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder={t("notesPlaceholder")} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? tCommon("saving") : tCommon("create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
