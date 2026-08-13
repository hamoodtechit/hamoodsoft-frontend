"use client"

import { BackButton } from "@/components/common/back-button"
import { PrintHeader } from "@/components/common/PrintHeader"
import { ReportActionButtons } from "@/components/common/ReportActionButtons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { useTransactions } from "@/lib/hooks/use-transactions"
import { formatCurrency } from "@/lib/utils/currency"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { Loader2, Search } from "lucide-react"
import { ReportSummary } from "@/components/reports/ReportSummary"
import { useAccounts } from "@/lib/hooks/use-accounts"
import { useIncomeExpenseCategories } from "@/lib/hooks/use-income-expense-categories"

export default function ExpenseReportPage() {
  const t = useTranslations("accounting")
  const { selectedBranchId } = useBranchSelection()
  const { generalSettings } = useAppSettings()

  // Default to this month
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [accountFilter, setAccountFilter] = useState("ALL")
  const [categoryFilter, setCategoryFilter] = useState("ALL")

  const { data: accountsData } = useAccounts({ limit: 100 })
  const { data: categoriesData } = useIncomeExpenseCategories({ type: "EXPENSE", limit: 100 })
  
  const accounts = accountsData?.items || []
  const categories = categoriesData?.items || []

  const { data: transactionsData, isLoading } = useTransactions({
    branchId: selectedBranchId || undefined,
    type: "EXPENSE",
    startDate: dateRange.from ? new Date(dateRange.from).toISOString() : undefined,
    endDate: dateRange.to ? new Date(dateRange.to).toISOString() : undefined,
    limit: 1000, // Fetch a large number for reporting
  })

  const rawExpenses = transactionsData?.items || []

  // Filter expenses
  const expenses = useMemo(() => {
    return rawExpenses.filter(expense => {
      if (accountFilter !== "ALL" && expense.accountId !== accountFilter) {
        return false
      }
      if (categoryFilter !== "ALL" && expense.incomeExpenseCategoryId !== categoryFilter && expense.categoryId !== categoryFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const ref = (expense.referenceId || "").toLowerCase()
        const note = (expense.note || "").toLowerCase()
        const acc = (expense.account?.name || "").toLowerCase()
        const cat = (expense.incomeExpenseCategory?.name || expense.category?.name || "").toLowerCase()
        
        if (!ref.includes(q) && !note.includes(q) && !acc.includes(q) && !cat.includes(q)) {
          return false
        }
      }
      return true
    })
  }, [rawExpenses, accountFilter, categoryFilter, searchQuery])

  // Calculate summaries
  const summaries = useMemo(() => {
    let totalExpense = 0

    expenses.forEach(expense => {
      totalExpense += expense.amount || 0
    })

    return {
      totalExpense,
      totalTransactions: expenses.length
    }
  }, [expenses])

  // Group expenses by date
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, typeof expenses> = {}
    expenses.forEach(expense => {
      const dateKey = expense.createdAt ? format(new Date(expense.createdAt), "dd MMM, yyyy") : "Unknown Date"
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(expense)
    })
    
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "Unknown Date") return 1
      if (b === "Unknown Date") return -1
      return new Date(b).getTime() - new Date(a).getTime()
    })
    
    return sortedKeys.map(key => ({
      date: key,
      expenses: groups[key]
    }))
  }, [expenses])

  return (
    <div className="space-y-6">
      {/* Hidden on screen, visible on print */}
      <PrintHeader
        title="Expense Reports"
        dateRange={{
          from: dateRange.from ? new Date(dateRange.from) : new Date(),
          to: dateRange.to ? new Date(dateRange.to) : undefined
        }}
      />

      <BackButton href="/dashboard#reports-section" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 print:hidden !mt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Expense Reports
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            View and print your expense transactions history.
          </p>
        </div>
        <ReportActionButtons />
      </div>

      {/* Filters - Hidden on print */}
      <Card className="print:hidden">
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5">
            <Label htmlFor="date-from">From Date</Label>
            <Input
              id="date-from"
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date-to">To Date</Label>
            <Input
              id="date-to"
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5 min-w-[140px]">
            <Label htmlFor="account-filter">Account</Label>
            <select
              id="account-filter"
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="ALL">All Accounts</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 min-w-[140px]">
            <Label htmlFor="category-filter">Category</Label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="ALL">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <Label htmlFor="search-input">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                id="search-input"
                type="text"
                placeholder="Search reference, note, account..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <ReportSummary
        items={[
          { label: "Total Expenses", value: formatCurrency(summaries.totalExpense, { generalSettings }), valueClassName: "text-red-600 dark:text-red-500" },
          { label: "Total Transactions", value: summaries.totalTransactions }
        ]}
      />

      {/* Data Table */}
      <Card className="print:shadow-none print:border-0">
        <CardContent className="p-0 print:p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              No expense transactions found for the selected period.
            </div>
          ) : (
            <div className="overflow-x-auto print:overflow-visible">
              {groupedExpenses.map((group, groupIndex) => (
                <div key={group.date} className="mb-4 print:mb-1.5">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-2 print:text-[12px] print:mb-1 ml-4 print:ml-1">
                    {group.date}
                  </h3>
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300 print:bg-transparent border-y print:border-slate-300 print:text-[11px]">
                      <tr>
                        <th className="px-4 py-3 print:px-1.5 print:py-1 font-semibold">Time</th>
                        <th className="px-4 py-3 print:px-1.5 print:py-1 font-semibold">Ref / Note</th>
                        <th className="px-4 py-3 print:px-1.5 print:py-1 font-semibold">Account</th>
                        <th className="px-4 py-3 print:px-1.5 print:py-1 font-semibold">Category</th>
                        <th className="px-4 py-3 print:px-1.5 print:py-1 font-semibold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:text-[11px]">
                      {group.expenses.map((expense) => {
                        const isUUID = expense.referenceId && expense.referenceId.length === 36 && expense.referenceId.includes('-');
                        const referenceText = isUUID ? (expense.note || "-") : (expense.referenceId || expense.note || "-");

                        return (
                          <tr key={expense.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 print-break-inside-avoid">
                            <td className="px-4 py-3 print:px-1.5 print:py-1 whitespace-nowrap">
                              {expense.createdAt ? format(new Date(expense.createdAt), "hh:mm a") : "-"}
                            </td>
                            <td className="px-4 py-3 print:px-1.5 print:py-1 font-medium">
                              {referenceText}
                            </td>
                            <td className="px-4 py-3 print:px-1.5 print:py-1">
                              {expense.account?.name || "-"}
                            </td>
                            <td className="px-4 py-3 print:px-1.5 print:py-1">
                              {expense.incomeExpenseCategory?.name || expense.category?.name || "-"}
                            </td>
                            <td className="px-4 py-3 print:px-1.5 print:py-1 text-right font-medium text-red-600 dark:text-red-500">
                              {formatCurrency(expense.amount || 0, { generalSettings })}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ))}

              <div className="mt-8 border-t-2 border-slate-300 dark:border-slate-700 print:border-slate-400 pt-2">
                <table className="w-full text-sm text-left print:text-[11px]">
                  <tfoot className="bg-slate-50 dark:bg-slate-800/50 font-bold print:bg-transparent">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 print:px-1.5 print:py-1 text-right">Grand Total ({summaries.totalTransactions} transactions):</td>
                      <td className="px-4 py-3 print:px-1.5 print:py-1 text-right text-red-600 dark:text-red-500">{formatCurrency(summaries.totalExpense, { generalSettings })}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
