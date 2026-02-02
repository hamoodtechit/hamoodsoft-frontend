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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAccounts, useCreateAccount, useUpdateAccount } from "@/lib/hooks/use-accounts"
import {
  createAccountSchema,
  updateAccountSchema,
  type CreateAccountInput,
  type UpdateAccountInput,
} from "@/lib/validations/accounts"
import { Account } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"

interface AccountDialogProps {
  account: Account | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountDialog({ account, open, onOpenChange }: AccountDialogProps) {
  const t = useTranslations("accounts")
  const tCommon = useTranslations("common")
  const createMutation = useCreateAccount()
  const updateMutation = useUpdateAccount()

  const isEdit = !!account
  const isLoading = createMutation.isPending || updateMutation.isPending

  const schema = isEdit ? updateAccountSchema : createAccountSchema

  const defaultValues = useMemo(() => {
    if (!account) {
      return {
        name: "",
        type: "CASH" as const,
        description: "",
        openingBalance: 0,
      }
    }
    return {
      name: account.name || "",
      type: account.type || ("CASH" as const),
      description: account.description || "",
      isActive: account.isActive ?? true,
    }
  }, [account])

  const form = useForm<CreateAccountInput | UpdateAccountInput>({
    resolver: zodResolver(schema as any),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
    }
  }, [open, defaultValues, form])

  const onSubmit = async (data: CreateAccountInput | UpdateAccountInput) => {
    try {
      if (isEdit && account) {
        await updateMutation.mutateAsync({
          id: account.id,
          data: data as UpdateAccountInput,
        })
      } else {
        await createMutation.mutateAsync(data as CreateAccountInput)
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
          <DialogTitle>{isEdit ? t("editAccount") : t("createAccount")}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("editAccountDescription")
              : t("createAccountDescription")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("namePlaceholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      <SelectItem value="CASH">{t("typeCash") || "Cash"}</SelectItem>
                      <SelectItem value="BANK">{t("typeBank") || "Bank"}</SelectItem>
                      <SelectItem value="WALLET">{t("typeWallet") || "Wallet"}</SelectItem>
                      <SelectItem value="ASSET">{t("typeAsset") || "Asset"}</SelectItem>
                      <SelectItem value="LIABILITY">{t("typeLiability") || "Liability"}</SelectItem>
                      <SelectItem value="EQUITY">{t("typeEquity") || "Equity"}</SelectItem>
                      <SelectItem value="INCOME">{t("typeIncome") || "Income"}</SelectItem>
                      <SelectItem value="EXPENSE">{t("typeExpense") || "Expense"}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEdit && (
              <FormField
                control={form.control}
                name="openingBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("openingBalance")}</FormLabel>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("descriptionPlaceholder")}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEdit && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t("isActive")}</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            )}

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
                {isLoading
                  ? tCommon("saving")
                  : isEdit
                    ? tCommon("update")
                    : tCommon("create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
