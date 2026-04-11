"use client"

import { usePOS } from "./pos-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, Edit, FileText, Printer, Trash2 } from "lucide-react"

export function RecentTransactionsDialog() {
  const {
    showRecentTransactions, setShowRecentTransactions,
    transactionFilter, setTransactionFilter,
    recentSales,
    setSaleToEdit, setIsSaleDialogOpen,
    setCompletedSale, setShowInvoice,
    setSaleToDelete, setIsDeleteDialogOpen,
  } = usePOS()

  return (
    <Dialog open={showRecentTransactions} onOpenChange={setShowRecentTransactions}>
      <DialogContent className="max-w-3xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-semibold">Recent Transactions</DialogTitle>
          <DialogDescription>View and manage your recent sales</DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b pb-2 px-6 flex-shrink-0">
          <Button
            variant={transactionFilter === "FINAL" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTransactionFilter("FINAL")}
            className="text-xs"
          >
            <Check className="h-3 w-3 mr-1" />
            Final
          </Button>
          <Button
            variant={transactionFilter === "QUOTATION" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTransactionFilter("QUOTATION")}
            className="text-xs"
          >
            <FileText className="h-3 w-3 mr-1" />
            Quotation
          </Button>
          <Button
            variant={transactionFilter === "DRAFT" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTransactionFilter("DRAFT")}
            className="text-xs"
          >
            <FileText className="h-3 w-3 mr-1" />
            Draft
          </Button>
        </div>

        {/* Transactions List */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full px-6 pb-6">
            <div className="space-y-3 py-2">
              {recentSales.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No {transactionFilter.toLowerCase()} transactions found
                </div>
              ) : (
                recentSales.map((sale) => {
                  const invoiceNumber = sale.invoiceNumber || (sale.invoiceSequence ? `INV${String(sale.invoiceSequence).padStart(6, "0")}` : sale.id.slice(0, 8).toUpperCase())
                  const contactName = sale.contact?.name || "Walk-In Customer"
                  const itemsCount = (sale.items?.length || sale.saleItems?.length || 0)
                  const totalAmount = sale.totalPrice || sale.totalAmount || 0

                  return (
                    <Card key={sale.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-base">{invoiceNumber}</span>
                              <Badge
                                variant={
                                  sale.status === "SOLD"
                                    ? "default"
                                    : sale.status === "PENDING"
                                    ? "secondary"
                                    : "outline"
                                }
                                className="text-xs"
                              >
                                {sale.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              {contactName}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{itemsCount} items</span>
                              <span>•</span>
                              <span>{new Date(sale.createdAt || "").toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <div className="text-right">
                              <div className="font-bold text-lg">{totalAmount.toFixed(2)}</div>
                              <Badge
                                variant={
                                  sale.paymentStatus === "PAID"
                                    ? "default"
                                    : sale.paymentStatus === "DUE"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="text-xs mt-1"
                              >
                                {sale.paymentStatus}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSaleToEdit(sale)
                                  setIsSaleDialogOpen(true)
                                }}
                                className="h-8 px-2 text-xs"
                                title="Edit"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCompletedSale(sale)
                                  setShowInvoice(true)
                                  setShowRecentTransactions(false)
                                }}
                                className="h-8 px-2 text-xs bg-green-50 hover:bg-green-100 border-green-200"
                                title="Print"
                              >
                                <Printer className="h-3 w-3 text-green-600" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSaleToDelete(sale)
                                  setIsDeleteDialogOpen(true)
                                }}
                                className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                                title="Delete"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
