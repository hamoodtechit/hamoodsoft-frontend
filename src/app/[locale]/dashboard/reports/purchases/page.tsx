"use client"

import { PrintHeader } from "@/components/common/PrintHeader"
import { ReportActionButtons } from "@/components/common/ReportActionButtons"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { usePurchases } from "@/lib/hooks/use-purchases"
import { formatCurrency } from "@/lib/utils/currency"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { Loader2 } from "lucide-react"

export default function PurchasesReportPage() {
  const t = useTranslations("purchases")
  const { selectedBranchId } = useBranchSelection()
  const { generalSettings } = useAppSettings()

  // Default to this month
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })

  const { data: purchasesData, isLoading } = usePurchases({
    branchId: selectedBranchId || undefined,
    startDate: dateRange.from ? new Date(dateRange.from).toISOString() : undefined,
    endDate: dateRange.to ? new Date(dateRange.to).toISOString() : undefined,
    limit: 1000, // Fetch a large number for reporting
  })

  const purchases = purchasesData?.items || []

  // Calculate summaries
  const summaries = useMemo(() => {
    let totalPurchases = 0
    let totalTax = 0
    let paidAmount = 0

    purchases.forEach(purchase => {
      totalPurchases += purchase.totalPrice || 0
      totalTax += purchase.taxAmount || 0
      paidAmount += purchase.paidAmount || 0
    })

    return {
      totalPurchases,
      totalTax,
      paidAmount,
      dueAmount: totalPurchases - paidAmount,
      totalTransactions: purchases.length
    }
  }, [purchases])

  return (
    <div className="space-y-6">
      {/* Hidden on screen, visible on print */}
      <PrintHeader 
        title="Purchase Report" 
        dateRange={{ 
          from: dateRange.from ? new Date(dateRange.from) : new Date(), 
          to: dateRange.to ? new Date(dateRange.to) : undefined 
        }} 
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Purchase Report
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            View and print your purchase transactions history.
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

      {/* Summary Cards - Screen only */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaries.totalPurchases, { generalSettings })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Tax</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaries.totalTax, { generalSettings })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Amount Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">
              {formatCurrency(summaries.paidAmount, { generalSettings })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaries.totalTransactions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Print Summary - Print only */}
      <div className="hidden print:flex print:flex-wrap print:gap-x-12 print:gap-y-2 print:mb-6 print:py-3 print:border-y print:border-slate-200">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Total Purchases:</span>
          <span className="text-sm font-bold text-slate-900">{formatCurrency(summaries.totalPurchases, { generalSettings })}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Total Tax:</span>
          <span className="text-sm font-bold text-slate-900">{formatCurrency(summaries.totalTax, { generalSettings })}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Amount Paid:</span>
          <span className="text-sm font-bold text-slate-900">{formatCurrency(summaries.paidAmount, { generalSettings })}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Transactions:</span>
          <span className="text-sm font-bold text-slate-900">{summaries.totalTransactions}</span>
        </div>
      </div>

      {/* Data Table */}
      <Card className="print:shadow-none print:border-0">
        <CardContent className="p-0 print:p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              No purchases found for the selected period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300 print:bg-transparent border-y print:border-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">PO Number</th>
                    <th className="px-4 py-3 font-semibold">Supplier</th>
                    <th className="px-4 py-3 font-semibold text-right">Items</th>
                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 print-break-inside-avoid">
                      <td className="px-4 py-3">
                        {purchase.createdAt ? format(new Date(purchase.createdAt), "MMM dd, yyyy HH:mm") : "-"}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {purchase.poNumber || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {purchase.contact?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {purchase.items?.length || 0}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge 
                          variant={purchase.status === "COMPLETED" ? "default" : "secondary"}
                          className="print-exact"
                        >
                          {purchase.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(purchase.totalPrice || 0, { generalSettings })}
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
