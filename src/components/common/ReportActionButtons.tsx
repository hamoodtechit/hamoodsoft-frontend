"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function ReportActionButtons() {

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex items-center gap-2 print:hidden">
      <Button 
        variant="outline" 
        onClick={handlePrint}
        className="flex items-center gap-2"
      >
        <Printer className="h-4 w-4" />
        Print
      </Button>
      {/* Export buttons (Excel, PDF, CSV) can be added here in the future */}
    </div>
  )
}
