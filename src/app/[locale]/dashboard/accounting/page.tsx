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
import { useDeletePayment, usePayment, usePayments } from "@/lib/hooks/use-payments"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { formatCurrency } from "@/lib/utils/currency"
import { Account, AccountLedgerEntry, Payment } from "@/types"
import {
  BookOpen,
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wallet,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

type TabType = "accounts" | "payments"

export default function AccountingPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const { user } = useAuth()
  const currentBusiness = useCurrentBusiness()
  const t = useTranslations("accounts")
  const tCommon = useTranslations("common")
  const tPayments = useTranslations("payments")
  const { generalSettings } = useAppSettings()

  const [activeTab, setActiveTab] = useState<TabType>("accounts")
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<"CASH" | "BANK" | "WALLET" | "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE" | "">("")
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null)
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null)
  const [viewAccountId, setViewAccountId] = useState<string | null>(null)
  const [isLedgerOpen, setIsLedgerOpen] = useState(false)
  const [viewAccountDetailsId, setViewAccountDetailsId] = useState<string | null>(null)
  const [isAccountDetailsOpen, setIsAccountDetailsOpen] = useState(false)
  const [viewPaymentId, setViewPaymentId] = useState<string | null>(null)
  const [isPaymentDetailsOpen, setIsPaymentDetailsOpen] = useState(false)

  // Check if user has access to accounting module
  useEffect(() => {
    if (currentBusiness && !currentBusiness.modules?.includes("accounting")) {
      router.push(`/${locale}/dashboard`)
    }
  }, [currentBusiness, locale, router])

  // Accounts
  const { data: accountsData, isLoading: isLoadingAccounts } = useAccounts({
    limit: 1000,
    search: search || undefined,
    type: typeFilter || undefined,
  })
  const accounts = accountsData?.items ?? []

  // Payments
  const { data: paymentsData, isLoading: isLoadingPayments } = usePayments({
    limit: 100,
  })
  const payments = paymentsData?.items ?? []

  // Account Ledger
  const { data: ledgerData, isLoading: isLoadingLedger } = useAccountLedger(
    viewAccountId || undefined
  )

  // Account Details
  const { data: accountDetails, isLoading: isLoadingAccountDetails } = useAccount(
    viewAccountDetailsId || undefined
  )

  // Payment Details
  const { data: paymentDetails, isLoading: isLoadingPaymentDetails } = usePayment(
    viewPaymentId || undefined
  )
  

  

  

  const updateAccountMutation = useUpdateAccount()
  const deletePaymentMutation = useDeletePayment()

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

  const handleViewPaymentDetails = (payment: Payment) => {
    setViewPaymentId(payment.id)
    setIsPaymentDetailsOpen(true)
  }

  const handleDeletePayment = (payment: Payment) => {
    setPaymentToDelete(payment)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (accountToDelete) {
      // For accounts, we'll deactivate instead of delete
      await updateAccountMutation.mutateAsync({
        id: accountToDelete.id,
        data: { isActive: false },
      })
      setAccountToDelete(null)
    } else if (paymentToDelete) {
      await deletePaymentMutation.mutateAsync(paymentToDelete.id)
      setPaymentToDelete(null)
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

  // Payment table columns
  const paymentColumns: Column<Payment>[] = useMemo(
    () => [
      {
        id: "type",
        header: tPayments("type"),
        cell: (row) => {
          const typeColors = {
            SALE_PAYMENT: "bg-green-500/10 text-green-600 dark:text-green-400",
            PURCHASE_PAYMENT: "bg-red-500/10 text-red-600 dark:text-red-400",
            DEPOSIT: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
          }
          const typeLabels = {
            SALE_PAYMENT: tPayments("typeSalePayment"),
            PURCHASE_PAYMENT: tPayments("typePurchasePayment"),
            DEPOSIT: tPayments("typeDeposit"),
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
        id: "account",
        header: tPayments("account"),
        cell: (row) => row.account?.name || "-",
        sortable: false,
      },
      {
        id: "amount",
        header: tPayments("amount"),
        cell: (row) => (
          <span className="font-medium">
            {formatCurrency(row.amount, { generalSettings })}
          </span>
        ),
        sortable: true,
      },
      {
        id: "occurredAt",
        header: tPayments("occurredAt"),
        cell: (row) =>
          row.occurredAt ? new Date(row.occurredAt).toLocaleDateString() : "-",
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
              <DropdownMenuItem onClick={() => handleViewPaymentDetails(row)}>
                <Eye className="mr-2 h-4 w-4" />
                {tCommon("view")} {tCommon("details")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeletePayment(row)}
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
    [tPayments, tCommon, generalSettings]
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
        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <Button
            variant={activeTab === "accounts" ? "default" : "ghost"}
            onClick={() => setActiveTab("accounts")}
            className="rounded-b-none"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {t("accounts")}
          </Button>
          <Button
            variant={activeTab === "payments" ? "default" : "ghost"}
            onClick={() => setActiveTab("payments")}
            className="rounded-b-none"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            {tPayments("payments")}
          </Button>
        </div>

        {/* Accounts Tab */}
        {activeTab === "accounts" && (
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
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{tPayments("payments")}</CardTitle>
                  <CardDescription>{tPayments("paymentsDescription")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingPayments ? (
                <SkeletonList count={5} />
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {tPayments("noPayments")}
                </div>
              ) : (
                <DataTable
                  columns={paymentColumns}
                  data={payments}
                  getRowId={(row) => row.id}
                  enableRowSelection={false}
                  emptyMessage={tPayments("noPayments")}
                />
              )}
            </CardContent>
          </Card>
        )}

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
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                {t("noAccountDetails") || "No account details found"}
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Payment Details Sheet */}
        <Sheet open={isPaymentDetailsOpen} onOpenChange={setIsPaymentDetailsOpen}>
          <SheetContent
            side="bottom"
            className="w-full max-w-3xl mx-auto rounded-t-2xl sm:rounded-2xl sm:max-h-[90vh] overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle>{tPayments("paymentDetails") || "Payment Details"}</SheetTitle>
              <SheetDescription>
                {tPayments("viewPaymentDetails") || "View payment transaction information"}
              </SheetDescription>
            </SheetHeader>
            {isLoadingPaymentDetails ? (
              <div className="py-8 text-center text-muted-foreground">{tCommon("loading")}</div>
            ) : paymentDetails ? (
              <div className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">{tPayments("type")}</div>
                    <div className="text-lg font-semibold">
                      <Badge>
                        {paymentDetails.type === "SALE_PAYMENT" && tPayments("typeSalePayment")}
                        {paymentDetails.type === "PURCHASE_PAYMENT" &&
                          tPayments("typePurchasePayment")}
                        {paymentDetails.type === "DEPOSIT" && tPayments("typeDeposit")}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{tPayments("amount")}</div>
                    <div className="text-lg font-semibold">
                      {formatCurrency(paymentDetails.amount, { generalSettings })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{tPayments("account")}</div>
                    <div className="text-base">{paymentDetails.account?.name || "-"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{tPayments("occurredAt")}</div>
                    <div className="text-base">
                      {paymentDetails.occurredAt
                        ? new Date(paymentDetails.occurredAt).toLocaleString()
                        : "-"}
                    </div>
                  </div>
                  {paymentDetails.saleId && (
                    <div>
                      <div className="text-sm text-muted-foreground">
                        {tPayments("saleId") || "Sale ID"}
                      </div>
                      <div className="text-base">{paymentDetails.saleId}</div>
                      {paymentDetails.sale && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Invoice: {paymentDetails.sale.invoiceNumber || paymentDetails.sale.id}
                        </div>
                      )}
                    </div>
                  )}
                  {paymentDetails.purchaseId && (
                    <div>
                      <div className="text-sm text-muted-foreground">
                        {tPayments("purchaseId") || "Purchase ID"}
                      </div>
                      <div className="text-base">{paymentDetails.purchaseId}</div>
                    </div>
                  )}
                  {paymentDetails.contact && (
                    <div>
                      <div className="text-sm text-muted-foreground">
                        {tPayments("contact") || "Contact"}
                      </div>
                      <div className="text-base">{paymentDetails.contact.name}</div>
                    </div>
                  )}
                  {paymentDetails.branch && (
                    <div>
                      <div className="text-sm text-muted-foreground">
                        {tPayments("branch") || "Branch"}
                      </div>
                      <div className="text-base">{paymentDetails.branch.name}</div>
                    </div>
                  )}
                  {paymentDetails.notes && (
                    <div className="col-span-2">
                      <div className="text-sm text-muted-foreground">{tPayments("notes")}</div>
                      <div className="text-base">{paymentDetails.notes}</div>
                    </div>
                  )}
                  {paymentDetails.createdAt && (
                    <div>
                      <div className="text-sm text-muted-foreground">{tCommon("createdAt")}</div>
                      <div className="text-base">
                        {new Date(paymentDetails.createdAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {paymentDetails.updatedAt && (
                    <div>
                      <div className="text-sm text-muted-foreground">{tCommon("updatedAt")}</div>
                      <div className="text-base">
                        {new Date(paymentDetails.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                {tPayments("noPaymentDetails") || "No payment details found"}
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
        title={
          accountToDelete
            ? t("deleteAccountTitle")
            : paymentToDelete
              ? tPayments("deletePaymentTitle")
              : tCommon("confirmDelete")
        }
        description={
          accountToDelete
            ? t("deleteAccountDescription", { name: accountToDelete.name })
            : paymentToDelete
              ? tPayments("deletePaymentDescription")
              : tCommon("confirmDeleteDescription")
        }
      />
    </PageLayout>
  )
}
