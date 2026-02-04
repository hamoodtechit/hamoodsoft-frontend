"use client"

import { DataTable, type Column } from "@/components/common/data-table"
import { IncomeExpenseCategoryDialog } from "@/components/common/income-expense-category-dialog"
import { PageLayout } from "@/components/common/page-layout"
import { TransactionDialog } from "@/components/common/transaction-dialog"
import { SkeletonList } from "@/components/skeletons/skeleton-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useAccounts } from "@/lib/hooks/use-accounts"
import { useAuth } from "@/lib/hooks/use-auth"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { useIncomeExpenseCategories } from "@/lib/hooks/use-income-expense-categories"
import { useTransaction, useTransactions } from "@/lib/hooks/use-transactions"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { formatCurrency } from "@/lib/utils/currency"
import { IncomeExpenseCategory, Transaction } from "@/types"
import {
  Eye,
  MoreVertical,
  Plus,
  Search,
  Settings,
  TrendingDown,
  TrendingUp
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

type TabType = "transactions" | "categories"
type TransactionTypeFilter = "INCOME" | "EXPENSE" | ""

export default function TransactionsPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const { user } = useAuth()
  const currentBusiness = useCurrentBusiness()
  const { selectedBranchId } = useBranchSelection()
  const t = useTranslations("transactions")
  const tCommon = useTranslations("common")
  const tCategories = useTranslations("incomeExpenseCategories")
  const { generalSettings } = useAppSettings()

  const [activeTab, setActiveTab] = useState<TabType>("transactions")
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>("")
  const [accountFilter, setAccountFilter] = useState<string>("")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [page, setPage] = useState(1)
  const limit = 20

  // Transaction dialog state
  const [transactionType, setTransactionType] = useState<"INCOME" | "EXPENSE">("INCOME")
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)

  // Category dialog state
  const [selectedCategory, setSelectedCategory] = useState<IncomeExpenseCategory | null>(null)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)

  // Transaction details
  const [viewTransactionId, setViewTransactionId] = useState<string | null>(null)
  const [isTransactionDetailsOpen, setIsTransactionDetailsOpen] = useState(false)

  // Check if user has access to accounting module
  useEffect(() => {
    if (currentBusiness && !currentBusiness.modules?.includes("accounting")) {
      router.push(`/${locale}/dashboard`)
    }
  }, [currentBusiness, locale, router])

  // Transactions
  const { data: transactionsData, isLoading: isLoadingTransactions } = useTransactions({
    page,
    limit,
    search: search || undefined,
    type: typeFilter || undefined,
    accountId: accountFilter || undefined,
    categoryId: categoryFilter || undefined,
    branchId: selectedBranchId || undefined,
  })
  
  const transactions = transactionsData?.items ?? []
 console.log("transactions", transactions)
  // Categories
  const { data: categoriesData, isLoading: isLoadingCategories } = useIncomeExpenseCategories({
    limit: 1000,
    isActive: true,
  })
  const categories = categoriesData?.items ?? []

  // Accounts for filter
  const { data: accountsData } = useAccounts({ limit: 1000, isActive: true })
  const accounts = accountsData?.items ?? []

  // Transaction details
  const { data: transactionDetails, isLoading: isLoadingTransactionDetails } = useTransaction(
    viewTransactionId || undefined
  )

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

  const handleCreateIncome = () => {
    setTransactionType("INCOME")
    setIsTransactionDialogOpen(true)
  }

  const handleCreateExpense = () => {
    setTransactionType("EXPENSE")
    setIsTransactionDialogOpen(true)
  }

  const handleCreateCategory = () => {
    setSelectedCategory(null)
    setIsCategoryDialogOpen(true)
  }

  const handleEditCategory = (category: IncomeExpenseCategory) => {
    setSelectedCategory(category)
    setIsCategoryDialogOpen(true)
  }

  const handleViewTransactionDetails = (transaction: Transaction) => {
    setViewTransactionId(transaction.id)
    setIsTransactionDetailsOpen(true)
  }

  // Transaction table columns
  const transactionColumns: Column<Transaction>[] = useMemo(
    () => [
      {
        id: "type",
        header: t("type"),
        cell: (row) => {
          const isIncome = row.type === "INCOME"
          return (
            <Badge
              className={
                isIncome
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-red-500/10 text-red-600 dark:text-red-400"
              }
            >
              {isIncome ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3" />
              )}
              {isIncome ? t("typeIncome") : t("typeExpense")}
            </Badge>
          )
        },
        sortable: true,
      },
      {
        id: "amount",
        header: t("amount"),
        cell: (row) => {
          const isIncome = row.type === "INCOME"
          return (
            <span
              className={`font-medium ${isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            >
              {isIncome ? "+" : "-"}
              {formatCurrency(row.amount, { generalSettings })}
            </span>
          )
        },
        sortable: true,
      },
      {
        id: "account",
        header: t("account"),
        cell: (row) => row.account?.name || "-",
        sortable: true,
      },
      {
        id: "category",
        header: t("category"),
        cell: (row) => row.category?.name || "-",
        sortable: true,
      },
      {
        id: "contact",
        header: t("contact"),
        cell: (row) => row.contact?.name || "-",
        sortable: true,
      },
      {
        id: "branch",
        header: tCommon("branch"),
        cell: (row) => row.branch?.name || "-",
        sortable: true,
      },
      {
        id: "occurredAt",
        header: t("occurredAt"),
        cell: (row) => {
          if (!row.occurredAt) return "-"
          const date = new Date(row.occurredAt)
          return date.toLocaleDateString()
        },
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
              <DropdownMenuItem onClick={() => handleViewTransactionDetails(row)}>
                <Eye className="mr-2 h-4 w-4" />
                {tCommon("view")} {tCommon("details")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        enableHiding: false,
      },
    ],
    [t, tCommon, generalSettings]
  )

  // Category table columns
  const categoryColumns: Column<IncomeExpenseCategory>[] = useMemo(
    () => [
      {
        id: "name",
        header: tCategories("name"),
        accessorKey: "name",
        sortable: true,
      },
      {
        id: "type",
        header: tCategories("type"),
        cell: (row) => {
          const isIncome = row.type === "INCOME"
          return (
            <Badge
              className={
                isIncome
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-red-500/10 text-red-600 dark:text-red-400"
              }
            >
              {isIncome ? tCategories("typeIncome") : tCategories("typeExpense")}
            </Badge>
          )
        },
        sortable: true,
      },
      {
        id: "isActive",
        header: tCommon("status"),
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
              <DropdownMenuItem onClick={() => handleEditCategory(row)}>
                <Settings className="mr-2 h-4 w-4" />
                {tCommon("edit")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        enableHiding: false,
      },
    ],
    [tCategories, tCommon]
  )

  return (
    <PageLayout
      title="Transactions"
      description="Manage income and expense transactions"
      maxWidth="full"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <Button
            variant={activeTab === "transactions" ? "default" : "ghost"}
            onClick={() => setActiveTab("transactions")}
            className="rounded-b-none"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            {t("title")}
          </Button>
          <Button
            variant={activeTab === "categories" ? "default" : "ghost"}
            onClick={() => setActiveTab("categories")}
            className="rounded-b-none"
          >
            <Settings className="mr-2 h-4 w-4" />
            {tCategories("title")}
          </Button>
        </div>

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("title")}</CardTitle>
                  <CardDescription>{t("transactionsDescription")}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateExpense} variant="outline">
                    <TrendingDown className="mr-2 h-4 w-4" />
                    {t("createExpense")}
                  </Button>
                  <Button onClick={handleCreateIncome}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("createIncome")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder={tCommon("search")}
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value)
                          setPage(1)
                        }}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Select
                    value={typeFilter || "all"}
                    onValueChange={(value) => {
                      setTypeFilter(value === "all" ? "" : (value as TransactionTypeFilter))
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={t("type")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tCommon("all") || "All"}</SelectItem>
                      <SelectItem value="INCOME">{t("typeIncome")}</SelectItem>
                      <SelectItem value="EXPENSE">{t("typeExpense")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={accountFilter || "all"}
                    onValueChange={(value) => {
                      setAccountFilter(value === "all" ? "" : value)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder={t("account")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tCommon("all") || "All"}</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={categoryFilter || "all"}
                    onValueChange={(value) => {
                      setCategoryFilter(value === "all" ? "" : value)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder={t("category")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tCommon("all") || "All"}</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isLoadingTransactions ? (
                  <SkeletonList count={5} />
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("noTransactions")}
                  </div>
                ) : (
                  <>
                    <DataTable
                      data={transactions}
                      columns={transactionColumns}
                      emptyMessage={t("noTransactions")}
                    />
                    {transactionsData?.meta && (transactionsData.meta.totalPages || 0) > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, transactionsData.meta.total || 0)} of {transactionsData.meta.total || 0} transactions
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                          >
                            {tCommon("previous")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(transactionsData.meta.totalPages || 1, p + 1))}
                            disabled={page >= (transactionsData.meta.totalPages || 1)}
                          >
                            {tCommon("next")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{tCategories("title")}</CardTitle>
                  <CardDescription>{tCategories("categoriesDescription")}</CardDescription>
                </div>
                <Button onClick={handleCreateCategory}>
                  <Plus className="mr-2 h-4 w-4" />
                  {tCategories("createCategory")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingCategories ? (
                <SkeletonList count={5} />
              ) : categories.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">{tCategories("noCategories")}</p>
                  <Button onClick={handleCreateCategory} variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    {tCategories("createCategory")}
                  </Button>
                </div>
              ) : (
                <DataTable
                  data={categories}
                  columns={categoryColumns}
                  emptyMessage={tCategories("noCategories")}
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transaction Dialog */}
      <TransactionDialog
        open={isTransactionDialogOpen}
        onOpenChange={setIsTransactionDialogOpen}
        type={transactionType}
      />

      {/* Category Dialog */}
      <IncomeExpenseCategoryDialog
        category={selectedCategory}
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
      />

      {/* Transaction Details Sheet */}
      <Sheet open={isTransactionDetailsOpen} onOpenChange={setIsTransactionDetailsOpen}>
        <SheetContent 
          side="bottom" 
          className="w-full max-w-3xl mx-auto rounded-t-2xl sm:rounded-2xl sm:max-h-[90vh] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>{t("transactionDetails")}</SheetTitle>
            <SheetDescription>{t("viewTransactionDetails")}</SheetDescription>
          </SheetHeader>
          {isLoadingTransactionDetails ? (
            <div className="mt-4">Loading...</div>
          ) : transactionDetails ? (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("type")}</p>
                  <p className="text-lg">
                    {transactionDetails.type === "INCOME" ? t("typeIncome") : t("typeExpense")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("amount")}</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(transactionDetails.amount, { generalSettings })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("account")}</p>
                  <p className="text-lg">{transactionDetails.account?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("category")}</p>
                  <p className="text-lg">{transactionDetails.category?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("contact")}</p>
                  <p className="text-lg">{transactionDetails.contact?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{tCommon("branch")}</p>
                  <p className="text-lg">{transactionDetails.branch?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("occurredAt")}</p>
                  <p className="text-lg">
                    {transactionDetails.occurredAt
                      ? new Date(transactionDetails.occurredAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })
                      : "-"}
                  </p>
                </div>
                {transactionDetails.paidAmount !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t("paidAmount")}</p>
                    <p className="text-lg">
                      {formatCurrency(transactionDetails.paidAmount, { generalSettings })}
                    </p>
                  </div>
                )}
              </div>
              {transactionDetails.note && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("note")}</p>
                  <p className="text-lg">{transactionDetails.note}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 text-muted-foreground">{t("noTransactionDetails")}</div>
          )}
        </SheetContent>
      </Sheet>
    </PageLayout>
  )
}
