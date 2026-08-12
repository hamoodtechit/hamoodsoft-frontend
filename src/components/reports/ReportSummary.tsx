import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface SummaryItem {
  label: string
  value: string | React.ReactNode
  valueClassName?: string
}

interface ReportSummaryProps {
  items: SummaryItem[]
}

export function ReportSummary({ items }: ReportSummaryProps) {
  return (
    <>
      {/* Summary Cards - Screen only */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:hidden">
        {items.map((item, index) => (
          <Card key={index} className="shadow-sm">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate" title={typeof item.label === "string" ? item.label : undefined}>
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className={`text-base sm:text-lg font-bold tracking-tight ${item.valueClassName || ""}`}>
                {item.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Print Summary - Print only */}
      <div className="hidden print:flex print:flex-wrap print:gap-x-6 print:gap-y-1 print:mb-4 print:py-2 print:border-y print:border-slate-300 print:bg-white">
        {items.map((item, index) => (
          <div key={index} className="flex items-baseline gap-1.5">
            <span className="text-[10px] font-semibold text-slate-600">
              {item.label}:
            </span>
            <span className="text-xs font-bold text-slate-900">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
