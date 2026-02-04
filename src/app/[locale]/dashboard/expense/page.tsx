"use client"

import { PageLayout } from "@/components/common/page-layout"
import { TransactionDialog } from "@/components/common/transaction-dialog"
import { SkeletonList } from "@/components/skeletons/skeleton-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { useTransactions } from "@/lib/hooks/use-transactions"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { formatCurrency } from "@/lib/utils/currency"
import { Transaction } from "@/types"
import { Eye, Plus, TrendingDown } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

export default function ExpensePage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const currentBusiness = useCurrentBusiness()
  const t = useTranslations("transactions")
  const tCommon = useTranslations("common")
  const { generalSettings } = useAppSettings()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [viewTransactionId, setViewTransactionId] = useState<string | null>(null)
  const [isTransactionDetailsOpen, setIsTransactionDetailsOpen] = useState(false)

  // Check if user has access to accounting module
  useEffect(() => {
    if (currentBusiness && !currentBusiness.modules?.includes("accounting")) {
      router.push(`/${locale}/dashboard`)
    }
  }, [currentBusiness, locale, router])

  // Fetch all transactions and filter for expense
  const { data: transactionsData, isLoading } = useTransactions({ limit: 1000 })
  const allTransactions = transactionsData?.items ?? []

  // Filter transactions for expense type
  const expenseTransactions = useMemo(() => {
    return allTransactions.filter((t: Transaction) => {
      const normalizedType = t.type
      const rawType = (t as any).type
      return normalizedType === "EXPENSE" || rawType === "EXPENSE" || rawType === "EX"
    })
  }, [allTransactions])

  // Find transaction details
  const transactionDetails = useMemo(() => {
    if (!viewTransactionId) return null
    return allTransactions.find((t: Transaction) => t.id === viewTransactionId) || null
  }, [viewTransactionId, allTransactions])

  if (!currentBusiness?.modules?.includes("accounting")) {
    return (
      <PageLayout title="Access Denied" description="You don't have access to this module">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              You don't have access to the Accounting module. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Expense" description="Manage expense transactions" maxWidth="full">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/20">
                <TrendingDown className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>Expense Transactions</CardTitle>
                <CardDescription>
                  View and manage all expense transactions
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("createExpense") || "Create Expense"}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <SkeletonList count={5} />
          ) : expenseTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No expense transactions found
            </div>
          ) : (
            <div className="space-y-2">
              {expenseTransactions.map((transaction: Transaction) => (
                <div
                  key={transaction.id}
                  className="rounded-lg border p-3 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setViewTransactionId(transaction.id)
                    setIsTransactionDetailsOpen(true)
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="destructive">Expense</Badge>
                      {(transaction as any).incomeExpenseCategory?.name && (
                        <Badge variant="outline" className="text-xs">
                          {(transaction as any).incomeExpenseCategory.name}
                        </Badge>
                      )}
                      {!((transaction as any).incomeExpenseCategory?.name) && (transaction as any).category && (
                        <Badge variant="outline" className="text-xs">
                          {(transaction as any).category}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                      {transaction.account?.name && (
                        <p className="text-sm text-muted-foreground">
                          Account: <span className="font-medium">{transaction.account.name}</span>
                        </p>
                      )}
                      {transaction.contact?.name && (
                        <p className="text-sm text-muted-foreground">
                          Contact: <span className="font-medium">{transaction.contact.name}</span>
                        </p>
                      )}
                      {transaction.branch?.name && (
                        <p className="text-sm text-muted-foreground">
                          Branch: <span className="font-medium">{transaction.branch.name}</span>
                        </p>
                      )}
                      {transaction.note && (
                        <p className="text-sm text-muted-foreground mt-1">{transaction.note}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {transaction.occurredAt
                        ? new Date(transaction.occurredAt).toLocaleString()
                        : "-"}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <p className="font-semibold text-red-600">
                      -{formatCurrency(transaction.amount, { generalSettings })}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        setViewTransactionId(transaction.id)
                        setIsTransactionDetailsOpen(true)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        type="EXPENSE"
      />

      <Sheet open={isTransactionDetailsOpen} onOpenChange={setIsTransactionDetailsOpen}>
        <SheetContent
          side="bottom"
          className="w-full max-w-3xl mx-auto rounded-t-2xl sm:rounded-2xl sm:max-h-[90vh] overflow-hidden flex flex-col p-0"
        >
          <SheetHeader className="flex-shrink-0 px-6 pt-6 pb-4">
            <SheetTitle>{t("transactionDetails") || "Transaction Details"}</SheetTitle>
            <SheetDescription>
              {t("viewTransactionDetails") || "View complete transaction information"}
            </SheetDescription>
          </SheetHeader>
          {transactionDetails ? (
            <ScrollArea className="h-[calc(90vh-180px)] px-6 pb-6">
              <div className="space-y-4">
                  {/* Basic Information */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Type</div>
                          <div className="text-base">
                            <Badge variant="destructive">Expense</Badge>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Amount</div>
                          <div className="text-base font-semibold text-red-600">
                            {formatCurrency(transactionDetails.amount, { generalSettings })}
                          </div>
                        </div>
                        {(transactionDetails as any).paidAmount !== undefined && (
                          <div>
                            <div className="text-sm text-muted-foreground">Paid Amount</div>
                            <div className="text-base">
                              {formatCurrency((transactionDetails as any).paidAmount || 0, { generalSettings })}
                            </div>
                          </div>
                        )}
                        {transactionDetails.occurredAt && (
                          <div>
                            <div className="text-sm text-muted-foreground">Occurred At</div>
                            <div className="text-base">
                              {new Date(transactionDetails.occurredAt).toLocaleString()}
                            </div>
                          </div>
                        )}
                        {transactionDetails.note && (
                          <div className="col-span-2">
                            <div className="text-sm text-muted-foreground">Note</div>
                            <div className="text-base">{transactionDetails.note}</div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Category Information */}
                  {((transactionDetails as any).incomeExpenseCategory || (transactionDetails as any).category) && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Category Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Name</div>
                            <div className="text-base">
                              {(transactionDetails as any).incomeExpenseCategory?.name || (transactionDetails as any).category}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Account Information */}
                  {transactionDetails.account && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Account Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Name</div>
                            <div className="text-base">{transactionDetails.account.name}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Type</div>
                            <div className="text-base">{transactionDetails.account.type}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Balance</div>
                            <div className="text-base">
                              {formatCurrency(transactionDetails.account.currentBalance || 0, { generalSettings })}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Branch Information */}
                  {transactionDetails.branch && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Branch Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Name</div>
                            <div className="text-base">{transactionDetails.branch.name}</div>
                          </div>
                          {transactionDetails.branch.address && (
                            <div>
                              <div className="text-sm text-muted-foreground">Address</div>
                              <div className="text-base">{transactionDetails.branch.address}</div>
                            </div>
                          )}
                          {transactionDetails.branch.phone && (
                            <div>
                              <div className="text-sm text-muted-foreground">Phone</div>
                              <div className="text-base">{transactionDetails.branch.phone}</div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Contact Information */}
                  {transactionDetails.contact && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Contact Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Name</div>
                            <div className="text-base">{transactionDetails.contact.name}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Type</div>
                            <div className="text-base">{transactionDetails.contact.type}</div>
                          </div>
                          {transactionDetails.contact.email && (
                            <div>
                              <div className="text-sm text-muted-foreground">Email</div>
                              <div className="text-base">{transactionDetails.contact.email}</div>
                            </div>
                          )}
                          {transactionDetails.contact.phone && (
                            <div>
                              <div className="text-sm text-muted-foreground">Phone</div>
                              <div className="text-base">{transactionDetails.contact.phone}</div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Timestamps */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Timestamps</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {transactionDetails.createdAt && (
                          <div>
                            <div className="text-sm text-muted-foreground">Created At</div>
                            <div className="text-base">
                              {new Date(transactionDetails.createdAt).toLocaleString()}
                            </div>
                          </div>
                        )}
                        {transactionDetails.updatedAt && (
                          <div>
                            <div className="text-sm text-muted-foreground">Updated At</div>
                            <div className="text-base">
                              {new Date(transactionDetails.updatedAt).toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
          ) : (
            <div className="flex-1 flex items-center justify-center py-8 text-center text-muted-foreground px-6">
              {t("noTransactionDetails") || "No transaction details found"}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </PageLayout>
  )
}
