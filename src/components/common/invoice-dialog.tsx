"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { formatCurrency } from "@/lib/utils/currency"
import { Purchase, Sale } from "@/types"
import { Download, History, Printer } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo } from "react"

interface InvoiceDialogProps {
  sale?: Sale | null
  purchase?: Purchase | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenRecentTransactions?: () => void
}

export function InvoiceDialog({ sale, purchase, open, onOpenChange, onOpenRecentTransactions }: InvoiceDialogProps) {
  const t = useTranslations("sales")
  const tPurchases = useTranslations("purchases")
  const tCommon = useTranslations("common")
  const { generalSettings, invoiceSettings } = useAppSettings()

  const transaction = sale || purchase
  const isPurchase = !!purchase

  // Get items (handle both items and saleItems/purchaseItems)
  const items = useMemo(() => {
    if (!transaction) return []
    if (isPurchase) {
      const p = transaction as Purchase
      return p.items || p.purchaseItems || []
    }
    const s = transaction as Sale
    return s.items || s.saleItems || []
  }, [transaction, isPurchase])

  // Calculate totals
  const totals = useMemo(() => {
    if (!transaction) return { subtotal: 0, discount: 0, tax: 0, total: 0, paid: 0, due: 0 }
    
    // Calculate item totals with item-level discounts
    const itemsSubtotal = items.reduce((sum, item) => {
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
    
    // Apply transaction-level discount
    const discount = transaction.discountAmount || 0
    const afterDiscount = Math.max(0, itemsSubtotal - discount)
    
    // Total from backend (includes tax)
    // For purchases, totalAmount/totalPrice is what we want. 
    const total = transaction.totalPrice || transaction.totalAmount || itemsSubtotal
    
    // Calculate tax
    let tax = 0
    if (isPurchase) {
      const p = transaction as Purchase
      if (p.taxAmount) {
        tax = p.taxAmount
      } else if (p.taxType === "PERCENTAGE" && p.taxRate) {
        tax = (afterDiscount * p.taxRate) / 100
      } else {
        // Fallback or if tax is already in total but fields are missing
        tax = Math.max(0, total - afterDiscount)
      }
    } else {
       // Sales logic (keep existing or update if Sales has tax fields)
       tax = Math.max(0, total - afterDiscount)
    }
    
    const paid = transaction.paidAmount || 0
    const due = Math.max(0, total - paid)

    return { subtotal: afterDiscount, discount, tax, total, paid, due } // Note: subtotal here is effectively "Total before Tax" but after discount. 
    // Actually, UI shows Subtotal (items sum), Discount, Tax, Total.
    // The previous logic returned { subtotal: itemsSubtotal ... }
    // Let's stick to that:
    return { subtotal: itemsSubtotal, discount, tax, total, paid, due }
  }, [transaction, items])

  // Get invoice layout from settings
  const invoiceLayout = invoiceSettings?.layout || "pos-80mm"
  
  // Determine width based on layout
  const getInvoiceWidth = () => {
    switch (invoiceLayout) {
      case "pos-58mm":
        return "58mm"
      case "pos-80mm":
        return "80mm"
      case "pos-a4":
        return "210mm"
      default:
        return "80mm"
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    const invoiceWidth = getInvoiceWidth()
    
    // Create a printable HTML content
    const printContent = document.getElementById("invoice-content")?.innerHTML || ""
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${isPurchase ? "Receipt" : "Invoice"} ${transaction?.id}</title>
            <style>
              @page { size: ${invoiceLayout === "pos-a4" ? "A4" : "auto"}; margin: 0; }
              body { 
                font-family: Arial, sans-serif; 
                padding: ${invoiceLayout === "pos-a4" ? "20px" : "10px"}; 
                width: ${invoiceWidth};
                margin: 0 auto;
              }
              .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .invoice-title { font-size: ${invoiceLayout === "pos-a4" ? "24px" : "18px"}; font-weight: bold; }
              .invoice-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
              .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: ${invoiceLayout === "pos-a4" ? "14px" : "12px"}; }
              .invoice-table th, .invoice-table td { padding: ${invoiceLayout === "pos-a4" ? "10px" : "6px"}; text-align: left; border-bottom: 1px solid #ddd; }
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

  if (!transaction) return null
  
  // Determine max width based on layout
  const getMaxWidthClass = () => {
    switch (invoiceLayout) {
      case "pos-58mm":
        return "max-w-[58mm] print:max-w-[58mm]"
      case "pos-80mm":
        return "max-w-[80mm] print:max-w-[80mm]"
      case "pos-a4":
        return "max-w-[210mm] print:max-w-[210mm]"
      default:
        return "max-w-[80mm] print:max-w-[80mm]"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${getMaxWidthClass()} max-h-[90vh] overflow-y-auto print:max-h-none mx-auto`}>
        {/* Accessibility: DialogContent requires DialogTitle */}
        <DialogHeader className="sr-only">
          <DialogTitle>{isPurchase ? "Receipt" : "Invoice"}</DialogTitle>
        </DialogHeader>
        <div 
          id="invoice-content" 
          className={`p-6 print:p-0 ${
            invoiceLayout === "pos-a4" 
              ? "" 
              : invoiceLayout === "pos-80mm"
              ? "text-sm"
              : "text-xs"
          }`}
        >
          {/* Invoice Header */}
          <div className={`flex items-start justify-between ${invoiceLayout === "pos-a4" ? "mb-6 print:mb-8" : "mb-4 print:mb-6"}`}>
            <div>
              {/* Logo */}
              {generalSettings?.logoUrl && (
                <div className={invoiceLayout === "pos-a4" ? "mb-4" : "mb-2"}>
                  <img
                    src={generalSettings.logoUrl}
                    alt="Logo"
                    className={`${invoiceLayout === "pos-a4" ? "h-16" : invoiceLayout === "pos-80mm" ? "h-12" : "h-10"} w-auto object-contain`}
                  />
                </div>
              )}
              <h1 className={`${invoiceLayout === "pos-a4" ? "text-3xl" : invoiceLayout === "pos-80mm" ? "text-2xl" : "text-xl"} font-bold ${invoiceLayout === "pos-a4" ? "mb-2" : "mb-1"}`}>
                {isPurchase ? "PURCHASE RECEIPT" : "INVOICE"}
              </h1>
              {isPurchase ? (
                <>
                  {purchase?.poNumber && (
                    <p className="text-muted-foreground">
                      PO#: {purchase.poNumber}
                    </p>
                  )}
                </>
              ) : (
                <>
                  {sale?.invoiceNumber && (
                    <p className="text-muted-foreground">
                      {invoiceSettings?.prefix || "INV"}#: {sale.invoiceNumber}
                    </p>
                  )}
                </>
              )}
              
              {/* Receipt-style customer/supplier info */}
              {transaction.contact && (
                <div className="mt-2 text-sm">
                  <p className="font-medium text-xs text-muted-foreground">
                    {isPurchase ? "SUPPLIER:" : "CUSTOMER:"}
                  </p>
                  <p className="font-medium">{transaction.contact.name}</p>
                  <div className="text-muted-foreground">
                    {transaction.contact.phone || transaction.contact.email ? (
                      <span>
                        {transaction.contact.phone || ""}
                        {transaction.contact.phone && transaction.contact.email ? " • " : ""}
                        {transaction.contact.email || ""}
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
                variant={transaction.paymentStatus === "PAID" ? "default" : "destructive"}
                className="text-sm"
              >
                {transaction.paymentStatus === "PAID"
                  ? t("paymentStatusPaid")
                  : transaction.paymentStatus === "DUE"
                  ? t("paymentStatusDue")
                  : t("paymentStatusPartial")}
              </Badge>
            </div>
          </div>

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
                {items.length === 0 ? (
                  <tr className="border-b">
                    <td className="py-6 px-4 text-center text-muted-foreground" colSpan={totals.discount > 0 ? 6 : 5}>
                      No items found.
                    </td>
                  </tr>
                ) : items.map((item, index) => {
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
              {transaction.paymentStatus !== "PAID" && (
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
            {transaction.createdAt && (
              <p className="mt-2">
                {isPurchase ? "Receipt" : "Invoice"} generated on {new Date(transaction.createdAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
