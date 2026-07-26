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
    <div className="flex items-center justify-between px-4 py-2 border-b bg-card shrink-0">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${locale}/dashboard`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Exit POS</span>
        </Button>

        <div className="h-6 w-[1px] bg-border" />

        <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border">
          {currentBusiness?.modules?.includes("oil-filling-station") && (
            <Button
              variant={posMode === "petrol" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPosMode("petrol")}
              className={cn("h-8 px-3 transition-all", posMode === "petrol" && "shadow-sm")}
            >
              <Droplets className="h-4 w-4 mr-2" />
              Petrol Pump
            </Button>
          )}
          <Button
            variant={posMode === "standard" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPosMode("standard")}
            className={cn("h-8 px-3 transition-all", posMode === "standard" && "shadow-sm")}
          >
            <Package className="h-4 w-4 mr-2" />
            Standard
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <POSSessionIndicator />
        <div className="h-6 w-[1px] bg-border" />
        <Badge variant="outline" className="font-mono">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Badge>
      </div>
    </div>
  )
}
