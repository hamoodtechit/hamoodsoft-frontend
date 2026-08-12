"use client"

import { BackButton } from "@/components/common/back-button"
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
import { Loader2, Search } from "lucide-react"
import { ReportSummary } from "@/components/reports/ReportSummary"

export default function PurchasesReportPage() {
  const t = useTranslations("purchases")
  const { selectedBranchId } = useBranchSelection()
  const { generalSettings } = useAppSettings()

  // Default to this month
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL")

  const { data: purchasesData, isLoading } = usePurchases({
    branchId: selectedBranchId || undefined,
    startDate: dateRange.from ? new Date(dateRange.from).toISOString() : undefined,
    endDate: dateRange.to ? new Date(dateRange.to).toISOString() : undefined,
    limit: 1000, // Fetch a large number for reporting
  })

  const rawPurchases = purchasesData?.items || []

  // Filter purchases
  const purchases = useMemo(() => {
    return rawPurchases.filter(purchase => {
      if (paymentStatusFilter !== "ALL" && purchase.paymentStatus !== paymentStatusFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const po = (purchase.poNumber || "").toLowerCase()
        const cust = (purchase.contact?.name || "").toLowerCase()
        if (!po.includes(q) && !cust.includes(q)) {
          return false
        }
      }
      return true
    })
  }, [rawPurchases, paymentStatusFilter, searchQuery])

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
        title="Purchase Reports"
        dateRange={{
          from: dateRange.from ? new Date(dateRange.from) : new Date(),
          to: dateRange.to ? new Date(dateRange.to) : undefined
        }}
      />

      <BackButton href="/dashboard#reports-section" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 print:hidden !mt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Purchase Reports
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

          <div className="space-y-1.5">
            <Label htmlFor="status-filter">Status</Label>
            <select
              id="status-filter"
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="flex h-10 w-full min-w-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="DUE">Due</option>
            </select>
          </div>

          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <Label htmlFor="search-input">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                id="search-input"
                type="text"
                placeholder="Search PO or supplier..."
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
          { label: "Total Purchases", value: formatCurrency(summaries.totalPurchases, { generalSettings }) },
          { label: "Total Tax", value: formatCurrency(summaries.totalTax, { generalSettings }) },
          { label: "Amount Paid", value: formatCurrency(summaries.paidAmount, { generalSettings }), valueClassName: "text-blue-600 dark:text-blue-500" },
          { label: "Due Amount", value: formatCurrency(summaries.dueAmount, { generalSettings }), valueClassName: "text-red-600 dark:text-red-500" },
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
          ) : purchases.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              No purchases found for the selected period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300 print:bg-transparent border-y print:border-slate-300 print:text-[11px]">
                  <tr>
                    <th className="px-4 py-3 print:px-1.5 print:py-1 font-semibold">Date</th>
                    <th className="px-4 py-3 print:px-1.5 print:py-1 font-semibold">PO Number</th>
                    <th className="px-4 py-3 print:px-1.5 print:py-1 font-semibold">Supplier</th>
                    <th className="px-4 py-3 print:px-1.5 print:py-1 font-semibold text-right">Items</th>
                    <th className="px-4 py-3 print:px-1.5 print:py-1 font-semibold text-center print:hidden">Status</th>
                    <th className="px-4 py-3 print:px-1.5 print:py-1 font-semibold text-right">Total</th>
                    <th className="px-4 py-3 print:px-1.5 print:py-1 font-semibold text-right">Paid</th>
                    <th className="px-4 py-3 print:px-1.5 print:py-1 font-semibold text-right">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:text-[11px]">
                  {purchases.map((purchase) => {
                    const total = purchase.totalPrice ?? purchase.totalAmount ?? 0;
                    const paid = purchase.paidAmount ?? 0;
                    const due = Math.max(0, total - paid);
                    
                    return (
                      <tr key={purchase.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 print-break-inside-avoid">
                        <td className="px-4 py-3 print:px-1.5 print:py-1 whitespace-nowrap">
                          {purchase.createdAt ? format(new Date(purchase.createdAt), "MMM dd, yyyy") : "-"}
                        </td>
                        <td className="px-4 py-3 print:px-1.5 print:py-1 font-medium whitespace-nowrap">
                          {purchase.poNumber || "-"}
                        </td>
                        <td className="px-4 py-3 print:px-1.5 print:py-1">
                          {purchase.contact?.name || "-"}
                        </td>
                        <td className="px-4 py-3 print:px-1.5 print:py-1 text-right">
                          {purchase.items?.length || purchase.purchaseItems?.length || 0}
                        </td>
                        <td className="px-4 py-3 print:px-1.5 print:py-1 text-center print:hidden">
                          <Badge
                            variant={purchase.status === "COMPLETED" ? "default" : "secondary"}
                            className="print-exact"
                          >
                            {purchase.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 print:px-1.5 print:py-1 text-right font-medium">
                          {formatCurrency(total, { generalSettings })}
                        </td>
                        <td className="px-4 py-3 print:px-1.5 print:py-1 text-right text-green-600 dark:text-green-500">
                          {formatCurrency(paid, { generalSettings })}
                        </td>
                        <td className="px-4 py-3 print:px-1.5 print:py-1 text-right text-red-600 dark:text-red-500 font-medium">
                          {formatCurrency(due, { generalSettings })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-800/50 font-bold border-t-2 border-slate-200 dark:border-slate-700 print:text-[11px] print:bg-transparent print:border-t-2 print:border-black">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 print:px-1.5 print:py-1 text-right">Grand Total ({summaries.totalTransactions} POs):</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 text-right">-</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 print:hidden"></td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 text-right">{formatCurrency(summaries.totalPurchases, { generalSettings })}</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 text-right text-green-600 dark:text-green-500">{formatCurrency(summaries.paidAmount, { generalSettings })}</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 text-right text-red-600 dark:text-red-500">{formatCurrency(summaries.dueAmount, { generalSettings })}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
