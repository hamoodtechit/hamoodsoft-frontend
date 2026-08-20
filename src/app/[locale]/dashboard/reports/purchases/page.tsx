"use client"

import { BackButton } from "@/components/common/back-button"
import { PrintHeader } from "@/components/common/PrintHeader"
import { ReportActionButtons } from "@/components/common/ReportActionButtons"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { usePurchasesReports } from "@/lib/hooks/use-reports"
import { formatCurrency } from "@/lib/utils/currency"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { format, startOfMonth, endOfMonth, isBefore, startOfDay } from "date-fns"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { Loader2, Search } from "lucide-react"
import { ReportSummary } from "@/components/reports/ReportSummary"

export default function PurchasesReportPage() {
  const t = useTranslations("purchases")
  const { selectedBranchId } = useBranchSelection()
  const { generalSettings } = useAppSettings()

  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })
  const [searchQuery, setSearchQuery] = useState("")

  const { data: reportData, isLoading } = usePurchasesReports({
    branchId: selectedBranchId || "",
    startDate: dateRange.from ? new Date(dateRange.from).toISOString() : undefined,
    endDate: dateRange.to ? new Date(dateRange.to).toISOString() : undefined,
  })

  const rawPurchases = reportData?.purchases || []
  const rawReturns = reportData?.returns || []
  const rawPayments = reportData?.payments || []

  // Filter Purchases
  const purchases = useMemo(() => {
    return rawPurchases.filter(purchase => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const po = (purchase.poNumber || "").toLowerCase()
        const supp = (purchase.contact?.name || "").toLowerCase()
        if (!po.includes(q) && !supp.includes(q)) return false
      }
      return true
    })
  }, [rawPurchases, searchQuery])

  // Filter Due Payments (Payments for purchases created BEFORE the selected startDate)
  const duePayments = useMemo(() => {
    const fromDate = dateRange.from ? startOfDay(new Date(dateRange.from)) : new Date(0)
    return rawPayments.filter(payment => {
      if (!payment.purchase?.createdAt) return false
      const purchaseDate = new Date(payment.purchase.createdAt)
      // It is a "Due Payment" if the original purchase was before the report's start date
      if (!isBefore(purchaseDate, fromDate)) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const po = (payment.purchase.poNumber || "").toLowerCase()
        const supp = (payment.contact?.name || "").toLowerCase()
        if (!po.includes(q) && !supp.includes(q)) return false
      }
      return true
    })
  }, [rawPayments, dateRange.from, searchQuery])

  // Summaries
  const summaries = useMemo(() => {
    let totalPurchases = 0
    let totalTax = 0
    let totalReturns = 0
    let paidViaCashBank = 0
    let paidViaBalance = 0

    purchases.forEach(purchase => {
      totalPurchases += purchase.totalPrice ?? 0
      totalTax += purchase.taxAmount || 0
    })

    rawReturns.forEach(ret => {
      totalReturns += ret.totalPrice ?? 0
    })

    rawPayments.forEach(payment => {
      if (payment.accountId) {
        paidViaCashBank += payment.amount
      } else {
        paidViaBalance += payment.amount
      }
    })

    return {
      totalPurchases,
      totalTax,
      totalReturns,
      paidViaCashBank,
      paidViaBalance,
      totalTransactions: purchases.length,
      totalDuePayments: duePayments.length,
      totalReturnsCount: rawReturns.length
    }
  }, [purchases, rawReturns, rawPayments, duePayments])

  return (
    <div className="space-y-6">
      <PrintHeader
        title="Comprehensive Purchase Statement"
        dateRange={{
          from: dateRange.from ? new Date(dateRange.from) : new Date(),
          to: dateRange.to ? new Date(dateRange.to) : undefined
        }}
      />

      <BackButton href="/dashboard#reports-section" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 print:hidden !mt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Purchase Statement
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Consolidated view of purchases, payments to suppliers, and returns.
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
                placeholder="Search PO Number or supplier..."
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
            { label: "Total Purchases", value: formatCurrency(summaries.totalPurchases, { generalSettings }) },
            { label: "Total Tax", value: formatCurrency(summaries.totalTax, { generalSettings }) },
            { label: "Total Returns", value: formatCurrency(summaries.totalReturns, { generalSettings }), valueClassName: summaries.totalReturns > 0 ? "text-rose-600 dark:text-rose-400" : "" },
            { label: "Total Paid (Cash/Bank)", value: formatCurrency(summaries.paidViaCashBank, { generalSettings }), valueClassName: "text-amber-600 dark:text-amber-400" },
            { label: "Paid via Supplier Balance", value: formatCurrency(summaries.paidViaBalance, { generalSettings }), valueClassName: "text-blue-600 dark:text-blue-400" },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* DAILY PURCHASES TABLE */}
          <Card className="print:shadow-none print:border-0">
            <CardContent className="p-4 print:p-0">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2 print:mb-1 text-center print:text-[14px]">Purchase Orders ({summaries.totalTransactions})</h3>
              {purchases.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-sm">No purchases found.</div>
              ) : (
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full text-sm text-left border-collapse print:text-[11px] print:w-full border border-slate-200 dark:border-slate-800">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="px-3 py-2 border-b">PO Number</th>
                        <th className="px-3 py-2 border-b">Date</th>
                        <th className="px-3 py-2 border-b">Supplier</th>
                        <th className="px-3 py-2 border-b text-right">Tax</th>
                        <th className="px-3 py-2 border-b text-right">Total</th>
                        <th className="px-3 py-2 border-b text-right">Paid</th>
                        <th className="px-3 py-2 border-b text-right">Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {purchases.map((purchase) => {
                        const total = purchase.totalPrice ?? 0
                        const paid = purchase.paidAmount ?? 0
                        const due = Math.max(0, total - paid)
                        return (
                          <tr key={purchase.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                            <td className="px-3 py-2 font-medium">{purchase.poNumber}</td>
                            <td className="px-3 py-2">{purchase.createdAt ? format(new Date(purchase.createdAt), "dd MMM, hh:mm a") : "-"}</td>
                            <td className="px-3 py-2">{purchase.contact?.name || "-"}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(purchase.taxAmount ?? 0, { generalSettings })}</td>
                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(total, { generalSettings })}</td>
                            <td className="px-3 py-2 text-right text-amber-600 dark:text-amber-400">{formatCurrency(paid, { generalSettings })}</td>
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

          {/* DUE PAYMENTS TABLE */}
          <Card className="print:shadow-none print:border-0">
            <CardContent className="p-4 print:p-0">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2 print:mb-1 text-center print:text-[14px]">Payments for Previous Dues ({summaries.totalDuePayments})</h3>
              {duePayments.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-sm">No due payments found in this date range.</div>
              ) : (
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full text-sm text-left border-collapse print:text-[11px] print:w-full border border-slate-200 dark:border-slate-800">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="px-3 py-2 border-b">PO Number</th>
                        <th className="px-3 py-2 border-b">Payment Date</th>
                        <th className="px-3 py-2 border-b">Original Purchase Date</th>
                        <th className="px-3 py-2 border-b text-right">Paid Amount</th>
                        <th className="px-3 py-2 border-b text-right">Payment Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {duePayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="px-3 py-2 font-medium">{payment.purchase?.poNumber || "-"}</td>
                          <td className="px-3 py-2">{payment.occurredAt ? format(new Date(payment.occurredAt), "dd MMM, hh:mm a") : "-"}</td>
                          <td className="px-3 py-2">{payment.purchase?.createdAt ? format(new Date(payment.purchase.createdAt), "dd MMM, yyyy") : "-"}</td>
                          <td className="px-3 py-2 text-right font-medium text-amber-600 dark:text-amber-400">{formatCurrency(payment.amount, { generalSettings })}</td>
                          <td className="px-3 py-2 text-right text-slate-600">{payment.account?.name || "Supplier Balance"}</td>
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
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2 print:mb-1 text-center print:text-[14px]">Purchase Returns ({summaries.totalReturnsCount})</h3>
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full text-sm text-left border-collapse print:text-[11px] print:w-full border border-slate-200 dark:border-slate-800">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="px-3 py-2 border-b">Original PO No (First Item)</th>
                        <th className="px-3 py-2 border-b">Return Date</th>
                        <th className="px-3 py-2 border-b">Supplier</th>
                        <th className="px-3 py-2 border-b text-right">Return Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {rawReturns.map((ret) => {
                        const poNumber = ret.purchaseItems?.[0]?.purchase?.poNumber || "-"
                        return (
                          <tr key={ret.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 text-rose-600 dark:text-rose-400">
                            <td className="px-3 py-2 font-medium">{poNumber}</td>
                            <td className="px-3 py-2">{ret.createdAt ? format(new Date(ret.createdAt), "dd MMM, hh:mm a") : "-"}</td>
                            <td className="px-3 py-2">{ret.contact?.name || "-"}</td>
                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(ret.totalPrice ?? 0, { generalSettings })}</td>
                          </tr>
                        )
                      })}
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
