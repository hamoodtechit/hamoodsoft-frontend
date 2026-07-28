"use client"

import { usePOS } from "./pos-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { POSSessionIndicator } from "@/components/pos/pos-session-indicator"
import { cn } from "@/lib/utils"
import { ArrowLeft, Droplets, Package } from "lucide-react"

export function POSHeader() {
  const { locale, router, currentBusiness, posMode, setPosMode } = usePOS()

  return (
    <div className="flex items-center justify-between px-2 sm:px-4 py-2 border-b bg-card shrink-0 gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${locale}/dashboard`)}
          className="gap-1 sm:gap-2 px-2 sm:px-3 h-8"
          title="Exit POS"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline font-semibold">Exit POS</span>
        </Button>

        <div className="h-6 w-[1px] bg-border shrink-0" />

        <div className="flex items-center gap-1 sm:gap-2 bg-muted/30 p-1 rounded-lg border shrink-0">
          {currentBusiness?.modules?.includes("oil-filling-station") && (
            <Button
              variant={posMode === "petrol" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPosMode("petrol")}
              className={cn("h-7 sm:h-8 px-2 sm:px-3 transition-all font-semibold text-xs sm:text-sm", posMode === "petrol" && "shadow-sm")}
              title="Petrol Pump Mode"
            >
              <Droplets className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2 text-primary" />
              <span className="hidden sm:inline">Petrol Pump</span>
            </Button>
          )}
          <Button
            variant={posMode === "standard" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPosMode("standard")}
            className={cn("h-7 sm:h-8 px-2 sm:px-3 transition-all font-semibold text-xs sm:text-sm", posMode === "standard" && "shadow-sm")}
            title="Standard POS Mode"
          >
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2 text-primary" />
            <span className="hidden sm:inline">Standard</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <POSSessionIndicator />
        <div className="hidden sm:block h-6 w-[1px] bg-border shrink-0" />
        <Badge variant="outline" className="font-mono text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Badge>
      </div>
    </div>
  )
}
