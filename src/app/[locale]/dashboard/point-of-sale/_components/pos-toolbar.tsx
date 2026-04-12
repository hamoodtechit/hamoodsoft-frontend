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
        <div className="flex flex-col sm:flex-row items-end gap-3">
          {/* Barcode Scanner */}
          <div className="flex-1 w-full">
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
                className="pl-9 h-10"
              />
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 w-full">
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
                className="pl-9 h-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => setShowCalculator(!showCalculator)}
              title="Calculator"
            >
              <Calculator className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => setShowRecentTransactions(!showRecentTransactions)}
              title="History"
            >
              <History className="h-4 w-4" />
            </Button>

            {activeSession && (
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all"
                onClick={() => setShowCloseSession(true)}
                title="Close Session (End Shift)"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => setIsFilterDialogOpen(true)}
              title="Filters"
            >
              <Filter className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => setShowShortcutsHelp(true)}
              title="Keyboard Shortcuts (?)"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>

            <div className="flex items-center border rounded-md p-1 bg-muted/20">
              <Button
                variant={productViewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setProductViewMode("grid")}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={productViewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setProductViewMode("list")}
                title="List View"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
