"use client"

import { DataTable, type Column } from "@/components/common/data-table"
import { PageLayout } from "@/components/common/page-layout"
import { TransactionDialog } from "@/components/common/transaction-dialog"
import { Pagination } from "@/components/common/pagination"
import { SkeletonList } from "@/components/skeletons/skeleton-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { useTransactions } from "@/lib/hooks/use-transactions"
import { useAccounts } from "@/lib/hooks/use-accounts"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { useHasModuleAccess, useHasPermission } from "@/lib/hooks/use-permissions"
import { PermissionGuard } from "@/components/common/permission-guard"
import { PERMISSIONS, MODULES } from "@/lib/utils/permissions"
import { useModuleAccessCheck } from "@/lib/hooks/use-permission-check"
import { formatCurrency } from "@/lib/utils/currency"
import { Transaction } from "@/types"
import { Eye, Plus, TrendingDown, MoreVertical, Search } from "lucide-react"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  // Permission checks
  const { hasAccess, isLoading: isCheckingAccess } = useModuleAccessCheck(MODULES.ACCOUNTING)
  const canCreate = useHasPermission(PERMISSIONS.TRANSACTIONS_CREATE)

  // Check if user has access to accounting module
  useEffect(() => {
    if (!isCheckingAccess && !hasAccess) {
      router.push(`/${locale}/dashboard`)
    }
  }, [hasAccess, isCheckingAccess, locale, router])

  // Fetch all transactions and filter for expense
  const { data: transactionsData, isLoading } = useTransactions({ limit: 1000 })
  const allTransactions = transactionsData?.items ?? []
  
  const { data: accountsData } = useAccounts()
  const accounts = accountsData?.items ?? []

  // Filter transactions for expense type
  const expenseTransactions = useMemo(() => {
    return allTransactions.filter((t: Transaction) => {
      const category = (t as any).category
      if (category !== "EXPENSE") return false
      
      if (selectedAccountId !== "all" && t.accountId !== selectedAccountId) {
        return false
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchNote = t.note?.toLowerCase().includes(query)
        const matchAccount = t.account?.name?.toLowerCase().includes(query)
        const matchContact = t.contact?.name?.toLowerCase().includes(query)
        const matchAmount = t.amount?.toString().includes(query)
        
        if (!matchNote && !matchAccount && !matchContact && !matchAmount) {
          return false
        }
      }
      
      return true
    })
  }, [allTransactions, selectedAccountId, searchQuery])

  // Find transaction details
  const transactionDetails = useMemo(() => {
    if (!viewTransactionId) return null
    return allTransactions.find((t: Transaction) => t.id === viewTransactionId) || null
  }, [viewTransactionId, allTransactions])

  const totalItems = expenseTransactions.length
  const totalPages = Math.ceil(totalItems / limit) || 1
  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * limit
    return expenseTransactions.slice(start, start + limit)
  }, [expenseTransactions, page, limit])

  // Table columns configuration
  const tableColumns: Column<Transaction>[] = useMemo(() => [
    {
      id: "date",
      header: tCommon("date") || "Date",
      cell: (row) => row.occurredAt ? new Date(row.occurredAt).toLocaleDateString() : "-",
      sortable: true,
      accessorKey: "occurredAt",
    },
    {
      id: "type",
      header: tCommon("type") || "Type",
      cell: (row) => (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="destructive">Expense</Badge>
          {(row as any).incomeExpenseCategory?.name && (
            <Badge variant="outline" className="text-xs">
              {(row as any).incomeExpenseCategory.name}
            </Badge>
          )}
          {!((row as any).incomeExpenseCategory?.name) && (row as any).category && (
            <Badge variant="outline" className="text-xs">
              {(row as any).category}
            </Badge>
          )}
        </div>
      ),
      sortable: false,
    },
    {
      id: "account",
      header: t("account") || "Account",
      cell: (row) => row.account?.name || "-",
      sortable: false,
    },
    {
      id: "contact",
      header: t("contact") || "Contact",
      cell: (row) => row.contact?.name || "-",
      sortable: false,
    },
    {
      id: "note",
      header: t("note") || "Note",
      accessorKey: "note",
      sortable: false,
      cell: (row) => row.note ? <span className="line-clamp-1 max-w-[200px]" title={row.note}>{row.note}</span> : "-",
    },
    {
      id: "amount",
      header: tCommon("amount") || "Amount",
      accessorKey: "amount",
      cell: (row) => (
        <span className="font-semibold text-red-600">
          -{formatCurrency(row.amount, { generalSettings })}
        </span>
      ),
      sortable: true,
    },
  ], [t, tCommon, generalSettings])

  // Show loading while checking permissions
  if (isCheckingAccess) {
    return (
      <PageLayout title="Expense" description="Manage expense transactions" maxWidth="full">
        <SkeletonList count={5} />
      </PageLayout>
    )
  }

  if (!hasAccess) {
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
            <PermissionGuard permission={PERMISSIONS.TRANSACTIONS_CREATE}>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createExpense") || "Create Expense"}
              </Button>
            </PermissionGuard>
          </div>
          
          <div className="flex flex-col gap-4 mt-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by note, account, contact, or amount..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                className="pl-9"
              />
            </div>
            <div className="w-full sm:w-[200px]">
              <Select value={selectedAccountId} onValueChange={(val) => {
                setSelectedAccountId(val)
                setPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <div className="space-y-4">
              <div className="rounded-md border">
                <DataTable
                  data={paginatedTransactions}
                  columns={tableColumns}
                  onRowClick={(row) => {
                    setViewTransactionId(row.id)
                    setIsTransactionDetailsOpen(true)
                  }}
                  actions={(row) => (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setViewTransactionId(row.id)
                          setIsTransactionDetailsOpen(true)
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          {tCommon("viewDetails") || "View Details"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  emptyMessage={t("noTransactions") || "No expense transactions found"}
                />
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(newLimit) => {
                  setLimit(newLimit)
                  setPage(1)
                }}
              />
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
