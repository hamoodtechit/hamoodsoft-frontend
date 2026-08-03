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
    const is58mm = invoiceLayout === "pos-58mm";

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
                margin: ${isA4 ? "5mm" : "0mm"};
              }
              *, *::before, *::after {
                box-sizing: border-box;
              }
              html, body {
                background: white !important;
                color: black !important;
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              }
              #print-root {
                max-width: 100%;
                margin: 0 auto;
                padding: ${isA4 ? "20px 24px" : is58mm ? "4px 2px" : "8px 6px"};
              }
              @media print {
                body {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
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

  // Combine phone numbers into a single line without titles (matching actual-print.jpeg)
  const phoneNumbers = [generalSettings?.officePhone, generalSettings?.counterPhone]
    .filter(Boolean)
    .join(", ");

  // Format date like 28-JAN-26 for receipt header
  const formatDateHeader = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const year = String(d.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    const secs = String(d.getSeconds()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${mins}:${secs}`;
  };

  // Determine max width based on layout
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

  const invoiceNo = isPurchase
    ? (transaction as Purchase).poNumber || transaction.id
    : (transaction as Sale).invoiceNumber || transaction.id;

  const vehicleNo = !isPurchase ? (transaction as Sale).vehicleNo : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${getMaxWidthClass()} max-h-[90vh] overflow-y-auto mx-auto p-4 sm:p-6`}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{isPurchase ? "Receipt" : "Invoice"}</DialogTitle>
        </DialogHeader>
        <div
          id="invoice-content"
          className={`print:p-0 text-black ${
            invoiceLayout === "pos-a4"
              ? "text-sm"
              : invoiceLayout === "pos-80mm"
                ? "text-[13px] font-sans"
                : "text-[11px] font-sans"
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

          {/* Header - 3 Column Layout */}
          <div className="flex justify-between items-center mb-3 border-b pb-3 gap-2">
            {/* Column 1: Secondary Logo (Left) */}
            <div className="w-1/5 flex justify-start items-center">
              {generalSettings?.secondaryLogoUrl && (
                <img
                  src={generalSettings.secondaryLogoUrl}
                  alt="Secondary Logo"
                  className={`${invoiceLayout === "pos-a4" ? "h-20" : isPosNarrow ? "h-12" : "h-16"} w-auto object-contain rounded-sm`}
                />
              )}
            </div>

            {/* Column 2: Center Info (Company Info) */}
            <div className="w-3/5 flex flex-col items-center text-center space-y-0.5">
              <h1 className={`${invoiceLayout === "pos-a4" ? "text-2xl" : isPosNarrow ? "text-base font-extrabold" : "text-xl"} font-bold text-black leading-tight uppercase`}>
                {generalSettings?.companyName || "Company Name"}
              </h1>
              {generalSettings?.businessAddress && (
                <p className={`${isPosNarrow ? "text-[11px]" : "text-xs"} leading-tight max-w-[260px] text-gray-800`}>{generalSettings.businessAddress}</p>
              )}
              {phoneNumbers && (
                <p className={`${isPosNarrow ? "text-[11px]" : "text-xs"} font-medium leading-tight text-gray-900`}>{phoneNumbers}</p>
              )}
              {generalSettings?.binNumber && (
                <p className={`${isPosNarrow ? "text-[10px]" : "text-xs"} font-semibold leading-tight`}>BIN : {generalSettings.binNumber}</p>
              )}
            </div>

            {/* Column 3: Primary Logo (Right) */}
            <div className="w-1/5 flex justify-end items-center">
              {generalSettings?.logoUrl && (
                <img
                  src={generalSettings.logoUrl}
                  alt="Logo"
                  className={`${invoiceLayout === "pos-a4" ? "h-20" : isPosNarrow ? "h-12" : "h-16"} w-auto object-contain rounded-sm`}
                />
              )}
            </div>
          </div>

          {/* Bill Info Header */}
          {isPosNarrow ? (
            <div className="mb-3 border-b border-dashed pb-2 text-[12px] space-y-1">
              <div className="flex justify-between items-center font-medium">
                <span>Bill No: <span className="font-bold">{invoiceNo}</span></span>
                <span>Date: <span className="font-bold">{formatDateHeader(transaction.createdAt)}</span></span>
              </div>
              {vehicleNo && (
                <div className="flex justify-between items-center">
                  <span>G No: <span className="font-bold">{vehicleNo}</span></span>
                </div>
              )}
              {transaction.contact && transaction.contact.name && (
                <div className="flex justify-between items-center text-gray-700">
                  <span>{isPurchase ? "Supplier:" : "Customer:"} {transaction.contact.name}</span>
                  {transaction.contact.phone && <span>{transaction.contact.phone}</span>}
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-between items-end mb-4 text-xs border-b pb-2">
              <div>
                <p className="font-semibold">
                  {isPurchase ? "SUPPLIER:" : "CUSTOMER:"} {transaction.contact?.name || "Walk-in"}
                </p>
                {transaction.contact?.phone && <p>{transaction.contact.phone}</p>}
                {vehicleNo && <p>Vehicle No: {vehicleNo}</p>}
              </div>
              <div className="text-right">
                <p>
                  <span className="font-semibold">{isPurchase ? "PO#:" : "INV#:"}</span>{" "}
                  {invoiceNo}
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
          )}

          {/* Items Table */}
          <div className="mb-4 overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-t border-black/80">
                  <th className={`text-left font-bold ${isPosNarrow ? "py-1 px-1" : "py-2 px-3"}`}>Product Name</th>
                  {!isPosNarrow && (
                    <th className="text-left py-2 px-3 font-bold">Description</th>
                  )}
                  <th className={`text-right font-bold ${isPosNarrow ? "py-1 px-1" : "py-2 px-3"}`}>MRP</th>
                  <th className={`text-center font-bold ${isPosNarrow ? "py-1 px-1" : "py-2 px-3"}`}>
                    {isPosNarrow ? "Liter" : "Qty"}
                  </th>
                  {!isPosNarrow && totals.discount > 0 && (
                    <th className="text-right py-2 px-3 font-bold">Disc.</th>
                  )}
                  <th className={`text-right font-bold ${isPosNarrow ? "py-1 px-1" : "py-2 px-3"}`}>Price</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr className="border-b">
                    <td
                      className={`text-center text-muted-foreground ${isPosNarrow ? "py-3 px-1" : "py-6 px-4"}`}
                      colSpan={isPosNarrow ? 4 : (totals.discount > 0 ? 6 : 5)}
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

                    // Extract nozzle / dispenser prefix if present
                    const dispenserId = (item as any).dispenserId;
                    const nozzlePrefix = dispenserId ? `${String(dispenserId).slice(-1)} ` : "";

                    return (
                      <tr key={index} className="border-b border-gray-200">
                        <td className={isPosNarrow ? "py-1.5 px-1 align-top" : "py-2 px-3 align-top"}>
                          <div className="font-medium">
                            {isPosNarrow && nozzlePrefix}{item.itemName}
                          </div>
                          {!isPosNarrow && item.sku && (
                            <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                          )}
                          {!isPosNarrow && item.itemDescription && (
                            <div className="text-xs text-muted-foreground mt-0.5" dangerouslySetInnerHTML={{ __html: item.itemDescription }} />
                          )}
                        </td>
                        {!isPosNarrow && (
                          <td className="py-2 px-3 text-muted-foreground text-xs" dangerouslySetInnerHTML={{ __html: item.itemDescription || "-" }} />
                        )}
                        <td className={`text-right whitespace-nowrap ${isPosNarrow ? "py-1.5 px-1 align-top" : "py-2 px-3 align-top"}`}>
                          {item.price.toFixed(2)}
                        </td>
                        <td className={`text-center whitespace-nowrap ${isPosNarrow ? "py-1.5 px-1 align-top" : "py-2 px-3 align-top"}`}>
                          <div>{item.quantity}</div>
                        </td>
                        {!isPosNarrow && totals.discount > 0 && (
                          <td className="text-right py-2 px-3 align-top whitespace-nowrap">
                            {itemDiscount > 0
                              ? `-${formatCurrency(itemDiscount, { generalSettings })}`
                              : "-"}
                          </td>
                        )}
                        <td className={`text-right font-medium whitespace-nowrap ${isPosNarrow ? "py-1.5 px-1 align-top" : "py-2 px-3 align-top"}`}>
                          {itemTotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end mb-6">
            <div className={`${isPosNarrow ? "w-full space-y-1 text-[12px]" : "w-full md:w-80 space-y-1.5 text-sm"}`}>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-semibold">{totals.subtotal.toFixed(2)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span className="font-semibold">{totals.discount.toFixed(2)}</span>
                </div>
              )}
              {totals.tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span className="font-semibold">{totals.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-b border-black/80 py-0.5 font-bold">
                <span>Net Amount:</span>
                <span>{totals.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid:</span>
                <span className="font-semibold">{totals.paid.toFixed(2)}</span>
              </div>

              {totals.due > 0 && (
                <div className="flex justify-between font-bold text-red-600">
                  <span>Current Due:</span>
                  <span>{totals.due.toFixed(2)}</span>
                </div>
              )}

              {totals.change > 0 && (
                <div className="flex justify-between font-bold">
                  <span>Cash Return:</span>
                  <span>-{totals.change.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer - Signature & Timestamp (Matching actual-print.jpeg) */}
          <div className="mt-8 pt-4 border-t border-gray-300 flex justify-between items-end text-[11px] text-gray-800">
            <div>
              <p className="font-bold border-b border-black w-24 mb-1 pb-0.5">Signature</p>
              <p>{(transaction as any)?.createdBy?.name || "Khaleque"}</p>
            </div>
            <div className="text-right">
              <p>{formatTimestamp(transaction.createdAt)}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

