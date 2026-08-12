"use client"

import { BackButton } from "@/components/common/back-button"
import { PrintHeader } from "@/components/common/PrintHeader"
import { ReportActionButtons } from "@/components/common/ReportActionButtons"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { useSales } from "@/lib/hooks/use-sales"
import { formatCurrency } from "@/lib/utils/currency"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { Loader2, Search } from "lucide-react"
import { ReportSummary } from "@/components/reports/ReportSummary"
import { cn } from "@/lib/utils"

export default function SalesReportPage() {
  const t = useTranslations("sales")
  const { selectedBranchId } = useBranchSelection()
  const { generalSettings } = useAppSettings()

  // Default to this month
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL")

  const { data: salesData, isLoading } = useSales({
    branchId: selectedBranchId || undefined,
    startDate: dateRange.from ? new Date(dateRange.from).toISOString() : undefined,
    endDate: dateRange.to ? new Date(dateRange.to).toISOString() : undefined,
    limit: 1000,
  })

  const rawSales = salesData?.items || []

  // Filter sales
  const sales = useMemo(() => {
    return rawSales.filter(sale => {
      if (paymentStatusFilter !== "ALL" && sale.paymentStatus !== paymentStatusFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const inv = (sale.invoiceNumber || "").toLowerCase()
        const cust = (sale.contact?.name || "").toLowerCase()
        if (!inv.includes(q) && !cust.includes(q)) {
          return false
        }
      }
      return true
    })
  }, [rawSales, paymentStatusFilter, searchQuery])

  // Calculate summaries
  const summaries = useMemo(() => {
    let totalRevenue = 0
    let totalTax = 0
    let totalDiscount = 0
    let paidAmount = 0
    let dueAmount = 0
    let totalItemCount = 0

    sales.forEach(sale => {
      const total = sale.totalPrice ?? sale.totalAmount ?? 0
      const paid = sale.paidAmount ?? 0
      const due = Math.max(0, total - paid)

      totalRevenue += total
      totalTax += sale.taxAmount || 0
      totalDiscount += sale.discountAmount || 0
      paidAmount += paid
      dueAmount += due
      totalItemCount += sale.saleItems?.length || sale.items?.length || 0
    })

    return {
      totalRevenue,
      totalTax,
      totalDiscount,
      paidAmount,
      dueAmount,
      totalItemCount,
      totalTransactions: sales.length
    }
  }, [sales])

  return (
    <div className="space-y-6">
      {/* Hidden on screen, visible on print */}
      <PrintHeader 
        title="Sales Reports" 
        dateRange={{ 
          from: dateRange.from ? new Date(dateRange.from) : new Date(), 
          to: dateRange.to ? new Date(dateRange.to) : undefined 
        }} 
      />

      <div className="print:hidden">
        <BackButton href="/dashboard#reports-section" />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Sales Reports
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            View and print your sales transactions history, total payable, paid and due amounts.
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
            <Label htmlFor="status-filter">Payment Status</Label>
            <select 
              id="status-filter"
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="flex h-10 w-full min-w-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="ALL">All Statuses</option>
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
                placeholder="Search invoice or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Summary Cards */}
      <ReportSummary 
        items={[
          { label: "Total Sales", value: formatCurrency(summaries.totalRevenue, { generalSettings }) },
          { label: "Amount Paid", value: formatCurrency(summaries.paidAmount, { generalSettings }), valueClassName: "text-emerald-600 dark:text-emerald-400" },
          { label: "Amount Due", value: formatCurrency(summaries.dueAmount, { generalSettings }), valueClassName: summaries.dueAmount > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-400" },
          { label: "Total Tax", value: formatCurrency(summaries.totalTax, { generalSettings }) },
          { label: "Total Discount", value: formatCurrency(summaries.totalDiscount, { generalSettings }) },
          { label: "Total Sales Count", value: summaries.totalTransactions }
        ]} 
      />

      {/* Data Table */}
      <Card className="print:shadow-none print:border-0">
        <CardContent className="p-0 print:p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              No sales found for the selected criteria.
            </div>
          ) : (
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-sm text-left border-collapse print:text-[11px] print:w-full">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300 print:bg-transparent border-y print:border-slate-300 print:text-[10px]">
                  <tr>
                    <th className="px-4 py-3 print:px-1.5 print:py-1 font-semibold">Date</th>
                    <th className="px-4 py-3 print:px-1.5 print:py-1 font-semibold">Invoice No</th>
                    <th className="px-4 py-3 print:px-1.5 print:py-1 font-semibold">Customer</th>
                    <th className="px-4 py-3 print:px-1.5 print:py-1 font-semibold text-right">Items</th>
                    <th className="px-4 py-3 print:px-1.5 print:py-1 font-semibold text-center print:hidden">Status</th>
                    <th className="px-4 py-3 print:px-1.5 print:py-1 font-semibold text-right">
                      <span className="print:hidden">Total Amount</span>
                      <span className="hidden print:inline">Total</span>
                    </th>
                    <th className="px-4 py-3 print:px-1.5 print:py-1 font-semibold text-right">
                      <span className="print:hidden">Paid Amount</span>
                      <span className="hidden print:inline">Paid</span>
                    </th>
                    <th className="px-4 py-3 print:px-1.5 print:py-1 font-semibold text-right">
                      <span className="print:hidden">Due Amount</span>
                      <span className="hidden print:inline">Due</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-200">
                  {sales.map((sale) => {
                    const total = sale.totalPrice ?? sale.totalAmount ?? 0
                    const paid = sale.paidAmount ?? 0
                    const due = Math.max(0, total - paid)
                    const itemCount = sale.saleItems?.length || sale.items?.length || 0

                    return (
                      <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 print-break-inside-avoid">
                        <td className="px-4 py-3 print:px-1.5 print:py-1 whitespace-nowrap">
                          {sale.createdAt ? format(new Date(sale.createdAt), "MMM dd, yyyy") : "-"}
                        </td>
                        <td className="px-4 py-3 print:px-1.5 print:py-1 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {sale.invoiceNumber || "-"}
                        </td>
                        <td className="px-4 py-3 print:px-1.5 print:py-1">
                          {sale.contact?.name || "-"}
                        </td>
                        <td className="px-4 py-3 print:px-1.5 print:py-1 text-right">
                          {itemCount}
                        </td>
                        <td className="px-4 py-3 print:px-1.5 print:py-1 text-center print:hidden">
                          <Badge 
                            variant={sale.paymentStatus === "PAID" ? "default" : sale.paymentStatus === "PARTIAL" ? "outline" : "secondary"}
                            className={cn(
                              "print-exact",
                              sale.paymentStatus === "PAID" && "bg-emerald-600 hover:bg-emerald-700 text-white",
                              sale.paymentStatus === "PARTIAL" && "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
                              sale.paymentStatus === "DUE" && "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300"
                            )}
                          >
                            {sale.paymentStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 print:px-1.5 print:py-1 text-right font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {formatCurrency(total, { generalSettings })}
                        </td>
                        <td className="px-4 py-3 print:px-1.5 print:py-1 text-right font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {formatCurrency(paid, { generalSettings })}
                        </td>
                        <td className="px-4 py-3 print:px-1.5 print:py-1 text-right font-medium whitespace-nowrap">
                          {due > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">
                              {formatCurrency(due, { generalSettings })}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-slate-100 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-700 print:bg-transparent print:border-slate-400">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 print:px-1.5 print:py-1 text-left">
                      Total ({summaries.totalTransactions} transactions)
                    </td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 text-right">{summaries.totalItemCount}</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 text-center print:hidden">-</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 text-right text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {formatCurrency(summaries.totalRevenue, { generalSettings })}
                    </td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 text-right text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatCurrency(summaries.paidAmount, { generalSettings })}
                    </td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 text-right text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      {formatCurrency(summaries.dueAmount, { generalSettings })}
                    </td>
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

