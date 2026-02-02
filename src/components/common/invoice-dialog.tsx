"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { formatCurrency } from "@/lib/utils/currency"
import { Sale } from "@/types"
import { Download, FileText, History, Printer } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo } from "react"

interface InvoiceDialogProps {
  sale: Sale | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenRecentTransactions?: () => void
}

export function InvoiceDialog({ sale, open, onOpenChange, onOpenRecentTransactions }: InvoiceDialogProps) {
  const t = useTranslations("sales")
  useTranslations("common")
  const { generalSettings, invoiceSettings } = useAppSettings()

  // Get sale items (handle both items and saleItems)
  const saleItems = useMemo(() => {
    if (!sale) return []
    return sale.items || sale.saleItems || []
  }, [sale])

  // Calculate totals
  const totals = useMemo(() => {
    if (!sale) return { subtotal: 0, discount: 0, tax: 0, total: 0, paid: 0, due: 0 }
    
    // Calculate item totals with item-level discounts
    const itemsSubtotal = saleItems.reduce((sum, item) => {
      const itemSubtotal = item.price * item.quantity
      const itemDiscount =
        item.discountType === "PERCENTAGE"
          ? (itemSubtotal * (item.discountAmount || 0)) / 100
          : item.discountType === "FIXED"
          ? item.discountAmount || 0
          : 0
      const itemTotal = itemSubtotal - itemDiscount
      return sum + itemTotal
    }, 0)
    
    // Apply sale-level discount
    const saleDiscount = sale.discountAmount || 0
    const afterDiscount = Math.max(0, itemsSubtotal - saleDiscount)
    
    // Total from backend (includes tax)
    const total = sale.totalPrice || sale.totalAmount || itemsSubtotal
    
    // Calculate tax: total - afterDiscount (since total includes tax)
    const tax = Math.max(0, total - afterDiscount)
    
    const paid = sale.paidAmount || 0
    const due = Math.max(0, total - paid)

    return { subtotal: itemsSubtotal, discount: saleDiscount, tax, total, paid, due }
  }, [sale, saleItems])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // Create a printable HTML content
    const printContent = document.getElementById("invoice-content")?.innerHTML || ""
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${sale?.invoiceNumber || sale?.id}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .invoice-title { font-size: 24px; font-weight: bold; }
              .invoice-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
              .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              .invoice-table th, .invoice-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
              .invoice-table th { background-color: #f5f5f5; font-weight: bold; }
              .invoice-totals { margin-top: 20px; text-align: right; }
              .invoice-footer { margin-top: 40px; text-align: center; color: #666; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (!sale) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none">
        {/* Accessibility: DialogContent requires DialogTitle */}
        <DialogHeader className="sr-only">
          <DialogTitle>Invoice</DialogTitle>
        </DialogHeader>
        <div id="invoice-content" className="p-6 print:p-0">
          {/* Invoice Header */}
          <div className="flex items-start justify-between mb-6 print:mb-8">
            <div>
              {/* Logo */}
              {generalSettings?.logoUrl && (
                <div className="mb-4">
                  <img
                    src={generalSettings.logoUrl}
                    alt="Logo"
                    className="h-16 w-auto object-contain"
                  />
                </div>
              )}
              <h1 className="text-3xl font-bold mb-2">Invoice</h1>
              {sale.invoiceNumber && (
                <p className="text-muted-foreground">
                  {invoiceSettings?.prefix || "INV"}#: {sale.invoiceNumber}
                </p>
              )}
              {/* Receipt-style customer info (kept minimal) */}
              {sale.contact && (
                <div className="mt-2 text-sm">
                  <p className="font-medium">{sale.contact.name}</p>
                  <div className="text-muted-foreground">
                    {sale.contact.phone || sale.contact.email ? (
                      <span>
                        {sale.contact.phone || ""}
                        {sale.contact.phone && sale.contact.email ? " • " : ""}
                        {sale.contact.email || ""}
                      </span>
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="flex gap-2 mb-2 print:hidden">
                {onOpenRecentTransactions && (
                  <Button variant="outline" size="sm" onClick={onOpenRecentTransactions}>
                    <History className="h-4 w-4 mr-2" />
                    Recent
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              <Badge
                variant={sale.paymentStatus === "PAID" ? "default" : "destructive"}
                className="text-sm"
              >
                {sale.paymentStatus === "PAID"
                  ? t("paymentStatusPaid")
                  : sale.paymentStatus === "DUE"
                  ? t("paymentStatusDue")
                  : t("paymentStatusPartial")}
              </Badge>
            </div>
          </div>

          {/* (Removed) Invoice meta section per UX request */}

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Item</th>
                  <th className="text-left py-3 px-4 font-semibold">Description</th>
                  <th className="text-center py-3 px-4 font-semibold">Qty</th>
                  <th className="text-right py-3 px-4 font-semibold">Unit Price</th>
                  {totals.discount > 0 && (
                    <th className="text-right py-3 px-4 font-semibold">Discount</th>
                  )}
                  <th className="text-right py-3 px-4 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {saleItems.length === 0 ? (
                  <tr className="border-b">
                    <td className="py-6 px-4 text-center text-muted-foreground" colSpan={totals.discount > 0 ? 6 : 5}>
                      No items found for this sale.
                    </td>
                  </tr>
                ) : saleItems.map((item, index) => {
                  const itemSubtotal = item.price * item.quantity
                  const itemDiscount =
                    item.discountType === "PERCENTAGE"
                      ? (itemSubtotal * (item.discountAmount || 0)) / 100
                      : item.discountType === "FIXED"
                      ? item.discountAmount || 0
                      : 0
                  const itemTotal = item.totalPrice || itemSubtotal - itemDiscount

                  return (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-4">
                        <div className="font-medium">{item.itemName}</div>
                        {item.sku && (
                          <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">
                        {item.itemDescription || "-"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {formatCurrency(item.price, { generalSettings })}
                      </td>
                      {totals.discount > 0 && (
                        <td className="py-3 px-4 text-right">
                          {itemDiscount > 0 ? `-${formatCurrency(itemDiscount, { generalSettings })}` : "-"}
                        </td>
                      )}
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(itemTotal, { generalSettings })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full md:w-80 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(totals.subtotal, { generalSettings })}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="text-green-600">-{formatCurrency(totals.discount, { generalSettings })}</span>
                </div>
              )}
              {totals.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span>{formatCurrency(totals.tax, { generalSettings })}</span>
                </div>
              )}
              <div className="border-t my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(totals.total, { generalSettings })}</span>
              </div>
              {sale.paymentStatus !== "PAID" && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paid:</span>
                    <span className="text-green-600">{formatCurrency(totals.paid, { generalSettings })}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-red-600">
                    <span>Due:</span>
                    <span>{formatCurrency(totals.due, { generalSettings })}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground print:mt-12">
            <p>{invoiceSettings?.footer || "Thank you for your business!"}</p>
            {sale.createdAt && (
              <p className="mt-2">
                Invoice generated on {new Date(sale.createdAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
