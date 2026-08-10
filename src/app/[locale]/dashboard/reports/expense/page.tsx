"use client"

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
import { Loader2 } from "lucide-react"

export default function ExpenseReportPage() {
  const t = useTranslations("accounting")
  const { selectedBranchId } = useBranchSelection()
  const { generalSettings } = useAppSettings()

  // Default to this month
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })

  const { data: transactionsData, isLoading } = useTransactions({
    branchId: selectedBranchId || undefined,
    type: "EXPENSE",
    startDate: dateRange.from ? new Date(dateRange.from).toISOString() : undefined,
    endDate: dateRange.to ? new Date(dateRange.to).toISOString() : undefined,
    limit: 1000, // Fetch a large number for reporting
  })

  const expenses = transactionsData?.items || []

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

  return (
    <div className="space-y-6">
      {/* Hidden on screen, visible on print */}
      <PrintHeader 
        title="Expense Report" 
        dateRange={{ 
          from: dateRange.from ? new Date(dateRange.from) : new Date(), 
          to: dateRange.to ? new Date(dateRange.to) : undefined 
        }} 
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Expense Report
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
        </CardContent>
      </Card>

      {/* Summary Cards - Visible on both screen and print */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="print-break-inside-avoid print:shadow-none print:border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-500">
              {formatCurrency(summaries.totalExpense, { generalSettings })}
            </div>
          </CardContent>
        </Card>
        <Card className="print-break-inside-avoid print:shadow-none print:border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaries.totalTransactions}</div>
          </CardContent>
        </Card>
      </div>

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
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300 print-exact border-y">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Reference</th>
                    <th className="px-4 py-3 font-semibold">Account</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 print-break-inside-avoid">
                      <td className="px-4 py-3">
                        {expense.createdAt ? format(new Date(expense.createdAt), "MMM dd, yyyy HH:mm") : "-"}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {expense.referenceId || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {expense.account?.name || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {expense.incomeExpenseCategory?.name || expense.category?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-red-600 dark:text-red-500">
                        {formatCurrency(expense.amount || 0, { generalSettings })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
