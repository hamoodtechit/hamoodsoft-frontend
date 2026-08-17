"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppSettings } from "@/lib/providers/settings-provider";
import { formatCurrency } from "@/lib/utils/currency";
import { Purchase, Sale, SaleItem, PurchaseItem } from "@/types";
import { Download, History, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

// ───────────────────────────────────────────────────
// Types & Constants
// ───────────────────────────────────────────────────

type InvoiceFormat = "pos-58mm" | "pos-80mm" | "a4" | "a5";

/** Physical paper widths in mm */
const FORMAT_CONFIG: Record<
  InvoiceFormat,
  {
    label: string;
    paperWidthMm: number;
    /** Approximate screen preview width in px (96 dpi) */
    previewWidthPx: number;
    /** CSS @page size value */
    pageSize: string;
    /** Page margin for @page */
    pageMargin: string;
    /** Content padding in mm */
    paddingMm: string;
    /** Logo max height in mm */
    logoMaxHeightMm: number;
    /** Logo max width in mm */
    logoMaxWidthMm: number;
    /** Base font size in pt */
    fontSizePt: number;
    /** Title font size in pt */
    titleFontSizePt: number;
    /** Small font size in pt */
    smallFontSizePt: number;
    /** Whether this is a narrow POS receipt */
    isPosNarrow: boolean;
  }
> = {
  "pos-58mm": {
    label: "POS 58mm",
    paperWidthMm: 58,
    previewWidthPx: 220,
    pageSize: "58mm auto",
    pageMargin: "0mm",
    paddingMm: "2mm 3mm",
    logoMaxHeightMm: 8,
    logoMaxWidthMm: 12,
    fontSizePt: 7,
    titleFontSizePt: 7,
    smallFontSizePt: 6,
    isPosNarrow: true,
  },
  "pos-80mm": {
    label: "POS 80mm",
    paperWidthMm: 80,
    previewWidthPx: 302,
    pageSize: "80mm auto",
    pageMargin: "0mm",
    paddingMm: "2mm 4mm",
    logoMaxHeightMm: 10,
    logoMaxWidthMm: 15,
    fontSizePt: 8,
    titleFontSizePt: 9,
    smallFontSizePt: 7,
    isPosNarrow: true,
  },
  a4: {
    label: "A4",
    paperWidthMm: 210,
    previewWidthPx: 794,
    pageSize: "A4",
    pageMargin: "10mm",
    paddingMm: "5mm 10mm",
    logoMaxHeightMm: 18,
    logoMaxWidthMm: 25,
    fontSizePt: 10,
    titleFontSizePt: 16,
    smallFontSizePt: 8,
    isPosNarrow: false,
  },
  a5: {
    label: "A5",
    paperWidthMm: 148,
    previewWidthPx: 559,
    pageSize: "148mm 210mm",
    pageMargin: "8mm",
    paddingMm: "4mm 8mm",
    logoMaxHeightMm: 14,
    logoMaxWidthMm: 20,
    fontSizePt: 9,
    titleFontSizePt: 14,
    smallFontSizePt: 7.5,
    isPosNarrow: false,
  },
};

/** Maps legacy layout setting values to InvoiceFormat */
function settingToFormat(layout?: string): InvoiceFormat {
  switch (layout) {
    case "pos-58mm":
      return "pos-58mm";
    case "pos-80mm":
      return "pos-80mm";
    case "pos-a4":
    case "a4":
      return "a4";
    case "a5":
      return "a5";
    default:
      return "pos-80mm";
  }
}

// ───────────────────────────────────────────────────
// Component
// ───────────────────────────────────────────────────

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

  // Format selector — defaults to the business setting, user can override per-print
  const defaultFormat = settingToFormat(invoiceSettings?.layout);
  const [selectedFormat, setSelectedFormat] =
    useState<InvoiceFormat>(defaultFormat);

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
        tax = Math.max(0, total - afterDiscount);
      }
    } else {
      tax = Math.max(0, total - afterDiscount);
    }

    const paid = transaction.paidAmount || 0;
    const due = Math.max(0, total - paid);
    const change = Math.max(0, paid - total);

    return { subtotal: itemsSubtotal, discount, tax, total, paid, due, change };
  }, [transaction, items]);

  const cfg = FORMAT_CONFIG[selectedFormat];

  // ── Date formatters ──

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

  /** Format date for MUSHAK 6.3: DD-Mon-YYYY */
  const formatDateMushak = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  /** Format time for MUSHAK 6.3: hh:mm AM/PM */
  const formatTimeMushak = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${String(hours).padStart(2, "0")}:${mins} ${ampm}`;
  };

  // ── Invoice Data ──

  const invoiceNo = isPurchase
    ? (transaction as Purchase)?.poNumber || transaction?.id
    : (transaction as Sale)?.invoiceNumber || transaction?.id;

  const vehicleNo = !isPurchase ? (transaction as Sale)?.vehicleNo : undefined;
  const selectedVehicle = !isPurchase && vehicleNo
    ? transaction?.contact?.vehicles?.find((v) => v.vehicleNo === vehicleNo)
    : undefined;
  const driverName = selectedVehicle?.driverName;

  // Tax rate from transaction (sale-level)
  const txRate = isPurchase
    ? (transaction as Purchase)?.taxRate || 0
    : (transaction as Sale)?.taxRate || 0;

  const phoneNumbers = [
    generalSettings?.officePhone,
    generalSettings?.counterPhone,
  ]
    .filter(Boolean)
    .join(", ");

  /**
   * Cleans item names for receipt display.
   * Backend stores names like "Octane 95 (Dispenser 01 (Octane 95))".
   * We strip the parenthetical dispenser info and show only the fuel type name.
   */
  const cleanItemName = (name: string): string => {
    // Remove everything from the first " (" onwards — e.g. "Octane 95 (Dispenser 01 ...)" → "Octane 95"
    const cleaned = name.replace(/\s*\(.*$/, "").trim();
    return cleaned || name; // fallback to original if regex somehow clears everything
  };

  /**
   * Formats unit names into abbreviations. e.g. "Liter" -> "L", "Piece" -> "Pc"
   */
  const formatUnitAbbreviation = (item: any): string => {
    if (item.itemType === "FUEL") return "L";
    if (!item.unit) return "";
    
    const unitLower = item.unit.toLowerCase();
    if (unitLower.includes("lit") || unitLower === "l") return "L";
    if (unitLower.includes("piec") || unitLower === "pc" || unitLower === "pcs") return "Pc";
    if (unitLower.includes("kilo") || unitLower === "kg") return "Kg";
    if (unitLower.includes("gram") || unitLower === "g") return "g";
    if (unitLower.includes("meter") || unitLower === "m") return "m";
    
    return item.unit;
  };

  // ──────────────────────────────────────────────────────────
  // Generate self-contained print HTML (physical units only)
  // ──────────────────────────────────────────────────────────

  const buildPrintHTML = (): string => {
    if (!transaction) return "";

    const f = FORMAT_CONFIG[selectedFormat];
    const isPOS = f.isPosNarrow;

    // Build items rows
    const itemRows = items
      .map((item) => {
        const itemSubtotal = item.price * item.quantity;
        const itemDiscount =
          item.discountType === "PERCENTAGE"
            ? (itemSubtotal * (item.discountAmount || 0)) / 100
            : item.discountType === "FIXED"
              ? item.discountAmount || 0
              : 0;
        const itemTotal = item.totalPrice || itemSubtotal - itemDiscount;
        const itemTaxAmount = txRate > 0 ? (itemTotal * txRate) / 100 : 0;
        const displayName = cleanItemName(item.itemName);

        if (isPOS) {
          return `<tr>
            <td style="padding:1mm 0.5mm;text-align:left;border-bottom:0.3mm solid #ddd;">${displayName}</td>
            <td style="padding:1mm 0.5mm;text-align:right;border-bottom:0.3mm solid #ddd;">${item.price.toFixed(2)}</td>
            <td style="padding:1mm 0.5mm;text-align:center;border-bottom:0.3mm solid #ddd;">${item.quantity} ${formatUnitAbbreviation(item)}</td>
            <td style="padding:1mm 0.5mm;text-align:center;border-bottom:0.3mm solid #ddd;font-size:${f.smallFontSizePt}pt;">${txRate > 0 ? `${txRate}%` : "0"}</td>
            <td style="padding:1mm 0.5mm;text-align:right;border-bottom:0.3mm solid #ddd;font-size:${f.smallFontSizePt}pt;">${txRate > 0 ? itemTaxAmount.toFixed(2) : "0"}</td>
            <td style="padding:1mm 0.5mm;text-align:right;border-bottom:0.3mm solid #ddd;">${itemTotal.toFixed(2)}</td>
          </tr>`;
        } else {
          return `<tr>
            <td style="padding:1.5mm 2mm;text-align:left;border-bottom:0.3mm solid #ddd;">
              ${displayName}
              ${item.sku ? `<div style="font-size:${f.smallFontSizePt}pt;color:#666;">SKU: ${item.sku}</div>` : ""}
            </td>
            <td style="padding:1.5mm 2mm;text-align:right;border-bottom:0.3mm solid #ddd;">${item.price.toFixed(2)}</td>
            <td style="padding:1.5mm 2mm;text-align:center;border-bottom:0.3mm solid #ddd;">${item.quantity} ${formatUnitAbbreviation(item)}</td>
            ${totals.discount > 0 ? `<td style="padding:1.5mm 2mm;text-align:right;border-bottom:0.3mm solid #ddd;">${itemDiscount > 0 ? `-${itemDiscount.toFixed(2)}` : "-"}</td>` : ""}
            <td style="padding:1.5mm 2mm;text-align:center;border-bottom:0.3mm solid #ddd;">${txRate > 0 ? `${txRate}%` : "0"}</td>
            <td style="padding:1.5mm 2mm;text-align:right;border-bottom:0.3mm solid #ddd;">${txRate > 0 ? itemTaxAmount.toFixed(2) : "0"}</td>
            <td style="padding:1.5mm 2mm;text-align:right;border-bottom:0.3mm solid #ddd;font-weight:500;">${itemTotal.toFixed(2)}</td>
          </tr>`;
        }
      })
      .join("\n");

    // Table header
    const tableHeader = isPOS
      ? `<tr style="border-top:0.5mm solid #000;border-bottom:0.5mm solid #000;">
            <th style="padding:1mm 0.5mm;text-align:left;font-weight:bold;">Product Name</th>
            <th style="padding:1mm 0.5mm;text-align:right;font-weight:bold;">Rate</th>
            <th style="padding:1mm 0.5mm;text-align:center;font-weight:bold;">Qty</th>
            <th style="padding:1mm 0.5mm;text-align:center;font-weight:bold;">Tax %</th>
            <th style="padding:1mm 0.5mm;text-align:right;font-weight:bold;">Tax Amt</th>
            <th style="padding:1mm 0.5mm;text-align:right;font-weight:bold;">Total</th>
          </tr>`
      : `<tr style="border-top:0.5mm solid #000;border-bottom:0.5mm solid #000;">
            <th style="padding:1.5mm 2mm;text-align:left;font-weight:bold;">Product Name</th>
            <th style="padding:1.5mm 2mm;text-align:right;font-weight:bold;">Rate</th>
            <th style="padding:1.5mm 2mm;text-align:center;font-weight:bold;">Qty</th>
            ${totals.discount > 0 ? `<th style="padding:1.5mm 2mm;text-align:right;font-weight:bold;">Disc.</th>` : ""}
            <th style="padding:1.5mm 2mm;text-align:center;font-weight:bold;">Tax %</th>
            <th style="padding:1.5mm 2mm;text-align:right;font-weight:bold;">Tax Amt</th>
            <th style="padding:1.5mm 2mm;text-align:right;font-weight:bold;">Total</th>
          </tr>`;

    // Logos
    const logoLeft = generalSettings?.secondaryLogoUrl
      ? `<img src="${generalSettings.secondaryLogoUrl}" alt="Logo" style="max-height:${f.logoMaxHeightMm}mm;max-width:${f.logoMaxWidthMm}mm;object-fit:contain;" />`
      : "";
    const logoRight = generalSettings?.logoUrl
      ? `<img src="${generalSettings.logoUrl}" alt="Logo" style="max-height:${f.logoMaxHeightMm}mm;max-width:${f.logoMaxWidthMm}mm;object-fit:contain;" />`
      : "";

    // Bill info section
    const billInfoHtml = isPOS
      ? `<div style="margin-bottom:2mm;padding-bottom:1.5mm;border-bottom:0.3mm dashed #000;font-size:${f.fontSizePt}pt;">
            <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:1mm;font-weight:500;">
              <span style="flex:1 1 auto;min-width:50%;">Name: ${transaction.contact?.name || "Walk-in"}</span>
              <span style="white-space:nowrap;">INV: <strong>${invoiceNo}</strong></span>
            </div>
            <div style="margin-top:0.5mm;">
              <span>Date: <strong>${formatDateMushak(transaction.createdAt)}</strong></span>
              <span style="margin-left:2mm;">Time: <strong>${formatTimeMushak(transaction.createdAt)}</strong></span>
            </div>
            ${(vehicleNo || transaction.contact?.binNumber) ? `<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:1mm;font-weight:500;margin-top:0.5mm;">
              ${vehicleNo ? `<span style="flex:1 1 auto;min-width:50%;">G No: <strong>${vehicleNo}</strong>${driverName ? ` (Driver: <strong>${driverName}</strong>)` : ""}</span>` : `<span style="flex:1 1 auto;"></span>`}
              ${transaction.contact?.binNumber ? `<span style="white-space:nowrap;">BIN: <strong>${transaction.contact.binNumber}</strong></span>` : ""}
            </div>` : ""}
          </div>`
      : `<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:3mm;padding-bottom:2mm;border-bottom:0.3mm solid #000;font-size:${f.fontSizePt}pt;">
            <div>
              <div style="font-weight:600;">Name: ${transaction.contact?.name || "Walk-in"}</div>
              <div style="display:flex;flex-wrap:wrap;gap:3mm;margin-top:0.5mm;">
                ${vehicleNo ? `<div>Vehicle No: <strong>${vehicleNo}</strong>${driverName ? ` (Driver: <strong>${driverName}</strong>)` : ""}</div>` : ""}
                ${transaction.contact?.binNumber ? `<div>Customer BIN: <strong>${transaction.contact.binNumber}</strong></div>` : ""}
              </div>
            </div>
            <div style="text-align:right;">
              <div><strong>${isPurchase ? "PO:" : "INV:"}</strong> ${invoiceNo}</div>
              <div><strong>Date:</strong> ${formatDateMushak(transaction.createdAt)}  <strong>Time:</strong> ${formatTimeMushak(transaction.createdAt)}</div>
            </div>
          </div>`;

    // Totals section — always show all rows (matching reference receipt)
    const totalRowStyle = `display:flex;justify-content:space-between;padding:0.5mm 0;`;
    const totalsHtml = `
      <div style="margin-top:2mm;${isPOS ? "font-size:" + f.fontSizePt + "pt;" : "font-size:" + f.fontSizePt + "pt;max-width:70mm;margin-left:auto;"}">
        <div style="${totalRowStyle}">
          <span>Total Amount:</span>
          <span style="font-weight:600;">${totals.subtotal.toFixed(2)}</span>
        </div>
        <div style="${totalRowStyle}">
          <span>Discount:</span>
          <span style="font-weight:600;">${totals.discount.toFixed(2)}</span>
        </div>
        ${totals.tax > 0 ? `<div style="${totalRowStyle}"><span>Tax:</span><span style="font-weight:600;">${totals.tax.toFixed(2)}</span></div>` : ""}
        <div style="${totalRowStyle}border-top:0.5mm solid #000;border-bottom:0.5mm solid #000;font-weight:bold;padding:0.8mm 0;">
          <span>Net Amount:</span>
          <span>${totals.total.toFixed(2)}</span>
        </div>
        <div style="${totalRowStyle}">
          <span>Paid:</span>
          <span style="font-weight:bold;">${totals.paid.toFixed(2)}</span>
        </div>
        ${(transaction as any)?.payments?.length > 0 ? (transaction as any).payments.map((p: any) => `
        <div style="${totalRowStyle}font-size:${f.smallFontSizePt}pt;color:#555;">
          <span>  - ${p.type === 'CUSTOMER_ACCOUNT' ? 'Company Balance' : (p.type === 'SALE_PAYMENT' ? 'Cash' : (p.type || 'Cash'))}:</span>
          <span>${Number(p.amount).toFixed(2)}</span>
        </div>`).join('') : ''}
        <div style="${totalRowStyle}${totals.due > 0 ? "font-weight:bold;color:#dc2626;" : ""}">
          <span>Current Due:</span>
          <span>${totals.due.toFixed(2)}</span>
        </div>
        <!-- Cash and Cash Return hidden until POS input features are implemented -->
      </div>`;

    // Footer
    const footerHtml = isPOS
      ? `
      <div style="margin-top:3mm;padding-top:2mm;border-top:0.3mm solid #ccc;text-align:center;font-size:${f.smallFontSizePt}pt;color:#555;font-style:italic;">
        This is a system-generated invoice
      </div>
      <div style="margin-top:2mm;text-align:center;font-size:${f.smallFontSizePt}pt;color:#888;">
        Powered by HamoodTech
      </div>`
      : `
      <div style="margin-top:5mm;padding-top:3mm;border-top:0.3mm solid #ccc;display:flex;justify-content:space-between;align-items:center;font-size:${f.smallFontSizePt}pt;">
        <div style="color:#555;font-style:italic;">This is a system-generated invoice</div>
        <div style="color:#888;">Powered by HamoodTech</div>
      </div>`;

    // Full HTML document
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${isPurchase ? "Receipt" : "Invoice"} ${transaction.id}</title>
  <style>
    @page {
      size: ${f.pageSize};
      margin: ${f.pageMargin};
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: ${f.paperWidthMm}mm;
      background: white !important;
      color: black !important;
      font-family: Arial, Helvetica, sans-serif;
      font-size: ${f.fontSizePt}pt;
      line-height: 1.3;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      padding: ${f.paddingMm};
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    img {
      display: block;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2mm;padding-bottom:2mm;border-bottom:0.3mm solid #000;">
    <div style="flex:0 0 auto;">${logoLeft}</div>
    <div style="flex:1;text-align:center;padding:0 1mm;overflow:hidden;">
      <div style="font-weight:bold;text-transform:uppercase;line-height:1.2;white-space:nowrap;font-size:${f.titleFontSizePt}pt;">
        ${generalSettings?.companyName || "Company Name"}
      </div>
      ${generalSettings?.businessAddress ? `<div style="font-size:${f.smallFontSizePt}pt;color:#333;margin-top:0.5mm;line-height:1.2;">${generalSettings.businessAddress}</div>` : ""}
      ${phoneNumbers ? `<div style="font-size:${f.smallFontSizePt}pt;font-weight:500;margin-top:0.3mm;">${phoneNumbers}</div>` : ""}
      ${generalSettings?.binNumber ? `<div style="font-size:${f.smallFontSizePt}pt;font-weight:600;margin-top:0.3mm;">BIN : ${generalSettings.binNumber}</div>` : ""}
      <div style="font-weight:bold;margin-top:1mm;font-size:${f.fontSizePt}pt;">MUSHAK 6.3 / মূসক-৬.৩</div>
      <div style="font-weight:600;font-size:${f.fontSizePt}pt;">Tax Invoice / কর চালানপত্র</div>
    </div>
    <div style="flex:0 0 auto;">${logoRight}</div>
  </div>

  <!-- Bill Info -->
  ${billInfoHtml}

  <!-- Items Table -->
  <table>
    <thead>${tableHeader}</thead>
    <tbody>
      ${items.length === 0 ? `<tr><td colspan="${isPOS ? 6 : (totals.discount > 0 ? 8 : 7)}" style="text-align:center;padding:3mm;">No items found.</td></tr>` : itemRows}
    </tbody>
  </table>

  <!-- Totals -->
  ${totalsHtml}

  <!-- Footer -->
  ${footerHtml}
</body>
</html>`;
  };

  // ──────────────────────────────────────────────────────────
  // Print / Download handlers
  // ──────────────────────────────────────────────────────────

  const triggerPrintOrDownload = () => {
    const html = buildPrintHTML();
    if (!html) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          onOpenChange(false);
        }, 1000);
      }, 300);
    }
  };

  // ──────────────────────────────────────────────────────────
  // Screen Preview (Tailwind-based, accurate width)
  // ──────────────────────────────────────────────────────────

  if (!transaction) return null;

  // Preview container max-width based on selected format
  const previewMaxWidth = `${cfg.previewWidthPx}px`;
  const previewFontClass = cfg.isPosNarrow
    ? selectedFormat === "pos-58mm"
      ? "text-[10px]"
      : "text-[12px]"
    : selectedFormat === "a5"
      ? "text-[13px]"
      : "text-sm";

  // Dialog max width — slightly wider than preview to allow for dialog padding
  const dialogMaxWidthClass =
    selectedFormat === "a4"
      ? "!max-w-[860px] w-[95vw]"
      : selectedFormat === "a5"
        ? "!max-w-[620px] w-[95vw]"
        : selectedFormat === "pos-80mm"
          ? "!max-w-[380px] w-[95vw]"
          : "!max-w-[300px] w-[95vw]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${dialogMaxWidthClass} max-h-[90vh] overflow-y-auto mx-auto p-4 sm:p-6`}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{isPurchase ? "Receipt" : "Invoice"}</DialogTitle>
        </DialogHeader>

        {/* ── Toolbar: Format selector + Action buttons ── */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 print:hidden border-b pb-3">
          {/* Format selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              Paper Size:
            </span>
            <Select
              value={selectedFormat}
              onValueChange={(v) => setSelectedFormat(v as InvoiceFormat)}
            >
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pos-58mm">POS 58mm</SelectItem>
                <SelectItem value="pos-80mm">POS 80mm</SelectItem>
                <SelectItem value="a4">A4</SelectItem>
                <SelectItem value="a5">A5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              autoFocus
              variant="outline"
              size="sm"
              onClick={triggerPrintOrDownload}
            >
              <Printer className="h-4 w-4 mr-1.5" />
              Print
            </Button>
            {onOpenRecentTransactions && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenRecentTransactions}
              >
                <History className="h-4 w-4 mr-1.5" />
                Recent
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={triggerPrintOrDownload}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download
            </Button>
          </div>
        </div>

        {/* ── Preview Area ── */}
        <div
          className={`mx-auto bg-white text-black font-sans ${previewFontClass}`}
          style={{
            maxWidth: previewMaxWidth,
            width: "100%",
            border: "1px dashed #d1d5db",
            borderRadius: "4px",
          }}
        >
          <div
            className="p-3"
            style={{
              padding: cfg.isPosNarrow ? "8px 6px" : "16px 20px",
            }}
          >
            {/* Header - 3 Column Layout */}
            <div className="flex justify-between items-center mb-2 border-b pb-2 gap-1">
              {/* Left Logo */}
              <div className="flex-shrink-0 flex justify-start items-center">
                {generalSettings?.secondaryLogoUrl && (
                  <img
                    src={generalSettings.secondaryLogoUrl}
                    alt="Secondary Logo"
                    className="object-contain rounded-sm"
                    style={{
                      maxHeight: `${cfg.logoMaxHeightMm * 3.78}px`,
                      maxWidth: `${cfg.logoMaxWidthMm * 3.78}px`,
                    }}
                  />
                )}
              </div>

              {/* Center Info */}
              <div className="flex-1 flex flex-col items-center text-center px-1 overflow-hidden">
                <h1
                  className="font-bold text-black leading-tight uppercase whitespace-nowrap"
                  style={{
                    fontSize: `${cfg.titleFontSizePt * 1.33}px`,
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {generalSettings?.companyName || "Company Name"}
                </h1>
                {generalSettings?.businessAddress && (
                  <p
                    className="leading-tight text-gray-800 mt-0.5"
                    style={{ fontSize: `${cfg.smallFontSizePt * 1.33}px` }}
                  >
                    {generalSettings.businessAddress}
                  </p>
                )}
                {phoneNumbers && (
                  <p
                    className="font-medium leading-tight text-gray-900"
                    style={{ fontSize: `${cfg.smallFontSizePt * 1.33}px` }}
                  >
                    {phoneNumbers}
                  </p>
                )}
                {generalSettings?.binNumber && (
                  <p
                    className="font-semibold leading-tight"
                    style={{ fontSize: `${cfg.smallFontSizePt * 1.33}px` }}
                  >
                    BIN : {generalSettings.binNumber}
                  </p>
                )}
                <p
                  className="font-bold mt-1"
                  style={{ fontSize: `${cfg.fontSizePt * 1.33}px` }}
                >
                  MUSHAK 6.3 / মূসক-৬.৩
                </p>
                <p
                  className="font-semibold"
                  style={{ fontSize: `${cfg.fontSizePt * 1.33}px` }}
                >
                  Tax Invoice / কর চালানপত্র
                </p>
              </div>

              {/* Right Logo */}
              <div className="flex-shrink-0 flex justify-end items-center">
                {generalSettings?.logoUrl && (
                  <img
                    src={generalSettings.logoUrl}
                    alt="Logo"
                    className="object-contain rounded-sm"
                    style={{
                      maxHeight: `${cfg.logoMaxHeightMm * 3.78}px`,
                      maxWidth: `${cfg.logoMaxWidthMm * 3.78}px`,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Bill Info */}
            {cfg.isPosNarrow ? (
              <div className="mb-2 border-b border-dashed pb-1.5 space-y-0.5">
                <div className="flex flex-wrap justify-between items-start gap-x-2 font-medium">
                  <span className="flex-1 min-w-[50%]">
                    Name: {transaction.contact?.name || "Walk-in"}
                  </span>
                  <span className="whitespace-nowrap">
                    INV: <span className="font-bold">{invoiceNo}</span>
                  </span>
                </div>
                <div>
                  <span>
                    Date: <span className="font-bold">{formatDateMushak(transaction.createdAt)}</span>
                  </span>
                  <span className="ml-3">
                    Time: <span className="font-bold">{formatTimeMushak(transaction.createdAt)}</span>
                  </span>
                </div>
                {(vehicleNo || transaction.contact?.binNumber) && (
                  <div className="flex flex-wrap justify-between items-start gap-x-2 font-medium">
                    {vehicleNo ? (
                      <span className="flex-1 min-w-[50%]">
                        G No: <span className="font-bold">{vehicleNo}</span>
                        {driverName && <span> (Driver: <span className="font-bold">{driverName}</span>)</span>}
                      </span>
                    ) : (
                      <span className="flex-1" />
                    )}
                    {transaction.contact?.binNumber && (
                      <span className="whitespace-nowrap">
                        BIN: <span className="font-bold">{transaction.contact.binNumber}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-between items-end mb-3 border-b pb-2">
                <div>
                  <p className="font-semibold">
                    Name:{" "}
                    {transaction.contact?.name || "Walk-in"}
                  </p>
                  <div className="flex flex-wrap gap-x-3 text-sm">
                    {vehicleNo && (
                      <p>
                        Vehicle No: <span className="font-medium">{vehicleNo}</span>
                        {driverName && <span> (Driver: <span className="font-medium">{driverName}</span>)</span>}
                      </p>
                    )}
                    {transaction.contact?.binNumber && (
                      <p className="font-medium">Customer BIN: {transaction.contact.binNumber}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p>
                    <span className="font-semibold">
                      {isPurchase ? "PO:" : "INV:"}
                    </span>{" "}
                    {invoiceNo}
                  </p>
                  <p>
                    <span className="font-semibold">Date:</span>{" "}
                    {formatDateMushak(transaction.createdAt)}{" "}
                    <span className="font-semibold ml-2">Time:</span>{" "}
                    {formatTimeMushak(transaction.createdAt)}
                  </p>
                </div>
              </div>
            )}

            {/* Items Table */}
            <div className="mb-3">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-t border-black/80">
                    <th
                      className={`text-left font-bold ${cfg.isPosNarrow ? "py-0.5 px-0.5" : "py-1.5 px-2"}`}
                    >
                      Product Name
                    </th>

                    <th
                      className={`text-right font-bold ${cfg.isPosNarrow ? "py-0.5 px-0.5" : "py-1.5 px-2"}`}
                    >
                      Rate
                    </th>
                    <th
                      className={`text-center font-bold ${cfg.isPosNarrow ? "py-0.5 px-0.5" : "py-1.5 px-2"}`}
                    >
                      Qty
                    </th>
                    {!cfg.isPosNarrow && totals.discount > 0 && (
                      <th className="text-right py-1.5 px-2 font-bold">
                        Disc.
                      </th>
                    )}
                    <th
                      className={`text-center font-bold ${cfg.isPosNarrow ? "py-0.5 px-0.5" : "py-1.5 px-2"}`}
                    >
                      Tax %
                    </th>
                    <th
                      className={`text-right font-bold ${cfg.isPosNarrow ? "py-0.5 px-0.5" : "py-1.5 px-2"}`}
                    >
                      Tax Amt
                    </th>
                    <th
                      className={`text-right font-bold ${cfg.isPosNarrow ? "py-0.5 px-0.5" : "py-1.5 px-2"}`}
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr className="border-b">
                      <td
                        className="text-center text-muted-foreground py-4"
                        colSpan={
                          cfg.isPosNarrow
                            ? 6
                            : totals.discount > 0
                              ? 8
                              : 7
                        }
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
                      const itemTaxAmount = txRate > 0 ? (itemTotal * txRate) / 100 : 0;
                      const displayName = cleanItemName(item.itemName);

                      return (
                        <tr key={index} className="border-b border-gray-200">
                          <td
                            className={
                              cfg.isPosNarrow
                                ? "py-1 px-0.5 align-top"
                                : "py-1.5 px-2 align-top"
                            }
                          >
                            <div className="font-medium">
                              {displayName}
                            </div>
                            {!cfg.isPosNarrow && item.sku && (
                              <div className="text-xs text-muted-foreground">
                                SKU: {item.sku}
                              </div>
                            )}
                          </td>

                          <td
                            className={`text-right whitespace-nowrap ${cfg.isPosNarrow ? "py-1 px-0.5 align-top" : "py-1.5 px-2 align-top"}`}
                          >
                            {item.price.toFixed(2)}
                          </td>
                          <td
                            className={`text-center whitespace-nowrap ${cfg.isPosNarrow ? "py-1 px-0.5 align-top" : "py-1.5 px-2 align-top"}`}
                          >
                            {item.quantity} {formatUnitAbbreviation(item)}
                          </td>
                          {!cfg.isPosNarrow && totals.discount > 0 && (
                            <td className="text-right py-1.5 px-2 align-top whitespace-nowrap">
                              {itemDiscount > 0
                                ? `-${formatCurrency(itemDiscount, { generalSettings })}`
                                : "-"}
                            </td>
                          )}
                          <td
                            className={`text-center whitespace-nowrap ${cfg.isPosNarrow ? "py-1 px-0.5 align-top" : "py-1.5 px-2 align-top"}`}
                            style={{ fontSize: cfg.isPosNarrow ? `${cfg.smallFontSizePt * 1.33}px` : "inherit" }}
                          >
                            {txRate > 0 ? `${txRate}%` : "0"}
                          </td>
                          <td
                            className={`text-right whitespace-nowrap ${cfg.isPosNarrow ? "py-1 px-0.5 align-top" : "py-1.5 px-2 align-top"}`}
                            style={{ fontSize: cfg.isPosNarrow ? `${cfg.smallFontSizePt * 1.33}px` : "inherit" }}
                          >
                            {txRate > 0 ? itemTaxAmount.toFixed(2) : "0"}
                          </td>
                          <td
                            className={`text-right font-medium whitespace-nowrap ${cfg.isPosNarrow ? "py-1 px-0.5 align-top" : "py-1.5 px-2 align-top"}`}
                          >
                            {itemTotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals Section — always show all rows */}
            <div className="flex justify-end mb-4">
              <div
                className={`${cfg.isPosNarrow ? "w-full space-y-0.5" : "w-full md:w-72 space-y-0.5"}`}
              >
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-semibold">
                    {totals.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span className="font-semibold">
                    {totals.discount.toFixed(2)}
                  </span>
                </div>
                {totals.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span className="font-semibold">
                      {totals.tax.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-b border-black/80 py-0.5 font-bold">
                  <span>Net Amount:</span>
                  <span>{totals.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid:</span>
                  <span className="font-bold">{totals.paid.toFixed(2)}</span>
                </div>
                {(transaction as any)?.payments?.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm text-gray-600 pl-2">
                    <span>- {p.type === 'CUSTOMER_ACCOUNT' ? 'Company Balance' : (p.type === 'SALE_PAYMENT' ? 'Cash' : (p.type || 'Cash'))}:</span>
                    <span>{Number(p.amount).toFixed(2)}</span>
                  </div>
                ))}
                <div
                  className={`flex justify-between ${totals.due > 0 ? "font-bold text-red-600" : ""}`}
                >
                  <span>Current Due:</span>
                  <span>{totals.due.toFixed(2)}</span>
                </div>
                {/* Cash and Cash Return hidden until POS input features are implemented */}
              </div>
            </div>

            {/* Footer */}
            {cfg.isPosNarrow ? (
              <div className="mt-4 pt-2 border-t border-gray-300">
                <div className="text-center text-gray-500 italic mb-1.5" style={{ fontSize: `${cfg.smallFontSizePt * 1.33}px` }}>
                  This is a system-generated invoice
                </div>
                <div className="text-center text-gray-400" style={{ fontSize: `${cfg.smallFontSizePt * 1.33}px` }}>
                  Powered by HamoodTech
                </div>
              </div>
            ) : (
              <div className="mt-6 pt-3 border-t border-gray-300 flex justify-between items-center">
                <div className="text-gray-500 italic" style={{ fontSize: `${cfg.smallFontSizePt * 1.33}px` }}>
                  This is a system-generated invoice
                </div>
                <div className="text-gray-400" style={{ fontSize: `${cfg.smallFontSizePt * 1.33}px` }}>
                  Powered by HamoodTech
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
