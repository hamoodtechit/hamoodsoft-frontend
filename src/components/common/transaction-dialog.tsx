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
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { useContacts } from "@/lib/hooks/use-contacts"
import { useIncomeExpenseCategories } from "@/lib/hooks/use-income-expense-categories"
import { useCreateExpenseTransaction, useCreateIncomeTransaction } from "@/lib/hooks/use-transactions"
import {
  createExpenseTransactionSchema,
  createIncomeTransactionSchema,
  type CreateExpenseTransactionInput,
  type CreateIncomeTransactionInput,
} from "@/lib/validations/transactions"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "INCOME" | "EXPENSE"
  defaultAccountId?: string
  defaultContactId?: string
  defaultCategoryId?: string
}

export function TransactionDialog({
  open,
  onOpenChange,
  type,
  defaultAccountId,
  defaultContactId,
  defaultCategoryId,
}: TransactionDialogProps) {
  const t = useTranslations("transactions")
  const tCommon = useTranslations("common")
  const createIncomeMutation = useCreateIncomeTransaction()
  const createExpenseMutation = useCreateExpenseTransaction()
  const { data: accountsData } = useAccounts({ limit: 1000 })
  const accounts = accountsData?.items ?? []
  const { data: contactsData } = useContacts({ limit: 1000 })
  const contacts = contactsData?.items ?? []
  const { data: categoriesData } = useIncomeExpenseCategories({ 
    limit: 1000,
    type,
    isActive: true 
  })
  const categories = categoriesData?.items ?? []
 
  const { selectedBranchId } = useBranchSelection()

  const isIncome = type === "INCOME"
  const isLoading = isIncome ? createIncomeMutation.isPending : createExpenseMutation.isPending

  const defaultValues = useMemo(() => {
    if (isIncome) {
      return {
        accountId: defaultAccountId || "",
        contactId: defaultContactId,
        categoryId: defaultCategoryId,
        amount: 0,
        occurredAt: new Date().toISOString(),
        note: "",
      } as CreateIncomeTransactionInput
    } else {
      return {
        accountId: defaultAccountId || "",
        contactId: defaultContactId,
        categoryId: defaultCategoryId,
        amount: 0,
        paidAmount: 0,
        occurredAt: new Date().toISOString(),
        note: "",
      } as CreateExpenseTransactionInput
    }
  }, [isIncome, defaultAccountId, defaultContactId, defaultCategoryId])

  const form = useForm<CreateIncomeTransactionInput | CreateExpenseTransactionInput>({
    resolver: zodResolver(isIncome ? createIncomeTransactionSchema : createExpenseTransactionSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
    }
  }, [open, defaultValues, form])

  const onSubmit = async (data: CreateIncomeTransactionInput | CreateExpenseTransactionInput) => {
    try {
      // Automatically add branchId from selected branch
      const submitData = {
        ...data,
        branchId: selectedBranchId || undefined,
      }
      
      if (isIncome) {
        await createIncomeMutation.mutateAsync(submitData as CreateIncomeTransactionInput)
      } else {
        await createExpenseMutation.mutateAsync(submitData as CreateExpenseTransactionInput)
      }
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
          <DialogTitle>{isIncome ? t("createIncome") : t("createExpense")}</DialogTitle>
          <DialogDescription>
            {isIncome ? t("createIncomeDescription") : t("createExpenseDescription")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="contactId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contact")} ({tCommon("optional")})</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value === "none" ? undefined : value)
                    }}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("contactPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">{tCommon("none")} ({tCommon("optional")})</SelectItem>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name} ({contact.type})
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
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("category")} ({tCommon("optional")})</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value === "none" ? undefined : value)
                    }}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("categoryPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">{tCommon("none")} ({tCommon("optional")})</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
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

            {!isIncome && (
              <FormField
                control={form.control}
                name="paidAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("paidAmount")} ({tCommon("optional")})</FormLabel>
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
            )}

            <FormField
              control={form.control}
              name="occurredAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("occurredAt")} ({tCommon("optional")})</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                      onChange={(e) => {
                        const value = e.target.value
                        field.onChange(value ? new Date(value).toISOString() : undefined)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("note")} ({tCommon("optional")})</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("notePlaceholder")}
                      rows={3}
                    />
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
                {isLoading ? tCommon("creating") : tCommon("create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
