"use client"

import { useAppSettings } from "@/lib/providers/settings-provider"
import { format } from "date-fns"

interface PrintHeaderProps {
  title: string
  subtitle?: string
  dateRange?: {
    from: Date
    to?: Date
  }
}

export function PrintHeader({ title, subtitle, dateRange }: PrintHeaderProps) {
  const { generalSettings } = useAppSettings()

  if (!generalSettings) {
    return null
  }

  const { logoUrl, companyName, businessAddress, officePhone, binNumber } = generalSettings

  return (
    <div className="hidden print:block mb-6 print-exact pb-4 border-b-2 border-slate-800">
      <div className="flex items-center justify-between">
        {/* Left: Logo and Business Info */}
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <div className="w-12 h-12 relative flex-shrink-0 flex items-center justify-center">
              <img 
                src={logoUrl} 
                alt={companyName || "Business Logo"} 
                className="max-w-full max-h-full object-contain" 
              />
            </div>
          ) : null}
          
          <div>
            <h1 className="text-lg font-bold text-slate-900 m-0 uppercase tracking-tight">{companyName || "Company Name"}</h1>
            {businessAddress && <p className="text-xs text-slate-600 mt-0.5 max-w-sm leading-tight">{businessAddress}</p>}
            
            <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-600">
              {officePhone && (
                <span><strong>Phone:</strong> {officePhone}</span>
              )}
              {binNumber && (
                <span><strong>BIN:</strong> {binNumber}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Report Info */}
        <div className="text-right flex flex-col items-end pr-4">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider m-0">
            {title}
          </h2>
          
          <div className="mt-1 text-[10px] text-slate-600 space-y-0.5">
            {subtitle && <p className="font-medium text-slate-800">{subtitle}</p>}
            
            {dateRange && (
              <p>
                <span className="font-semibold text-slate-700">Period: </span>
                {format(dateRange.from, "MMM dd, yyyy")} 
                {dateRange.to ? ` - ${format(dateRange.to, "MMM dd, yyyy")}` : ""}
              </p>
            )}
            
            <p>
              <span className="font-semibold text-slate-700">Printed: </span>
              {format(new Date(), "MMM dd, yyyy HH:mm")}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
