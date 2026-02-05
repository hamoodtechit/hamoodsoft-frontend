"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import { useTranslations } from "next-intl"
import { memo } from "react"
import { toast } from "sonner"
import { exportToExcel, exportToCSV, ExportColumn } from "@/lib/utils/export"

interface ExportButtonProps<T extends Record<string, any>> {
  data: T[]
  columns: ExportColumn<T>[]
  filename: string
  disabled?: boolean
}

export const ExportButton = memo(function ExportButton<T extends Record<string, any>>({
  data,
  columns,
  filename,
  disabled = false,
}: ExportButtonProps<T>) {
  const t = useTranslations("common")

  const handleExportExcel = () => {
    try {
      exportToExcel(data, columns, filename)
      toast.success(t("exportSuccess") || "Export successful!")
    } catch (error) {
      toast.error(t("exportError") || "Failed to export. Please try again.")
      console.error("Export error:", error)
    }
  }

  const handleExportCSV = () => {
    try {
      exportToCSV(data, columns, filename)
      toast.success(t("exportSuccess") || "Export successful!")
    } catch (error) {
      toast.error(t("exportError") || "Failed to export. Please try again.")
      console.error("Export error:", error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || data.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          {t("export")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportExcel}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          {t("exportExcel")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileText className="mr-2 h-4 w-4" />
          {t("exportCSV")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}) as <T extends Record<string, any>>(props: ExportButtonProps<T>) => JSX.Element
