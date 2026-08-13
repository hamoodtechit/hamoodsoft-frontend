"use client"

import * as React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Sale } from "@/types"
import { useReturnSale } from "@/lib/hooks/use-sales"
import { useAccounts } from "@/lib/hooks/use-accounts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const returnSaleSchema = z.object({
  accountId: z.string().optional(),
  items: z.array(
    z.object({
      originalItemId: z.string(),
      itemName: z.string(),
      quantity: z.number(),
      returnedQuantity: z.number().min(0, "Must be positive"),
      price: z.number(),
    })
  ).refine(data => data.some(item => item.returnedQuantity > 0), {
    message: "At least one item must have a returned quantity greater than 0",
    path: ["items"],
  }),
})

type ReturnSaleFormValues = z.infer<typeof returnSaleSchema>

interface ReturnSaleDialogProps {
  sale: Sale | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReturnSaleDialog({ sale, open, onOpenChange }: ReturnSaleDialogProps) {
  const returnMutation = useReturnSale()
  const { data: accounts } = useAccounts()
  const activeAccounts = accounts?.items?.filter(a => a.isActive) || []
  
  const form = useForm<ReturnSaleFormValues>({
    resolver: zodResolver(returnSaleSchema),
    defaultValues: {
      accountId: "",
      items: [],
    },
  })

  const { fields } = useFieldArray({
    control: form.control,
    name: "items",
  })

  // Reset form when sale changes
  React.useEffect(() => {
    if (sale && open) {
      form.reset({
        accountId: "",
        items: sale.items?.map(item => ({
          originalItemId: item.id,
          itemName: item.itemName,
          quantity: item.quantity,
          returnedQuantity: 0,
          price: ((item as any).totalPrice ?? (item.price * item.quantity)) / item.quantity,
        })) || [],
      })
    }
  }, [sale, open, form])

  const onSubmit = (data: ReturnSaleFormValues) => {
    if (!sale) return
    
    const totalRefund = data.items.reduce((sum, item) => sum + (item.price * item.returnedQuantity), 0)
    const saleTotal = (sale as any).totalPrice ?? 0
    const requiresRefundAccount = sale.paidAmount > (saleTotal - totalRefund)

    if (requiresRefundAccount && !data.accountId) {
      form.setError("accountId", { message: "Account is required for cash refund" })
      return
    }

    returnMutation.mutate(
      {
        id: sale.id,
        data: {
          accountId: requiresRefundAccount ? data.accountId : undefined,
          items: data.items
            .filter(item => item.returnedQuantity > 0)
            .map(item => ({
              originalItemId: item.originalItemId,
              returnedQuantity: item.returnedQuantity,
            })),
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
      }
    )
  }

  const items = form.watch("items")
  const totalRefund = items?.reduce((sum, item) => sum + (item.price * (item.returnedQuantity || 0)), 0) || 0
  const saleTotal = sale ? ((sale as any).totalPrice ?? 0) : 0
  const requiresRefundAccount = sale ? sale.paidAmount > (saleTotal - totalRefund) : false

  if (!sale) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Return Sale</DialogTitle>
              <DialogDescription>
                Specify the quantities to return for each item.
              </DialogDescription>
            </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 font-medium text-sm text-slate-500 mb-2 px-2">
                <div className="col-span-4">Item Name</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-right">Max Qty</div>
                <div className="col-span-4">Return Qty</div>
              </div>
              
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-4 items-center px-2">
                  <div className="col-span-4 truncate">{field.itemName}</div>
                  <div className="col-span-2 text-right">{field.price.toFixed(2)}</div>
                  <div className="col-span-2 text-right">{field.quantity}</div>
                  <div className="col-span-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.returnedQuantity`}
                      render={({ field: inputField }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max={field.quantity}
                              step="any"
                              {...inputField}
                              onChange={(e) => inputField.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Refund:</span>
                <span>{totalRefund.toFixed(2)}</span>
              </div>
              
              {requiresRefundAccount && (
                <FormField
                  control={form.control}
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Refund Account (Required)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account to refund from" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name} (Balance: {account.currentBalance})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={returnMutation.isPending || totalRefund <= 0}>
                {returnMutation.isPending ? "Processing..." : "Confirm Return"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
