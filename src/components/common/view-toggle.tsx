"use client"

import { Button } from "@/components/ui/button"
import { LayoutGrid, Table } from "lucide-react"
import { useTranslations } from "next-intl"

export type ViewMode = "cards" | "table"

interface ViewToggleProps {
  view: ViewMode
  onViewChange: (view: ViewMode) => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  const t = useTranslations("common")

  return (
    <div className="flex items-center gap-1 rounded-lg border p-1">
      <Button
        variant={view === "cards" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("cards")}
        className="h-8 px-3"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline">{t("cards")}</span>
      </Button>
      <Button
        variant={view === "table" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("table")}
        className="h-8 px-3"
      >
        <Table className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline">{t("table")}</span>
      </Button>
    </div>
  )
}
