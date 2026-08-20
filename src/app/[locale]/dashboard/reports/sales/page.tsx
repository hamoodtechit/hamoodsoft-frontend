"use client"

import { BackButton } from "@/components/common/back-button"
import { PrintHeader } from "@/components/common/PrintHeader"
import { ReportActionButtons } from "@/components/common/ReportActionButtons"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { useSalesReports } from "@/lib/hooks/use-reports"
import { formatCurrency } from "@/lib/utils/currency"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { format, startOfMonth, endOfMonth, isBefore, startOfDay } from "date-fns"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { Loader2, Search } from "lucide-react"
import { ReportSummary } from "@/components/reports/ReportSummary"
import { cn } from "@/lib/utils"

export default function SalesReportPage() {
  const t = useTranslations("sales")
  const { selectedBranchId } = useBranchSelection()
  const { generalSettings } = useAppSettings()

  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })
  const [searchQuery, setSearchQuery] = useState("")

  const { data: reportData, isLoading } = useSalesReports({
    branchId: selectedBranchId || "",
    startDate: dateRange.from ? new Date(dateRange.from).toISOString() : undefined,
    endDate: dateRange.to ? new Date(dateRange.to).toISOString() : undefined,
  })

  const rawSales = reportData?.sales || []
  const rawReturns = reportData?.returns || []
  const rawCollections = reportData?.collections || []

  // Filter Sales
  const sales = useMemo(() => {
    return rawSales.filter(sale => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const inv = (sale.invoiceNumber || "").toLowerCase()
        const cust = (sale.contact?.name || "").toLowerCase()
        if (!inv.includes(q) && !cust.includes(q)) return false
      }
      return true
    })
  }, [rawSales, searchQuery])

  // Filter Due Collections (Payments for sales created BEFORE the selected startDate)
  const dueCollections = useMemo(() => {
    const fromDate = dateRange.from ? startOfDay(new Date(dateRange.from)) : new Date(0)
    return rawCollections.filter(collection => {
      if (!collection.sale?.createdAt) return false
      const saleDate = new Date(collection.sale.createdAt)
      // It is a "Due Collection" if the original sale was before the report's start date
      if (!isBefore(saleDate, fromDate)) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const inv = (collection.sale.invoiceNumber || "").toLowerCase()
        const cust = (collection.contact?.name || "").toLowerCase()
        if (!inv.includes(q) && !cust.includes(q)) return false
      }
      return true
    })
  }, [rawCollections, dateRange.from, searchQuery])

  // Summaries
  const summaries = useMemo(() => {
    let totalSales = 0
    let totalTax = 0
    let totalDiscount = 0
    let totalReturns = 0
    let paidViaCashBank = 0
    let paidViaBalance = 0

    sales.forEach(sale => {
      totalSales += sale.totalPrice ?? sale.totalAmount ?? 0
      totalTax += sale.taxAmount || 0
      totalDiscount += sale.discountAmount || 0
    })

    rawReturns.forEach(ret => {
      totalReturns += ret.totalAmount ?? 0
    })

    rawCollections.forEach(collection => {
      if (collection.accountId) {
        paidViaCashBank += collection.amount
      } else {
        paidViaBalance += collection.amount
      }
    })

    return {
      totalSales,
      totalTax,
      totalDiscount,
      totalReturns,
      paidViaCashBank,
      paidViaBalance,
      netCashFlow: paidViaCashBank, // For now, ignoring refunds given out in cash
      totalTransactions: sales.length,
      totalCollections: dueCollections.length,
      totalReturnsCount: rawReturns.length
    }
  }, [sales, rawReturns, rawCollections, dueCollections])

  return (
    <div className="space-y-6">
      <PrintHeader
        title="Sales Statement"
        dateRange={{
          from: dateRange.from ? new Date(dateRange.from) : new Date(),
          to: dateRange.to ? new Date(dateRange.to) : undefined
        }}
      />

      <BackButton href="/dashboard#reports-section" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 print:hidden !mt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Sales Statement
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Consolidated view of sales, collections, and returns.
          </p>
        </div>
        <ReportActionButtons />
      </div>

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

      {/* CONSOLIDATED SUMMARY */}
      <div className="print:block">
        {/* <h2 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-200">Consolidated Summary</h2> */}
        <ReportSummary
          items={[
            { label: "Total Sales", value: formatCurrency(summaries.totalSales, { generalSettings }) },
            { label: "Total Discount", value: formatCurrency(summaries.totalDiscount, { generalSettings }) },
            { label: "Total Tax", value: formatCurrency(summaries.totalTax, { generalSettings }) },
            { label: "Total Returns", value: formatCurrency(summaries.totalReturns, { generalSettings }), valueClassName: summaries.totalReturns > 0 ? "text-rose-600 dark:text-rose-400" : "" },
            { label: "Total Receipts (Cash/Bank)", value: formatCurrency(summaries.paidViaCashBank, { generalSettings }), valueClassName: "text-emerald-600 dark:text-emerald-400" },
            { label: "Sales Paid via Balance", value: formatCurrency(summaries.paidViaBalance, { generalSettings }), valueClassName: "text-amber-600 dark:text-amber-400" },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* DAILY SALES TABLE */}
          <Card className="print:shadow-none print:border-0">
            <CardContent className="p-4 print:p-0">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2 print:mb-1 text-center print:text-[14px]">Sales Invoices ({summaries.totalTransactions})</h3>
              {sales.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-sm">No sales found.</div>
              ) : (
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full text-sm text-left border-collapse print:text-[11px] print:w-full border border-slate-200 dark:border-slate-800">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="px-3 py-2 border-b">Invoice No</th>
                        <th className="px-3 py-2 border-b">Date</th>
                        <th className="px-3 py-2 border-b">Customer</th>
                        <th className="px-3 py-2 border-b text-right">Tax</th>
                        <th className="px-3 py-2 border-b text-right">Total</th>
                        <th className="px-3 py-2 border-b text-right">Paid</th>
                        <th className="px-3 py-2 border-b text-right">Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {sales.map((sale) => {
                        const total = sale.totalPrice ?? sale.totalAmount ?? 0
                        const paid = sale.paidAmount ?? 0
                        const due = Math.max(0, total - paid)
                        return (
                          <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                            <td className="px-3 py-2 font-medium">{sale.invoiceNumber}</td>
                            <td className="px-3 py-2">{sale.createdAt ? format(new Date(sale.createdAt), "dd MMM, hh:mm a") : "-"}</td>
                            <td className="px-3 py-2">{sale.contact?.name || "-"}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(sale.taxAmount ?? 0, { generalSettings })}</td>
                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(total, { generalSettings })}</td>
                            <td className="px-3 py-2 text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(paid, { generalSettings })}</td>
                            <td className="px-3 py-2 text-right">{due > 0 ? <span className="text-rose-600 dark:text-rose-400">{formatCurrency(due, { generalSettings })}</span> : "-"}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* DUE COLLECTIONS TABLE */}
          <Card className="print:shadow-none print:border-0">
            <CardContent className="p-4 print:p-0">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2 print:mb-1 text-center print:text-[14px]">Due Collections ({summaries.totalCollections})</h3>
              {dueCollections.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-sm">No due collections found in this date range.</div>
              ) : (
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full text-sm text-left border-collapse print:text-[11px] print:w-full border border-slate-200 dark:border-slate-800">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="px-3 py-2 border-b">Invoice No</th>
                        <th className="px-3 py-2 border-b">Collection Date</th>
                        <th className="px-3 py-2 border-b">Original Sale Date</th>
                        <th className="px-3 py-2 border-b text-right">Collected Amount</th>
                        <th className="px-3 py-2 border-b text-right">Payment Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {dueCollections.map((col) => (
                        <tr key={col.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="px-3 py-2 font-medium">{col.sale?.invoiceNumber || "-"}</td>
                          <td className="px-3 py-2">{col.occurredAt ? format(new Date(col.occurredAt), "dd MMM, hh:mm a") : "-"}</td>
                          <td className="px-3 py-2">{col.sale?.createdAt ? format(new Date(col.sale.createdAt), "dd MMM, yyyy") : "-"}</td>
                          <td className="px-3 py-2 text-right font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(col.amount, { generalSettings })}</td>
                          <td className="px-3 py-2 text-right text-slate-600">{col.account?.name || "Customer Balance"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* RETURNS TABLE */}
          {rawReturns.length > 0 && (
            <Card className="print:shadow-none print:border-0">
              <CardContent className="p-4 print:p-0">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2 print:mb-1 text-center print:text-[14px]">Sales Returns ({summaries.totalReturnsCount})</h3>
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full text-sm text-left border-collapse print:text-[11px] print:w-full border border-slate-200 dark:border-slate-800">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="px-3 py-2 border-b">Original Invoice No</th>
                        <th className="px-3 py-2 border-b">Return Date</th>
                        <th className="px-3 py-2 border-b">Customer</th>
                        <th className="px-3 py-2 border-b text-right">Total Amount</th>
                        <th className="px-3 py-2 border-b text-right">Refund Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {rawReturns.map((ret) => (
                        <tr key={ret.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 text-rose-600 dark:text-rose-400">
                          <td className="px-3 py-2 font-medium">{ret.sale?.invoiceNumber || "-"}</td>
                          <td className="px-3 py-2">{ret.createdAt ? format(new Date(ret.createdAt), "dd MMM, hh:mm a") : "-"}</td>
                          <td className="px-3 py-2">{ret.contact?.name || "-"}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(ret.totalAmount ?? 0, { generalSettings })}</td>
                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(ret.refundAmount ?? 0, { generalSettings })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      )}
    </div>
  )
}
