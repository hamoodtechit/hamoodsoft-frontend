"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function ReportActionButtons({
  onPrint,
  disabled = false,
  label = "Print",
}: {
  onPrint?: () => void
  disabled?: boolean
  label?: string
} = {}) {

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex items-center gap-2 print:hidden">
      <Button 
        variant="outline" 
        onClick={onPrint || handlePrint}
        disabled={disabled}
        className="flex items-center gap-2"
      >
        <Printer className="h-4 w-4" />
        {label}
      </Button>
      {/* Export buttons (Excel, PDF, CSV) can be added here in the future */}
    </div>
  )
}
