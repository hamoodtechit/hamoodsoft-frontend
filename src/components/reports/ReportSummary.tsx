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
      <div className={`grid grid-cols-2 md:grid-cols-${Math.min(items.length, 4)} gap-4 print:hidden`}>
        {items.map((item, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${item.valueClassName || ""}`}>
                {item.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Print Summary - Print only */}
      <div className="hidden print:flex print:flex-wrap print:gap-x-12 print:gap-y-2 print:mb-6 print:py-3 print:border-y print:border-slate-200 print:bg-white">
        {items.map((item, index) => (
          <div key={index} className="flex items-baseline gap-2">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              {item.label}:
            </span>
            <span className="text-sm font-bold text-slate-900">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
