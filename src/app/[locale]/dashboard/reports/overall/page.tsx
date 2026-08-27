"use client"

import { BackButton } from "@/components/common/back-button"
import { PrintHeader } from "@/components/common/PrintHeader"
import { ReportActionButtons } from "@/components/common/ReportActionButtons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { useOverallReport } from "@/lib/hooks/use-reports"
import { formatCurrency } from "@/lib/utils/currency"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { Loader2, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Activity, ArrowUpRight, ArrowDownRight, Layers } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

export default function OverallReportPage() {
  const { selectedBranchId } = useBranchSelection()
  const { generalSettings } = useAppSettings()

  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })

  const { data, isLoading } = useOverallReport({
    branchId: selectedBranchId || "",
    startDate: dateRange.from ? new Date(dateRange.from).toISOString() : undefined,
    endDate: dateRange.to ? new Date(dateRange.to).toISOString() : undefined,
  })

  const netSales = (data?.totalSales ?? 0) - (data?.totalSaleReturns ?? 0)
  const netPurchases = (data?.totalPurchases ?? 0) - (data?.totalPurchaseReturns ?? 0)
  const totalRevenue = netSales + (data?.totalIncome ?? 0)
  const totalCosts = netPurchases + (data?.totalExpense ?? 0)
  const isProfit = (data?.netProfit ?? 0) >= 0;

  // Chart Data
  const revenueData = [
    { name: 'Net Sales', value: netSales > 0 ? netSales : 0, color: '#10b981' },
    { name: 'Direct Income', value: data?.totalIncome && data.totalIncome > 0 ? data.totalIncome : 0, color: '#3b82f6' },
  ].filter(d => d.value > 0)

  const costData = [
    { name: 'Net Purchases', value: netPurchases > 0 ? netPurchases : 0, color: '#f97316' },
    { name: 'Direct Expense', value: data?.totalExpense && data.totalExpense > 0 ? data.totalExpense : 0, color: '#f43f5e' },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-8 pb-12">
      <PrintHeader
        title="Profit & Loss Statement"
        dateRange={{
          from: dateRange.from ? new Date(dateRange.from) : new Date(),
          to: dateRange.to ? new Date(dateRange.to) : undefined
        }}
      />

      <div className="flex items-center gap-4">
        <BackButton href="/dashboard#reports-section" />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Profit & Loss Report
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            Financial performance overview and statement of income.
          </p>
        </div>
        <ReportActionButtons />
      </div>

      {/* FILTER BAR */}
      <Card className="print:hidden border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-5 items-end">
          <div className="space-y-1.5 min-w-[200px]">
            <Label htmlFor="date-from" className="text-slate-500 font-medium text-xs uppercase tracking-wider">Date From</Label>
            <Input
              id="date-from"
              type="date"
              className="bg-slate-50/50"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5 min-w-[200px]">
            <Label htmlFor="date-to" className="text-slate-500 font-medium text-xs uppercase tracking-wider">Date To</Label>
            <Input
              id="date-to"
              type="date"
              className="bg-slate-50/50"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-slate-500 font-medium animate-pulse">Calculating financials...</p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
          
          {/* HIGH LEVEL METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3">
            
            {/* Revenue Metric */}
            <Card className="border-emerald-100 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900 overflow-hidden relative">
              <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Total Revenue</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">
                      {formatCurrency(totalRevenue, { generalSettings })}
                    </h3>
                  </div>
                  <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2.5 rounded-xl shadow-sm">
                    <ArrowUpRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Costs Metric */}
            <Card className="border-rose-100 dark:border-rose-900/50 bg-gradient-to-br from-rose-50/50 to-white dark:from-rose-950/20 dark:to-slate-900 overflow-hidden relative">
              <div className="absolute right-0 top-0 w-24 h-24 bg-rose-500/10 rounded-bl-full pointer-events-none" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide">Total Costs</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">
                      {formatCurrency(totalCosts, { generalSettings })}
                    </h3>
                  </div>
                  <div className="bg-rose-100 dark:bg-rose-900/50 p-2.5 rounded-xl shadow-sm">
                    <ArrowDownRight className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Net Profit Metric */}
            <Card className={cn(
              "overflow-hidden relative border-2",
              isProfit ? "border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-950/20" : "border-red-500/50 bg-red-50/30 dark:bg-red-950/20"
            )}>
              <div className={cn(
                "absolute right-0 top-0 w-32 h-32 rounded-bl-full pointer-events-none",
                isProfit ? "bg-indigo-500/10" : "bg-red-500/10"
              )} />
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className={cn(
                      "text-sm font-semibold uppercase tracking-wide",
                      isProfit ? "text-indigo-600 dark:text-indigo-400" : "text-red-600 dark:text-red-400"
                    )}>
                      Net {isProfit ? "Profit" : "Loss"}
                    </p>
                    <h3 className={cn(
                      "text-4xl font-black mt-2",
                      isProfit ? "text-indigo-700 dark:text-indigo-400" : "text-red-700 dark:text-red-400"
                    )}>
                      {formatCurrency(Math.abs(data?.netProfit ?? 0), { generalSettings })}
                    </h3>
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl shadow-sm backdrop-blur-sm",
                    isProfit ? "bg-indigo-100 dark:bg-indigo-900/50" : "bg-red-100 dark:bg-red-900/50"
                  )}>
                    <Activity className={cn("h-6 w-6", isProfit ? "text-indigo-600 dark:text-indigo-400" : "text-red-600 dark:text-red-400")} />
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">
            
            {/* CHARTS (Hidden on print for cleaner layout) */}
            <div className="lg:col-span-5 space-y-6 print:hidden">
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-500" /> Revenue Composition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px] w-full">
                    {revenueData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={revenueData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {revenueData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any) => formatCurrency(Number(value) || 0, { generalSettings })}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400 text-sm italic">No revenue data</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-rose-500" /> Expense Composition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px] w-full">
                    {costData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={costData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {costData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any) => formatCurrency(Number(value) || 0, { generalSettings })}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400 text-sm italic">No cost data</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* STRUCTURED PNL TABLE */}
            <div className="lg:col-span-7">
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm h-full">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    Statement of Profit & Loss
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    For the period {format(new Date(dateRange.from), "MMM dd, yyyy")} to {format(new Date(dateRange.to), "MMM dd, yyyy")}
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <tbody>
                        
                        {/* REVENUE SECTION */}
                        <tr className="bg-emerald-50/30 dark:bg-emerald-950/10">
                          <td className="px-6 py-4 font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider text-xs" colSpan={2}>
                            Operating Revenue
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-3 pl-10 text-slate-600 dark:text-slate-300">Gross Sales</td>
                          <td className="px-6 py-3 text-right font-medium">{formatCurrency(data?.totalSales ?? 0, { generalSettings })}</td>
                        </tr>
                        <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-3 pl-10 text-slate-600 dark:text-slate-300">Less: Sales Returns</td>
                          <td className="px-6 py-3 text-right text-rose-500">({formatCurrency(data?.totalSaleReturns ?? 0, { generalSettings })})</td>
                        </tr>
                        <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/30">
                          <td className="px-6 py-3 pl-10 font-semibold text-slate-800 dark:text-slate-200">Net Sales</td>
                          <td className="px-6 py-3 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(netSales, { generalSettings })}</td>
                        </tr>
                        <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-3 pl-10 text-slate-600 dark:text-slate-300">Other Direct Income</td>
                          <td className="px-6 py-3 text-right font-medium">{formatCurrency(data?.totalIncome ?? 0, { generalSettings })}</td>
                        </tr>
                        <tr className="border-b-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
                          <td className="px-6 py-4 font-bold text-emerald-700 dark:text-emerald-400">Total Revenue</td>
                          <td className="px-6 py-4 text-right font-black text-lg text-emerald-700 dark:text-emerald-400">{formatCurrency(totalRevenue, { generalSettings })}</td>
                        </tr>

                        {/* COST OF GOODS / DIRECT EXPENSES SECTION */}
                        <tr className="bg-orange-50/30 dark:bg-orange-950/10 mt-2">
                          <td className="px-6 py-4 font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wider text-xs" colSpan={2}>
                            Costs & Expenses
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-3 pl-10 text-slate-600 dark:text-slate-300">Gross Purchases (Inventory)</td>
                          <td className="px-6 py-3 text-right font-medium">{formatCurrency(data?.totalPurchases ?? 0, { generalSettings })}</td>
                        </tr>
                        <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-3 pl-10 text-slate-600 dark:text-slate-300">Less: Purchase Returns</td>
                          <td className="px-6 py-3 text-right text-emerald-500">({formatCurrency(data?.totalPurchaseReturns ?? 0, { generalSettings })})</td>
                        </tr>
                        <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/30">
                          <td className="px-6 py-3 pl-10 font-semibold text-slate-800 dark:text-slate-200">Net Purchases</td>
                          <td className="px-6 py-3 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(netPurchases, { generalSettings })}</td>
                        </tr>
                        <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-3 pl-10 text-slate-600 dark:text-slate-300">Operating / Direct Expenses</td>
                          <td className="px-6 py-3 text-right font-medium">{formatCurrency(data?.totalExpense ?? 0, { generalSettings })}</td>
                        </tr>
                        <tr className="border-b-2 border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20">
                          <td className="px-6 py-4 font-bold text-rose-700 dark:text-rose-400">Total Costs</td>
                          <td className="px-6 py-4 text-right font-black text-lg text-rose-700 dark:text-rose-400">{formatCurrency(totalCosts, { generalSettings })}</td>
                        </tr>

                        {/* FINAL NET BLOCK */}
                        <tr><td colSpan={2} className="h-6"></td></tr>
                        
                        <tr className={cn(
                          "border-y-4",
                          isProfit 
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-600" 
                            : "border-red-500 bg-red-50 dark:bg-red-900/30 dark:border-red-600"
                        )}>
                          <td className={cn(
                            "px-6 py-5 font-black uppercase tracking-wider text-base",
                            isProfit ? "text-indigo-800 dark:text-indigo-300" : "text-red-800 dark:text-red-300"
                          )}>
                            Net {isProfit ? "Profit" : "Loss"}
                          </td>
                          <td className={cn(
                            "px-6 py-5 text-right font-black text-2xl",
                            isProfit ? "text-indigo-700 dark:text-indigo-400" : "text-red-700 dark:text-red-400"
                          )}>
                            {formatCurrency(data?.netProfit ?? 0, { generalSettings })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>

          <div className="hidden print:block text-center mt-8 text-xs text-slate-500 italic">
            This is a system generated report. Printed on {format(new Date(), "MMMM do, yyyy hh:mm a")}
          </div>

        </div>
      )}
    </div>
  )
}
