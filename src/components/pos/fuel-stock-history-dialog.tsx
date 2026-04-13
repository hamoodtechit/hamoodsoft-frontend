"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SkeletonList } from "@/components/skeletons/skeleton-list"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { useStockHistory, useStocks } from "@/lib/hooks/use-stocks"
import { useTankers } from "@/lib/hooks/use-tankers"
import { FuelType, StockHistory } from "@/types"
import { ArrowDown, ArrowUp, Container, History } from "lucide-react"
import { useMemo } from "react"

interface FuelStockHistoryDialogProps {
  fuelType: FuelType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FuelStockHistoryDialog({
  fuelType,
  open,
  onOpenChange,
}: FuelStockHistoryDialogProps) {
  const { selectedBranchId } = useBranchSelection()

  // Fetch all tankers so we can compute total fuel across tankers for this fuel type
  const { data: tankersData, isLoading: isLoadingTankers } = useTankers(
    open && fuelType ? { limit: 100 } : undefined
  )

  // Filter tankers that carry this fuel type and sum their currentFuel
  const matchingTankers = useMemo(() => {
    if (!tankersData?.items || !fuelType) return []
    return tankersData.items.filter((t) => t.fuelTypeId === fuelType.id)
  }, [tankersData, fuelType])

  const totalFuelAcrossTankers = useMemo(() => {
    return matchingTankers.reduce((sum, t) => sum + (t.currentFuel ?? 0), 0)
  }, [matchingTankers])

  // Fetch ALL fuel stock records for this fuelType in the selected branch (one per tanker)
  const { data: fuelStocksData, isLoading: isLoadingStock } = useStocks(
    open && fuelType && selectedBranchId
      ? { branchId: selectedBranchId, fuelTypeId: fuelType.id, itemType: "FUEL", limit: 100 }
      : undefined
  )

  const fuelStocks = fuelStocksData?.items ?? []
  const hasStocks = fuelStocks.length > 0

  // Fetch history using fuelTypeId filter (across all tankers for this fuel type)
  const { data: historyData, isLoading: isLoadingHistory } = useStockHistory(
    open && selectedBranchId && fuelType
      ? { branchId: selectedBranchId, itemType: "FUEL", fuelTypeId: fuelType.id, limit: 100 }
      : undefined
  )

  const historyItems: StockHistory[] = historyData?.items || []
  const isLoading = isLoadingStock || isLoadingHistory || isLoadingTankers

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Stock History — {fuelType?.name ?? "Fuel"}
          </DialogTitle>
          <DialogDescription>
            All stock movements (IN / OUT) recorded for this fuel type
            {selectedBranchId ? "" : " — Please select a branch first"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          {/* No branch selected */}
          {!selectedBranchId && (
            <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
              Please select a branch from the branch selector to view fuel history.
            </div>
          )}

          {/* Loading state */}
          {selectedBranchId && isLoading && <SkeletonList count={4} />}

          {/* No stock record exists yet */}
          {selectedBranchId && !isLoading && !hasStocks && (
            <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
              No stock records found for <strong>{fuelType?.name}</strong> in the selected branch.
              Stock is created automatically on the first fuel sale.
            </div>
          )}

          {/* No history entries */}
          {selectedBranchId && !isLoading && hasStocks && historyItems.length === 0 && (
            <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
              No history entries yet for <strong>{fuelType?.name}</strong>.
            </div>
          )}

          {/* Content */}
          {selectedBranchId && !isLoading && (hasStocks || historyItems.length > 0) && (
            <div className="space-y-2">
              {/* Total fuel across all tankers for this fuel type */}
              <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  Total Current Stock ({matchingTankers.length} tanker{matchingTankers.length !== 1 ? "s" : ""})
                </span>
                <Badge variant={totalFuelAcrossTankers > 0 ? "default" : "destructive"}>
                  {totalFuelAcrossTankers.toFixed(2)} L
                </Badge>
              </div>

              {/* Per-tanker breakdown */}
              {matchingTankers.length > 1 && (
                <div className="rounded-lg border px-4 py-3 space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Breakdown by Tanker</p>
                  {matchingTankers.map((tanker) => (
                    <div key={tanker.id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Container className="h-3.5 w-3.5" />
                        {tanker.name}
                      </span>
                      <span className="font-medium">{(tanker.currentFuel ?? 0).toFixed(2)} L</span>
                    </div>
                  ))}
                </div>
              )}

              {/* History entries */}
              {historyItems.map((h: StockHistory) => {
                const qty = h.quantityChange ?? h.quantity
                const isIn = h.transactionType === "IN"
                return (
                  <div
                    key={h.id}
                    className="flex items-start justify-between gap-3 rounded-lg border px-4 py-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isIn ? (
                        <ArrowUp className="h-4 w-4 shrink-0 text-green-600" />
                      ) : (
                        <ArrowDown className="h-4 w-4 shrink-0 text-red-600" />
                      )}
                      <Badge variant={isIn ? "default" : "destructive"} className="shrink-0">
                        {isIn ? "Stock IN" : "Stock OUT"}
                      </Badge>
                      <span className="text-sm font-medium">
                        {Math.abs(qty).toFixed(2)} L
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {h.createdAt ? new Date(h.createdAt).toLocaleString() : "—"}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
