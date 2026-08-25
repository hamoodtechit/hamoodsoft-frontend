"use client"

import { NumericInput } from "@/components/ui/numeric-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { useAccounts, useTransferAccount } from "@/lib/hooks/use-accounts"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { formatCurrency } from "@/lib/utils/currency"
import {
  transferAccountSchema,
  type TransferAccountInput,
} from "@/lib/validations/accounts"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, ArrowRightLeft, Wallet } from "lucide-react"
import { useEffect, useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"

interface TransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultFromAccountId?: string
}

export function TransferDialog({
  open,
  onOpenChange,
  defaultFromAccountId,
}: TransferDialogProps) {
  const { data: accountsData } = useAccounts({ limit: 1000 })
  const accounts = useMemo(
    () => (accountsData?.items ?? []).filter((a) => a.isActive),
    [accountsData]
  )
  const { selectedBranchId } = useBranchSelection()
  const { generalSettings } = useAppSettings()
  const transferMutation = useTransferAccount()

  const defaultValues: TransferAccountInput = useMemo(
    () => ({
      fromAccountId: defaultFromAccountId || "",
      toAccountId: "",
      amount: 0,
      occurredAt: new Date().toISOString().split("T")[0],
      note: "",
    }),
    [defaultFromAccountId]
  )

  const form = useForm<TransferAccountInput>({
    resolver: zodResolver(transferAccountSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      form.reset({
        fromAccountId: defaultFromAccountId || "",
        toAccountId: "",
        amount: 0,
        occurredAt: new Date().toISOString().split("T")[0],
        note: "",
      })
    }
  }, [open, defaultFromAccountId, form])

  const watchedFromAccountId = useWatch({ control: form.control, name: "fromAccountId" })
  const watchedToAccountId = useWatch({ control: form.control, name: "toAccountId" })
  const watchedAmount = useWatch({ control: form.control, name: "amount" }) || 0

  const fromAccount = useMemo(
    () => accounts.find((a) => a.id === watchedFromAccountId),
    [accounts, watchedFromAccountId]
  )

  const toAccount = useMemo(
    () => accounts.find((a) => a.id === watchedToAccountId),
    [accounts, watchedToAccountId]
  )

  const isInsufficient = fromAccount
    ? (fromAccount.currentBalance ?? 0) < watchedAmount
    : false

  const onSubmit = async (data: TransferAccountInput) => {
    try {
      const submitData = {
        ...data,
        branchId: selectedBranchId || undefined,
        occurredAt: data.occurredAt ? new Date(data.occurredAt).toISOString() : new Date().toISOString(),
      }
      await transferMutation.mutateAsync(submitData)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      // Handled in mutation hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Transfer Balance</DialogTitle>
              <DialogDescription>
                Transfer funds directly between accounts with double-entry tracking.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Source Account */}
              <FormField
                control={form.control}
                name="fromAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Account <span className="text-destructive">*</span></FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val)
                        if (form.getValues("toAccountId") === val) {
                          form.setValue("toAccountId", "")
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            <div className="flex flex-col text-left">
                              <span className="font-medium">{acc.name}</span>
                              <span className="text-xs text-muted-foreground">
                                Bal: {formatCurrency(acc.currentBalance ?? 0, { generalSettings })} ({acc.type})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Destination Account */}
              <FormField
                control={form.control}
                name="toAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Account <span className="text-destructive">*</span></FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!watchedFromAccountId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts
                          .filter((acc) => acc.id !== watchedFromAccountId)
                          .map((acc) => (
                            <SelectItem key={acc.id} value={acc.id}>
                              <div className="flex flex-col text-left">
                                <span className="font-medium">{acc.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  Bal: {formatCurrency(acc.currentBalance ?? 0, { generalSettings })} ({acc.type})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Amount and Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transfer Amount <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <NumericInput
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="0.00"
                        min={0.01}
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
                    <FormLabel>Transfer Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Real-time Transfer Preview */}
            {fromAccount && toAccount && watchedAmount > 0 && (
              <Card className="bg-muted/40 border-dashed">
                <CardContent className="p-3.5 space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Balance Preview
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="space-y-0.5">
                      <div className="font-medium text-foreground">{fromAccount.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(fromAccount.currentBalance ?? 0, { generalSettings })} →{" "}
                        <span className={isInsufficient ? "text-destructive font-bold" : "text-foreground font-semibold"}>
                          {formatCurrency((fromAccount.currentBalance ?? 0) - watchedAmount, { generalSettings })}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mx-2" />
                    <div className="space-y-0.5 text-right">
                      <div className="font-medium text-foreground">{toAccount.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(toAccount.currentBalance ?? 0, { generalSettings })} →{" "}
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {formatCurrency((toAccount.currentBalance ?? 0) + watchedAmount, { generalSettings })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isInsufficient && (
                    <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                      ⚠️ Transfer amount exceeds available balance in {fromAccount.name}.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Note */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note / Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional note about this transfer..."
                      rows={2}
                      {...field}
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
                disabled={transferMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={transferMutation.isPending || isInsufficient}
                className="gap-2"
              >
                {transferMutation.isPending ? "Transferring..." : "Complete Transfer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
