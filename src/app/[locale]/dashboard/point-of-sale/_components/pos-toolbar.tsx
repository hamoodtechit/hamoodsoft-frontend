"use client"

import { usePOS } from "./pos-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Calculator, Filter, HelpCircle, History,
  LayoutGrid, List, LogOut, Search,
} from "lucide-react"

export function POSToolbar() {
  const {
    searchQuery, setSearchQuery,
    barcodeInput, setBarcodeInput,
    searchInputRef, barcodeInputRef,
    handleBarcodeScan,
    showCalculator, setShowCalculator,
    showRecentTransactions, setShowRecentTransactions,
    activeSession,
    setShowCloseSession,
    setIsFilterDialogOpen,
    setShowShortcutsHelp,
    productViewMode, setProductViewMode,
  } = usePOS()

  return (
    <Card className="flex-shrink-0">
      <CardContent className="py-3">
        <div className="flex flex-col md:flex-row md:items-end gap-2 sm:gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 flex-1 w-full">
            {/* Barcode Scanner */}
            <div className="w-full">
              <Label className="text-[10px] text-muted-foreground uppercase font-bold mb-1 block">
                Barcode
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={barcodeInputRef}
                  placeholder="Scan or type SKU... (/)"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && barcodeInput.trim()) {
                      e.preventDefault()
                      handleBarcodeScan(barcodeInput)
                    }
                  }}
                  className="pl-9 h-9 sm:h-10 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Search */}
            <div className="w-full">
              <Label className="text-[10px] text-muted-foreground uppercase font-bold mb-1 block">
                Search Products
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search by name... (F1)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 sm:h-10 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 flex-wrap pt-1 md:pt-0">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 shadow-2xs"
              onClick={() => setShowCalculator(!showCalculator)}
              title="Calculator"
            >
              <Calculator className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 shadow-2xs"
              onClick={() => setShowRecentTransactions(!showRecentTransactions)}
              title="History"
            >
              <History className="h-4 w-4" />
            </Button>

            {activeSession && (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all shadow-2xs"
                onClick={() => setShowCloseSession(true)}
                title="Close Session (End Shift)"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 shadow-2xs"
              onClick={() => setIsFilterDialogOpen(true)}
              title="Filters"
            >
              <Filter className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 shadow-2xs"
              onClick={() => setShowShortcutsHelp(true)}
              title="Keyboard Shortcuts (?)"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>

            <div className="flex items-center border rounded-md p-1 bg-muted/20 shrink-0">
              <Button
                variant={productViewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                onClick={() => setProductViewMode("grid")}
                title="Grid View"
              >
                <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant={productViewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                onClick={() => setProductViewMode("list")}
                title="List View"
              >
                <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
