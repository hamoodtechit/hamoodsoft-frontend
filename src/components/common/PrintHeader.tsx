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
    <div className="hidden print:block mb-8 print-exact pb-4 border-b-2 border-slate-200">
      <div className="flex items-start justify-between">
        {/* Left: Logo and Business Info */}
        <div className="flex items-center gap-6">
          {logoUrl ? (
            <div className="w-24 h-24 relative overflow-hidden rounded-md border border-slate-100 flex-shrink-0 flex items-center justify-center">
              <img 
                src={logoUrl} 
                alt={companyName || "Business Logo"} 
                className="max-w-full max-h-full object-contain" 
              />
            </div>
          ) : (
            <div className="w-24 h-24 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center flex-shrink-0">
              <span className="text-slate-400 font-semibold text-xs">No Logo</span>
            </div>
          )}
          
          <div>
            <h1 className="text-2xl font-bold text-slate-900 m-0">{companyName || "Company Name"}</h1>
            {businessAddress && <p className="text-sm text-slate-600 mt-1 max-w-md">{businessAddress}</p>}
            
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              {officePhone && (
                <span><strong>Phone:</strong> {officePhone}</span>
              )}
              {binNumber && (
                <span><strong>BIN/VAT:</strong> {binNumber}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Report Info */}
        <div className="text-right flex flex-col items-end">
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-4 py-1 rounded-md border border-slate-200">
            {title}
          </h2>
          
          <div className="mt-3 text-sm text-slate-600 space-y-1">
            {subtitle && <p>{subtitle}</p>}
            
            {dateRange && (
              <p>
                <span className="font-medium text-slate-700">Period: </span>
                {format(dateRange.from, "PPP")} 
                {dateRange.to ? ` - ${format(dateRange.to, "PPP")}` : ""}
              </p>
            )}
            
            <p>
              <span className="font-medium text-slate-700">Printed On: </span>
              {format(new Date(), "PPP 'at' p")}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
