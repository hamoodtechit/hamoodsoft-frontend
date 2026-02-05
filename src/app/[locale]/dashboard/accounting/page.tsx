"use client"

import { AccountDialog } from "@/components/common/account-dialog"
import { DataTable, type Column } from "@/components/common/data-table"
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog"
import { PageLayout } from "@/components/common/page-layout"
import { SkeletonList } from "@/components/skeletons/skeleton-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { useAccount, useAccountLedger, useAccounts, useUpdateAccount } from "@/lib/hooks/use-accounts"
import { useAuth } from "@/lib/hooks/use-auth"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { useTransactions } from "@/lib/hooks/use-transactions"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { useHasModuleAccess, useHasPermission } from "@/lib/hooks/use-permissions"
import { PermissionGuard } from "@/components/common/permission-guard"
import { PERMISSIONS, MODULES } from "@/lib/utils/permissions"
import { useModuleAccessCheck } from "@/lib/hooks/use-permission-check"
import { formatCurrency } from "@/lib/utils/currency"
import { Account, AccountLedgerEntry, Transaction } from "@/types"
import {
    BookOpen,
    Eye,
    MoreVertical,
    Pencil,
    Plus,
    Search,
    Trash2
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

export default function AccountingPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const { user } = useAuth()
  const currentBusiness = useCurrentBusiness()
  const t = useTranslations("accounts")
  const tCommon = useTranslations("common")
  const { generalSettings } = useAppSettings()
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<"CASH" | "BANK" | "WALLET" | "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE" | "">("")
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null)
  const [viewAccountId, setViewAccountId] = useState<string | null>(null)
  const [isLedgerOpen, setIsLedgerOpen] = useState(false)
  const [viewAccountDetailsId, setViewAccountDetailsId] = useState<string | null>(null)
  const [isAccountDetailsOpen, setIsAccountDetailsOpen] = useState(false)
  const [viewTransactionId, setViewTransactionId] = useState<string | null>(null)
  const [isTransactionDetailsOpen, setIsTransactionDetailsOpen] = useState(false)

  // Permission checks
  const { hasAccess, isLoading: isCheckingAccess } = useModuleAccessCheck(MODULES.ACCOUNTING)
  const canCreateAccount = useHasPermission(PERMISSIONS.ACCOUNTS_CREATE)
  const canUpdateAccount = useHasPermission(PERMISSIONS.ACCOUNTS_UPDATE)
  const canDeleteAccount = useHasPermission(PERMISSIONS.ACCOUNTS_DELETE)

  // Accounts
  const { data: accountsData, isLoading: isLoadingAccounts } = useAccounts({
    limit: 1000,
    search: search || undefined,
    type: typeFilter || undefined,
  })
  const accounts = accountsData?.items ?? []


  // Account Ledger
  const { data: ledgerData, isLoading: isLoadingLedger } = useAccountLedger(
    viewAccountId || undefined
  )

  // Account Details
  const { data: accountDetails, isLoading: isLoadingAccountDetails } = useAccount(
    viewAccountDetailsId || undefined
  )

  // Transactions for the account
  const { data: accountTransactionsData, isLoading: isLoadingAccountTransactions } = useTransactions(
    viewAccountDetailsId ? { accountId: viewAccountDetailsId, limit: 50 } : undefined
  )
  const accountTransactions = accountTransactionsData?.items ?? []

  // Find transaction from account transactions
  const transactionDetails = useMemo(() => {
    if (!viewTransactionId) return null
    return accountTransactions.find((t: Transaction) => t.id === viewTransactionId) || null
  }, [viewTransactionId, accountTransactions])

  

  

  

  const updateAccountMutation = useUpdateAccount()

  // Show loading while checking permissions
  if (isCheckingAccess) {
    return (
      <PageLayout title="Accounting" description="Manage accounts and transactions">
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

  const handleCreateAccount = () => {
    setSelectedAccount(null)
    setIsAccountDialogOpen(true)
  }

  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account)
    setIsAccountDialogOpen(true)
  }

  const handleDeleteAccount = (account: Account) => {
    setAccountToDelete(account)
    setIsDeleteDialogOpen(true)
  }

  const handleViewLedger = (account: Account) => {
    setViewAccountId(account.id)
    setIsLedgerOpen(true)
  }

  const handleViewAccountDetails = (account: Account) => {
    setViewAccountDetailsId(account.id)
    setIsAccountDetailsOpen(true)
  }


  const confirmDelete = async () => {
    if (accountToDelete) {
      // For accounts, we'll deactivate instead of delete
      await updateAccountMutation.mutateAsync({
        id: accountToDelete.id,
        data: { isActive: false },
      })
      setAccountToDelete(null)
    }
    setIsDeleteDialogOpen(false)
  }

  // Account table columns
  const accountColumns: Column<Account>[] = useMemo(
    () => [
      {
        id: "name",
        header: t("name"),
        accessorKey: "name",
        sortable: true,
      },
      {
        id: "type",
        header: t("type"),
        cell: (row) => {
          const typeColors = {
            CASH: "bg-green-500/10 text-green-600 dark:text-green-400",
            BANK: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
            WALLET: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
            ASSET: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            LIABILITY: "bg-red-500/10 text-red-600 dark:text-red-400",
            EQUITY: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
            INCOME: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
            EXPENSE: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
          }
          const typeLabels = {
            CASH: t("typeCash"),
            BANK: t("typeBank"),
            WALLET: t("typeWallet"),
            ASSET: t("typeAsset"),
            LIABILITY: t("typeLiability"),
            EQUITY: t("typeEquity"),
            INCOME: t("typeIncome"),
            EXPENSE: t("typeExpense"),
          }
          return (
            <Badge className={typeColors[row.type] || ""}>
              {typeLabels[row.type] || row.type}
            </Badge>
          )
        },
        sortable: true,
      },
      {
        id: "currentBalance",
        header: t("balance"),
        cell: (row) => (
          <span className="font-medium">
            {formatCurrency(row.currentBalance || 0, { generalSettings })}
          </span>
        ),
        sortable: true,
      },
      {
        id: "isActive",
        header: t("status"),
        cell: (row) => (
          <Badge variant={row.isActive ? "default" : "secondary"}>
            {row.isActive ? tCommon("active") : tCommon("inactive")}
          </Badge>
        ),
        sortable: true,
      },
      {
        id: "actions",
        header: tCommon("actions"),
        cell: (row) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{tCommon("openMenu")}</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewAccountDetails(row)}>
                <Eye className="mr-2 h-4 w-4" />
                {tCommon("view")} {tCommon("details")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewLedger(row)}>
                <BookOpen className="mr-2 h-4 w-4" />
                {t("viewLedger")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditAccount(row)}>
                <Pencil className="mr-2 h-4 w-4" />
                {tCommon("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteAccount(row)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {tCommon("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        enableHiding: false,
      },
    ],
    [t, tCommon, generalSettings]
  )


  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesSearch = !search || account.name.toLowerCase().includes(search.toLowerCase())
      const matchesType = !typeFilter || account.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [accounts, search, typeFilter])

  return (
    <PageLayout
      title="Accounting"
      description="Financial management and bookkeeping"
      maxWidth="full"
    >
      <div className="space-y-6">
        {/* Accounts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("accounts")}</CardTitle>
                <CardDescription>{t("accountsDescription")}</CardDescription>
              </div>
              <Button onClick={handleCreateAccount}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createAccount")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={t("searchAccounts")}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">{t("allTypes")}</option>
                  <option value="CASH">{t("typeCash")}</option>
                  <option value="BANK">{t("typeBank")}</option>
                  <option value="WALLET">{t("typeWallet")}</option>
                  <option value="ASSET">{t("typeAsset")}</option>
                  <option value="LIABILITY">{t("typeLiability")}</option>
                  <option value="EQUITY">{t("typeEquity")}</option>
                  <option value="INCOME">{t("typeIncome")}</option>
                  <option value="EXPENSE">{t("typeExpense")}</option>
                </select>
              </div>

              {isLoadingAccounts ? (
                <SkeletonList count={5} />
              ) : filteredAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t("noAccounts")}
                </div>
              ) : (
                <DataTable
                  columns={accountColumns}
                  data={filteredAccounts}
                  getRowId={(row) => row.id}
                  enableRowSelection={false}
                  emptyMessage={t("noAccounts")}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Ledger Dialog */}
        <Dialog open={isLedgerOpen} onOpenChange={setIsLedgerOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{t("accountLedger")}</DialogTitle>
              <DialogDescription>
                {accounts.find((a) => a.id === viewAccountId)?.name}
              </DialogDescription>
            </DialogHeader>
            {isLoadingLedger ? (
              <div className="py-8 text-center text-muted-foreground">{tCommon("loading")}</div>
            ) : ledgerData ? (
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <div className="text-sm text-muted-foreground">{t("openingBalance")}</div>
                      <div className="text-lg font-semibold">
                        {formatCurrency(ledgerData.openingBalance, { generalSettings })}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">{t("closingBalance")}</div>
                      <div className="text-lg font-semibold">
                        {formatCurrency(ledgerData.closingBalance, { generalSettings })}
                      </div>
                    </div>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">{tCommon("date")}</th>
                        <th className="text-left p-2">{t("type")}</th>
                        <th className="text-right p-2">{t("debit")}</th>
                        <th className="text-right p-2">{t("credit")}</th>
                        <th className="text-right p-2">{t("balance")}</th>
                        <th className="text-left p-2">{t("description")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerData.items.map((entry: AccountLedgerEntry) => {
                        // Handle both API response formats
                        const date = entry.date || entry.createdAt
                        const transactionType = entry.transactionType || (entry.type === "IN" ? "CREDIT" : entry.type === "OUT" ? "DEBIT" : undefined)
                        const debit = entry.debit !== undefined ? entry.debit : (transactionType === "DEBIT" ? entry.amount : 0)
                        const credit = entry.credit !== undefined ? entry.credit : (transactionType === "CREDIT" ? entry.amount : 0)
                        const balance = entry.balanceAfter !== undefined ? entry.balanceAfter : (entry.balance !== undefined ? entry.balance : 0)
                        const description = entry.description || entry.category || "-"
                        
                        return (
                          <tr key={entry.id} className="border-b">
                            <td className="p-2 text-sm">
                              {date ? new Date(date).toLocaleDateString() : "-"}
                            </td>
                            <td className="p-2">
                              <Badge
                                variant={transactionType === "DEBIT" || entry.type === "OUT" ? "destructive" : "default"}
                              >
                                {transactionType || entry.type || "-"}
                              </Badge>
                            </td>
                            <td className="p-2 text-right text-sm">
                              {debit > 0 ? formatCurrency(debit, { generalSettings }) : "-"}
                            </td>
                            <td className="p-2 text-right text-sm">
                              {credit > 0 ? formatCurrency(credit, { generalSettings }) : "-"}
                            </td>
                            <td className="p-2 text-right font-medium">
                              {formatCurrency(balance, { generalSettings })}
                            </td>
                            <td className="p-2 text-sm text-muted-foreground">
                              {description}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            ) : (
              <div className="py-8 text-center text-muted-foreground">{t("noLedgerEntries")}</div>
            )}
          </DialogContent>
        </Dialog>

        {/* Account Details Sheet */}
        <Sheet open={isAccountDetailsOpen} onOpenChange={setIsAccountDetailsOpen}>
          <SheetContent
            side="bottom"
            className="w-full max-w-3xl mx-auto rounded-t-2xl sm:rounded-2xl sm:max-h-[90vh] overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle>{t("accountDetails") || "Account Details"}</SheetTitle>
              <SheetDescription>
                {accountDetails?.name || t("viewAccountDetails") || "View account information"}
              </SheetDescription>
            </SheetHeader>
            {isLoadingAccountDetails ? (
              <div className="py-8 text-center text-muted-foreground">{tCommon("loading")}</div>
            ) : accountDetails ? (
              <div className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">{t("name")}</div>
                    <div className="text-lg font-semibold">{accountDetails.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t("type")}</div>
                    <div className="text-lg font-semibold">
                      <Badge>
                        {accountDetails.type === "CASH" && t("typeCash")}
                        {accountDetails.type === "BANK" && t("typeBank")}
                        {accountDetails.type === "WALLET" && t("typeWallet")}
                        {accountDetails.type === "ASSET" && t("typeAsset")}
                        {accountDetails.type === "LIABILITY" && t("typeLiability")}
                        {accountDetails.type === "EQUITY" && t("typeEquity")}
                        {accountDetails.type === "INCOME" && t("typeIncome")}
                        {accountDetails.type === "EXPENSE" && t("typeExpense")}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t("openingBalance")}</div>
                    <div className="text-lg font-semibold">
                      {formatCurrency(accountDetails.openingBalance || 0, { generalSettings })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t("balance")}</div>
                    <div className="text-lg font-semibold">
                      {formatCurrency(accountDetails.currentBalance || 0, { generalSettings })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t("status")}</div>
                    <div>
                      <Badge variant={accountDetails.isActive ? "default" : "secondary"}>
                        {accountDetails.isActive ? tCommon("active") : tCommon("inactive")}
                      </Badge>
                    </div>
                  </div>
                  {accountDetails.description && (
                    <div className="col-span-2">
                      <div className="text-sm text-muted-foreground">{t("description")}</div>
                      <div className="text-base">{accountDetails.description}</div>
                    </div>
                  )}
                  {accountDetails.createdAt && (
                    <div>
                      <div className="text-sm text-muted-foreground">{tCommon("createdAt")}</div>
                      <div className="text-base">
                        {new Date(accountDetails.createdAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {accountDetails.updatedAt && (
                    <div>
                      <div className="text-sm text-muted-foreground">{tCommon("updatedAt")}</div>
                      <div className="text-base">
                        {new Date(accountDetails.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Transactions Section */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{t("transactions") || "Transactions"}</h4>
                    <span className="text-sm text-muted-foreground">
                      {accountTransactions.length} {tCommon("items") || "items"}
                    </span>
                  </div>
                  {isLoadingAccountTransactions ? (
                    <div className="py-4 text-center text-muted-foreground">{tCommon("loading")}</div>
                  ) : accountTransactions.length > 0 ? (
                    <div className="space-y-2">
                      {accountTransactions.map((transaction: Transaction) => (
                        <div
                          key={transaction.id}
                          className="rounded-lg border p-3 flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={transaction.type === "INCOME" ? "default" : "destructive"}
                              >
                                {transaction.type === "INCOME" ? t("typeIncome") || "Income" : t("typeExpense") || "Expense"}
                              </Badge>
                              {(transaction as any).incomeExpenseCategory?.name && (
                                <span className="text-sm text-muted-foreground">
                                  {(transaction as any).incomeExpenseCategory.name}
                                </span>
                              )}
                              {!((transaction as any).incomeExpenseCategory?.name) && (transaction as any).category && (
                                <span className="text-sm text-muted-foreground">
                                  {(transaction as any).category}
                                </span>
                              )}
                            </div>
                            {transaction.note && (
                              <p className="text-sm text-muted-foreground mt-1">{transaction.note}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {transaction.occurredAt
                                ? new Date(transaction.occurredAt).toLocaleDateString()
                                : "-"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-semibold ${
                                transaction.type === "INCOME" ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {transaction.type === "INCOME" ? "+" : "-"}
                              {formatCurrency(transaction.amount, { generalSettings })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                      {t("noTransactions") || "No transactions found"}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                {t("noAccountDetails") || "No account details found"}
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Transaction Details Sheet */}
        <Sheet open={isTransactionDetailsOpen} onOpenChange={setIsTransactionDetailsOpen}>
          <SheetContent
            side="bottom"
            className="w-full max-w-3xl mx-auto rounded-t-2xl sm:rounded-2xl sm:max-h-[90vh] overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle>Transaction Details</SheetTitle>
              <SheetDescription>
                View complete transaction information
              </SheetDescription>
            </SheetHeader>
            {transactionDetails ? (
              <div className="space-y-4 mt-6">
                  {/* Basic Information */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Type</div>
                          <div className="text-lg font-semibold">
                            <Badge variant={(transactionDetails.type === "INCOME" || (transactionDetails as any).type === "IN") ? "default" : "destructive"}>
                              {(transactionDetails.type === "INCOME" || (transactionDetails as any).type === "IN") ? "Income" : "Expense"}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Amount</div>
                          <div className={`text-lg font-semibold ${(transactionDetails.type === "INCOME" || (transactionDetails as any).type === "IN") ? "text-green-600" : "text-red-600"}`}>
                            {(transactionDetails.type === "INCOME" || (transactionDetails as any).type === "IN") ? "+" : "-"}
                            {formatCurrency(transactionDetails.amount, { generalSettings })}
                          </div>
                        </div>
                        {transactionDetails.paidAmount !== undefined && transactionDetails.type === "EXPENSE" && (
                          <div>
                            <div className="text-sm text-muted-foreground">Paid Amount</div>
                            <div className="text-lg font-semibold">
                              {formatCurrency(transactionDetails.paidAmount, { generalSettings })}
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-sm text-muted-foreground">Occurred At</div>
                          <div className="text-base font-semibold">
                            {transactionDetails.occurredAt
                              ? new Date(transactionDetails.occurredAt).toLocaleString()
                              : "-"}
                          </div>
                        </div>
                        {transactionDetails.note && (
                          <div className="col-span-2">
                            <div className="text-sm text-muted-foreground">Note</div>
                            <div className="text-base mt-1">{transactionDetails.note}</div>
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
                        {(transactionDetails as any).incomeExpenseCategory ? (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Category Name</div>
                              <div className="text-base font-semibold">
                                {(transactionDetails as any).incomeExpenseCategory.name}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Category Type</div>
                              <div className="text-base font-semibold">
                                {(transactionDetails as any).incomeExpenseCategory.type}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Status</div>
                              <div className="text-base font-semibold">
                                <Badge variant={(transactionDetails as any).incomeExpenseCategory.isActive ? "default" : "secondary"}>
                                  {(transactionDetails as any).incomeExpenseCategory.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </div>
                            {(transactionDetails as any).incomeExpenseCategory.createdAt && (
                              <div>
                                <div className="text-sm text-muted-foreground">Created At</div>
                                <div className="text-sm">
                                  {new Date((transactionDetails as any).incomeExpenseCategory.createdAt).toLocaleString()}
                                </div>
                              </div>
                            )}
                            {(transactionDetails as any).incomeExpenseCategory.updatedAt && (
                              <div>
                                <div className="text-sm text-muted-foreground">Updated At</div>
                                <div className="text-sm">
                                  {new Date((transactionDetails as any).incomeExpenseCategory.updatedAt).toLocaleString()}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm text-muted-foreground">Category</div>
                            <div className="text-base font-semibold">
                              {(transactionDetails as any).category}
                            </div>
                          </div>
                        )}
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
                            <div className="text-sm text-muted-foreground">Account Name</div>
                            <div className="text-base font-semibold">{transactionDetails.account.name}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Account Type</div>
                            <div className="text-base font-semibold">{transactionDetails.account.type}</div>
                          </div>
                          {transactionDetails.account.description && (
                            <div className="col-span-2">
                              <div className="text-sm text-muted-foreground">Description</div>
                              <div className="text-base">{transactionDetails.account.description}</div>
                            </div>
                          )}
                          <div>
                            <div className="text-sm text-muted-foreground">Current Balance</div>
                            <div className="text-base font-semibold">
                              {formatCurrency(transactionDetails.account.currentBalance || 0, { generalSettings })}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Opening Balance</div>
                            <div className="text-base font-semibold">
                              {formatCurrency(transactionDetails.account.openingBalance || 0, { generalSettings })}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Status</div>
                            <div className="text-base font-semibold">
                              <Badge variant={transactionDetails.account.isActive ? "default" : "secondary"}>
                                {transactionDetails.account.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                          {transactionDetails.account.createdAt && (
                            <div>
                              <div className="text-sm text-muted-foreground">Created At</div>
                              <div className="text-sm">
                                {new Date(transactionDetails.account.createdAt).toLocaleString()}
                              </div>
                            </div>
                          )}
                          {transactionDetails.account.updatedAt && (
                            <div>
                              <div className="text-sm text-muted-foreground">Updated At</div>
                              <div className="text-sm">
                                {new Date(transactionDetails.account.updatedAt).toLocaleString()}
                              </div>
                            </div>
                          )}
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
                            <div className="text-sm text-muted-foreground">Branch Name</div>
                            <div className="text-base font-semibold">{transactionDetails.branch.name}</div>
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
                          {transactionDetails.branch.createdAt && (
                            <div>
                              <div className="text-sm text-muted-foreground">Created At</div>
                              <div className="text-sm">
                                {new Date(transactionDetails.branch.createdAt).toLocaleString()}
                              </div>
                            </div>
                          )}
                          {transactionDetails.branch.updatedAt && (
                            <div>
                              <div className="text-sm text-muted-foreground">Updated At</div>
                              <div className="text-sm">
                                {new Date(transactionDetails.branch.updatedAt).toLocaleString()}
                              </div>
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
                            <div className="text-sm text-muted-foreground">Contact Name</div>
                            <div className="text-base font-semibold">{transactionDetails.contact.name}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Contact Type</div>
                            <div className="text-base font-semibold">{transactionDetails.contact.type}</div>
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
                          {transactionDetails.contact.address && (
                            <div className="col-span-2">
                              <div className="text-sm text-muted-foreground">Address</div>
                              <div className="text-base">{transactionDetails.contact.address}</div>
                            </div>
                          )}
                          {transactionDetails.contact.balance !== undefined && (
                            <div>
                              <div className="text-sm text-muted-foreground">Balance</div>
                              <div className="text-base font-semibold">
                                {formatCurrency(transactionDetails.contact.balance, { generalSettings })}
                              </div>
                            </div>
                          )}
                          {transactionDetails.contact.creditLimit !== undefined && (
                            <div>
                              <div className="text-sm text-muted-foreground">Credit Limit</div>
                              <div className="text-base font-semibold">
                                {formatCurrency(transactionDetails.contact.creditLimit, { generalSettings })}
                              </div>
                            </div>
                          )}
                          <div>
                            <div className="text-sm text-muted-foreground">Is Individual</div>
                            <div className="text-base font-semibold">
                              <Badge variant={transactionDetails.contact.isIndividual ? "default" : "secondary"}>
                                {transactionDetails.contact.isIndividual ? "Yes" : "No"}
                              </Badge>
                            </div>
                          </div>
                          {transactionDetails.contact.companyName && (
                            <div>
                              <div className="text-sm text-muted-foreground">Company Name</div>
                              <div className="text-base">{transactionDetails.contact.companyName}</div>
                            </div>
                          )}
                          {transactionDetails.contact.companyAddress && (
                            <div className="col-span-2">
                              <div className="text-sm text-muted-foreground">Company Address</div>
                              <div className="text-base">{transactionDetails.contact.companyAddress}</div>
                            </div>
                          )}
                          {transactionDetails.contact.companyPhone && (
                            <div>
                              <div className="text-sm text-muted-foreground">Company Phone</div>
                              <div className="text-base">{transactionDetails.contact.companyPhone}</div>
                            </div>
                          )}
                          {transactionDetails.contact.createdAt && (
                            <div>
                              <div className="text-sm text-muted-foreground">Created At</div>
                              <div className="text-sm">
                                {new Date(transactionDetails.contact.createdAt).toLocaleString()}
                              </div>
                            </div>
                          )}
                          {transactionDetails.contact.updatedAt && (
                            <div>
                              <div className="text-sm text-muted-foreground">Updated At</div>
                              <div className="text-sm">
                                {new Date(transactionDetails.contact.updatedAt).toLocaleString()}
                              </div>
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
                            <div className="text-sm text-muted-foreground">{tCommon("createdAt")}</div>
                            <div className="text-base font-semibold">
                              {new Date(transactionDetails.createdAt).toLocaleString()}
                            </div>
                          </div>
                        )}
                        {transactionDetails.updatedAt && (
                          <div>
                            <div className="text-sm text-muted-foreground">{tCommon("updatedAt")}</div>
                            <div className="text-base font-semibold">
                              {new Date(transactionDetails.updatedAt).toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No transaction details found
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Dialogs */}
      <AccountDialog
        account={selectedAccount}
        open={isAccountDialogOpen}
        onOpenChange={setIsAccountDialogOpen}
      />


      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={accountToDelete ? t("deleteAccountTitle") : tCommon("confirmDelete")}
        description={
          accountToDelete
            ? t("deleteAccountDescription", { name: accountToDelete.name })
            : tCommon("confirmDeleteDescription")
        }
      />
    </PageLayout>
  )
}
