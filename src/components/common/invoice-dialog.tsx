"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppSettings } from "@/lib/providers/settings-provider";
import { formatCurrency } from "@/lib/utils/currency";
import { Purchase, Sale, SaleItem, PurchaseItem } from "@/types";
import { Download, History, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

interface InvoiceDialogProps {
  sale?: Sale | null;
  purchase?: Purchase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenRecentTransactions?: () => void;
}

export function InvoiceDialog({
  sale,
  purchase,
  open,
  onOpenChange,
  onOpenRecentTransactions,
}: InvoiceDialogProps) {
  const t = useTranslations("sales");
  const { generalSettings, invoiceSettings } = useAppSettings();

  const transaction = sale || purchase;
  const isPurchase = !!purchase;

  // Get items (handle both items and saleItems/purchaseItems)
  const items = useMemo<(SaleItem | PurchaseItem)[]>(() => {
    if (!transaction) return [];
    if (isPurchase) {
      const p = transaction as Purchase;
      return p.items || p.purchaseItems || [];
    }
    const s = transaction as Sale;
    return s.items || s.saleItems || [];
  }, [transaction, isPurchase]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!transaction)
      return {
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
        paid: 0,
        due: 0,
        change: 0,
      };

    // Calculate item totals with item-level discounts
    const itemsSubtotal = items.reduce((sum, item) => {
      const itemSubtotal = item.price * item.quantity;
      const itemDiscount =
        item.discountType === "PERCENTAGE"
          ? (itemSubtotal * (item.discountAmount || 0)) / 100
          : item.discountType === "FIXED"
            ? item.discountAmount || 0
            : 0;
      const itemTotal = itemSubtotal - itemDiscount;
      return sum + itemTotal;
    }, 0);

    // Apply transaction-level discount
    const discount = transaction.discountAmount || 0;
    const afterDiscount = Math.max(0, itemsSubtotal - discount);

    // Total from backend (includes tax)
    // For purchases, totalAmount/totalPrice is what we want.
    const total =
      transaction.totalPrice || transaction.totalAmount || itemsSubtotal;

    // Calculate tax
    let tax = 0;
    if (isPurchase) {
      const p = transaction as Purchase;
      if (p.taxAmount) {
        tax = p.taxAmount;
      } else if (p.taxType === "PERCENTAGE" && p.taxRate) {
        tax = (afterDiscount * p.taxRate) / 100;
      } else {
        // Fallback or if tax is already in total but fields are missing
        tax = Math.max(0, total - afterDiscount);
      }
    } else {
      // Sales logic (keep existing or update if Sales has tax fields)
      tax = Math.max(0, total - afterDiscount);
    }

    const paid = transaction.paidAmount || 0;
    const due = Math.max(0, total - paid);
    const change = Math.max(0, paid - total);

    return { subtotal: itemsSubtotal, discount, tax, total, paid, due, change };
  }, [transaction, items]);

  // Get invoice layout from settings
  const invoiceLayout = invoiceSettings?.layout || "pos-80mm";

  // Determine width for download/print windows
  const getInvoiceWidth = () => {
    switch (invoiceLayout) {
      case "pos-58mm":
        return "58mm";
      case "pos-80mm":
        return "80mm";
      case "pos-a4":
        return "210mm";
      default:
        return "80mm";
    }
  };

  const isPosNarrow = invoiceLayout === "pos-58mm" || invoiceLayout === "pos-80mm";

  /**
   * Extracts all compiled CSS from the current document's stylesheets.
   * This captures Tailwind's generated classes, CSS variables, and any custom styles.
   */
  const extractPageStyles = (): string => {
    let cssText = "";
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules)) {
          cssText += rule.cssText + "\n";
        }
      } catch {
        // Skip cross-origin stylesheets that can't be read
      }
    }
    return cssText;
  };

  /**
   * Opens a new window with the invoice content and all page styles,
   * then triggers the browser's print dialog.
   */
  const openPrintWindow = () => {
    const invoiceWidth = getInvoiceWidth();
    const isA4 = invoiceLayout === "pos-a4";

    // Clone invoice content, stripping elements that should be hidden in print
    const sourceEl = document.getElementById("invoice-content");
    if (!sourceEl) return;
    const clone = sourceEl.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("[class*='print\\:hidden'], [class*='print:hidden']").forEach(el => el.remove());
    const printContent = clone.innerHTML;

    // Extract all CSS from the current page (includes Tailwind + CSS variables)
    const pageStyles = extractPageStyles();

    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${isPurchase ? "Receipt" : "Invoice"} ${transaction?.id}</title>
            <style>${pageStyles}</style>
            <style>
              @page {
                size: ${isA4 ? "A4" : `${invoiceWidth} auto`};
                margin: ${isA4 ? "5mm" : "1mm"};
              }
              *, *::before, *::after {
                box-sizing: border-box;
              }
              html, body {
                background: white !important;
                color: black !important;
                margin: 0;
                padding: 0;
              }
              #print-root {
                max-width: 100%;
                margin: 0 auto;
                padding: ${isA4 ? "22px 30px" : "34px 22px"};
              }
            </style>
          </head>
          <body>
            <div id="print-root">
              ${printContent}
            </div>
          </body>
        </html>
      `);
      doc.close();
      // Small delay to let styles apply before triggering print
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          onOpenChange(false);
        }, 1000);
      }, 250);
    }
  };

  const handlePrint = () => {
    openPrintWindow();
  };

  const handleDownload = () => {
    openPrintWindow();
  };

  if (!transaction) return null;

  // Determine max width based on layout
  // Important: These must override the base max-w-lg (512px) from DialogContent
  const getMaxWidthClass = () => {
    switch (invoiceLayout) {
      case "pos-58mm":
        return "!max-w-[360px] w-[95vw]";
      case "pos-80mm":
        return "!max-w-[480px] w-[95vw]";
      case "pos-a4":
        return "!max-w-[900px] w-[95vw]";
      default:
        return "!max-w-[480px] w-[95vw]";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${getMaxWidthClass()} max-h-[90vh] overflow-y-auto mx-auto`}
      >
        {/* Accessibility: DialogContent requires DialogTitle */}
        <DialogHeader className="sr-only">
          <DialogTitle>{isPurchase ? "Receipt" : "Invoice"}</DialogTitle>
        </DialogHeader>
        <div
          id="invoice-content"
          className={`print:p-0 ${invoiceLayout === "pos-a4"
              ? ""
              : invoiceLayout === "pos-80mm"
                ? "text-sm"
                : "text-xs"
            }`}
        >
          {/* Action Buttons — hidden in print */}
          <div className="flex items-center justify-end gap-2 mb-4 print:hidden">
            <Button autoFocus variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            {onOpenRecentTransactions && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenRecentTransactions}
              >
                <History className="h-4 w-4 mr-2" />
                Recent
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          {/* Invoice Header - 3 Column Responsive Layout */}
          <div className="flex justify-between items-center mb-6 print:mb-8 border-b pb-4 gap-2">
            {/* Column 1: Secondary Logo (Left Side) */}
            <div className="w-1/4 flex justify-start items-center">
              {generalSettings?.secondaryLogoUrl && (
                <img
                  src={generalSettings.secondaryLogoUrl}
                  alt="Secondary Logo"
                  className={`${invoiceLayout === "pos-a4" ? "h-24" : isPosNarrow ? "h-14" : "h-20"} w-auto object-contain rounded-sm`}
                />
              )}
            </div>

            {/* Column 2: Center Info (Company Info) */}
            <div className="w-1/2 flex flex-col items-center text-center space-y-0.5">
              <h1 className={`${invoiceLayout === "pos-a4" ? "text-2xl" : isPosNarrow ? "text-[15px]" : "text-xl"} font-bold text-red-600 leading-tight`}>
                {generalSettings?.companyName || "Company Name"}
              </h1>
              {generalSettings?.businessAddress && (
                <p className={`${isPosNarrow ? "text-[10px]" : "text-xs"} leading-tight max-w-[200px]`}>{generalSettings.businessAddress}</p>
              )}
              {generalSettings?.officePhone && (
                <p className={`${isPosNarrow ? "text-[10px]" : "text-xs"} leading-tight`}>অফিস : {generalSettings.officePhone}</p>
              )}
              {generalSettings?.counterPhone && (
                <p className={`${isPosNarrow ? "text-[10px]" : "text-xs"} leading-tight`}>কাউন্টার: {generalSettings.counterPhone}</p>
              )}
              {generalSettings?.binNumber && (
                <p className={`${isPosNarrow ? "text-[10px]" : "text-xs"} font-semibold leading-tight mt-0.5`}>BIN : {generalSettings.binNumber}</p>
              )}
            </div>

            {/* Column 3: Primary Logo (Right Side) */}
            <div className="w-1/4 flex justify-end items-center">
              {generalSettings?.logoUrl && (
                <img
                  src={generalSettings.logoUrl}
                  alt="Logo"
                  className={`${invoiceLayout === "pos-a4" ? "h-24" : isPosNarrow ? "h-14" : "h-20"} w-auto object-contain rounded-sm`}
                />
              )}
            </div>
          </div>

          <div className="flex justify-between items-end mb-4 text-xs">
            <div>
              <p className="font-semibold">
                {isPurchase ? "SUPPLIER:" : "CUSTOMER:"} {transaction.contact?.name || "Walk-in"}
              </p>
              {transaction.contact?.phone && <p>{transaction.contact.phone}</p>}
              {!isPurchase && (transaction as Sale).vehicleNo && (
                <p>Vehicle No: {(transaction as Sale).vehicleNo}</p>
              )}
            </div>
            <div className="text-right">
              <p>
                <span className="font-semibold">{isPurchase ? "PO#:" : "INV#:"}</span>{" "}
                {isPurchase ? (transaction as Purchase).poNumber : (transaction as Sale).invoiceNumber}
              </p>
              <p>
                <span className="font-semibold">Date:</span>{" "}
                {new Date(transaction.createdAt || "").toLocaleDateString()}
              </p>
              <Badge
                variant={
                  transaction.paymentStatus === "PAID"
                    ? "default"
                    : "destructive"
                }
                className="mt-1"
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
          <div className="mb-6 overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className={`text-left font-semibold ${isPosNarrow ? "py-2 px-2" : "py-3 px-4"}`}>Item</th>
                  {!isPosNarrow && (
                    <th className="text-left py-3 px-4 font-semibold">
                      Description
                    </th>
                  )}
                  <th className={`text-center font-semibold ${isPosNarrow ? "py-2 px-2" : "py-3 px-4"}`}>Qty</th>
                  <th className={`text-right font-semibold ${isPosNarrow ? "py-2 px-2" : "py-3 px-4"}`}>
                    Price
                  </th>
                  {totals.discount > 0 && (
                    <th className={`text-right font-semibold ${isPosNarrow ? "py-2 px-2" : "py-3 px-4"}`}>
                      Disc.
                    </th>
                  )}
                  <th className={`text-right font-semibold ${isPosNarrow ? "py-2 px-2" : "py-3 px-4"}`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr className="border-b">
                    <td
                      className={`text-center text-muted-foreground ${isPosNarrow ? "py-4 px-2" : "py-6 px-4"}`}
                      colSpan={totals.discount > 0 ? (isPosNarrow ? 5 : 6) : (isPosNarrow ? 4 : 5)}
                    >
                      No items found.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const itemSubtotal = item.price * item.quantity;
                    const itemDiscount =
                      item.discountType === "PERCENTAGE"
                        ? (itemSubtotal * (item.discountAmount || 0)) / 100
                        : item.discountType === "FIXED"
                          ? item.discountAmount || 0
                          : 0;
                    const itemTotal =
                      item.totalPrice || itemSubtotal - itemDiscount;

                    return (
                      <tr key={index} className="border-b">
                        <td className={isPosNarrow ? "py-2 px-2" : "py-3 px-4"}>
                          <div className="font-medium">{item.itemName}</div>
                          {item.sku && (
                            <div className="text-xs text-muted-foreground">
                              SKU: {item.sku}
                            </div>
                          )}
                          {isPosNarrow && item.itemDescription && (
                            <div className="text-xs text-muted-foreground mt-0.5" dangerouslySetInnerHTML={{ __html: item.itemDescription }} />
                          )}
                        </td>
                        {!isPosNarrow && (
                          <td className="py-3 px-4 text-muted-foreground text-sm" dangerouslySetInnerHTML={{ __html: item.itemDescription || "-" }} />
                        )}
                        <td className={`text-center ${isPosNarrow ? "py-2 px-2" : "py-3 px-4"}`}>
                          <div>{item.quantity} {item.unit}</div>
                        </td>
                        <td className={`text-right ${isPosNarrow ? "py-2 px-2" : "py-3 px-4"}`}>
                          {formatCurrency(item.price, { generalSettings })}
                        </td>
                        {totals.discount > 0 && (
                          <td className={`text-right ${isPosNarrow ? "py-2 px-2" : "py-3 px-4"}`}>
                            {itemDiscount > 0
                              ? `-${formatCurrency(itemDiscount, { generalSettings })}`
                              : "-"}
                          </td>
                        )}
                        <td className={`text-right font-medium ${isPosNarrow ? "py-2 px-2" : "py-3 px-4"}`}>
                          {formatCurrency(itemTotal, { generalSettings })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full md:w-80 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>
                  {formatCurrency(totals.subtotal, { generalSettings })}
                </span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="text-green-600">
                    -{formatCurrency(totals.discount, { generalSettings })}
                  </span>
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
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid:</span>
                <span className="text-green-600">
                  {formatCurrency(totals.paid, { generalSettings })}
                </span>
              </div>

              {totals.due > 0 && (
                <div className="flex justify-between text-sm font-semibold text-red-600">
                  <span>Due:</span>
                  <span>{formatCurrency(totals.due, { generalSettings })}</span>
                </div>
              )}

              {totals.change > 0 && (
                <div className="flex justify-between text-sm font-semibold text-blue-600">
                  <span>Change:</span>
                  <span>
                    {formatCurrency(totals.change, { generalSettings })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground print:mt-12">
            <p>{invoiceSettings?.footer || "Thank you for your business!"}</p>
            {transaction.createdAt && (
              <p className="mt-2">
                {isPurchase ? "Receipt" : "Invoice"} generated on{" "}
                {new Date(transaction.createdAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
