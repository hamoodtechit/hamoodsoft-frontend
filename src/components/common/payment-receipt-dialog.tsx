"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Printer } from "lucide-react"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { formatCurrency } from "@/lib/utils/currency"
import { useState } from "react"
import { InvoiceFormat, FORMAT_CONFIG, settingToFormat } from "@/components/common/invoice-dialog"

export interface PaymentReceiptData {
  contactName: string
  totalPaid: number
  remainingDeposit: number
  allocations: Array<{ saleId: string; invoiceNumber: string; appliedAmount: number }>
  date: string
}

interface PaymentReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: PaymentReceiptData | null
}

export function PaymentReceiptDialog({
  open,
  onOpenChange,
  data,
}: PaymentReceiptDialogProps) {
  const { generalSettings, invoiceSettings } = useAppSettings()

  const defaultFormat = settingToFormat(invoiceSettings?.layout)
  const [selectedFormat, setSelectedFormat] = useState<InvoiceFormat>(defaultFormat)

  const buildPrintHTML = () => {
    if (!data) return ""

    const f = FORMAT_CONFIG[selectedFormat]

    const logoHtml = generalSettings?.logoUrl
      ? `<img src="${generalSettings.logoUrl}" alt="Logo" style="max-height:${f.logoMaxHeightMm}mm; max-width:${f.logoMaxWidthMm}mm; object-fit:contain;" />`
      : ""

    // Header
    const headerHtml = `
      <div style="text-align:center;margin-bottom:2mm;padding-bottom:2mm;border-bottom:0.3mm solid #000;">
        ${logoHtml ? `<div style="display:flex;justify-content:center;margin-bottom:1mm;">${logoHtml}</div>` : ""}
        <div style="font-weight:bold;text-transform:uppercase;line-height:1.2;font-size:${f.titleFontSizePt}pt;">
          ${generalSettings?.companyName || "Company Name"}
        </div>
        ${generalSettings?.businessAddress ? `<div style="font-size:${f.smallFontSizePt}pt;color:#333;margin-top:0.5mm;line-height:1.2;">${generalSettings.businessAddress}</div>` : ""}
        <div style="font-weight:bold;margin-top:1mm;font-size:${f.fontSizePt}pt;">PAYMENT RECEIPT</div>
      </div>
    `

    // Info
    const infoHtml = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2mm;font-size:${f.smallFontSizePt}pt;">
        <div style="display:flex;align-items:center;gap:1.5mm;">
          <span style="color:#555;">Name:</span>
          <span style="font-weight:bold;font-size:${f.fontSizePt}pt;">${data.contactName}</span>
        </div>
        <div style="display:flex;align-items:center;gap:1.5mm;text-align:right;">
          <span style="color:#555;">Date:</span>
          <span style="font-weight:bold;">${new Date(data.date).toLocaleDateString()}</span>
        </div>
      </div>
    `

    const rowStyle = `display:flex;justify-content:space-between;padding:0.5mm 0;`

    // Allocations
    let allocationsHtml = ""
    if (data.allocations.length > 0) {
      const items = data.allocations.map(a => `
        <div style="${rowStyle}font-size:${f.smallFontSizePt}pt;">
          <span>${a.invoiceNumber}</span>
          <span>${Number(a.appliedAmount).toFixed(2)}</span>
        </div>
      `).join('')

      allocationsHtml = `
        <div style="margin-bottom:2mm;">
          <div style="font-weight:bold;font-size:${f.smallFontSizePt}pt;border-bottom:0.3mm solid #ccc;margin-bottom:1mm;padding-bottom:1mm;">Payment Invoices</div>
          ${items}
        </div>
      `
    }

    // Totals
    const totalsHtml = `
      <div style="margin-top:2mm;border-top:0.5mm solid #000;padding-top:1mm;">
        <div style="${rowStyle}font-weight:bold;font-size:${f.fontSizePt}pt;">
          <span>Total Received:</span>
          <span>${Number(data.totalPaid).toFixed(2)}</span>
        </div>
      </div>
    `

    const footerHtml = `
      <div style="margin-top:4mm;padding-top:2mm;border-top:0.3mm dashed #ccc;text-align:center;font-size:${f.smallFontSizePt}pt;color:#555;font-style:italic;">
        Thank you for your payment
      </div>
      <div style="margin-top:1mm;text-align:center;font-size:${f.smallFontSizePt}pt;color:#888;">
        Powered by HamoodTech
      </div>
    `

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Payment Receipt</title>
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
    img {
      display: block;
    }
  </style>
</head>
<body>
  ${headerHtml}
  ${infoHtml}
  ${allocationsHtml}
  ${totalsHtml}
  ${footerHtml}
</body>
</html>`
  }

  const handlePrint = () => {
    const html = buildPrintHTML()
    if (!html) return

    const iframe = document.createElement("iframe")
    iframe.style.position = "absolute"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "none"
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (doc) {
      doc.open()
      doc.write(html)
      doc.close()
      setTimeout(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)
      }, 300)
    }
  }

  if (!data) return null

  const f = FORMAT_CONFIG[selectedFormat]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <span>Payment Receipt</span>
            <div className="flex items-center gap-2">
              <Select
                value={selectedFormat}
                onValueChange={(v) => setSelectedFormat(v as InvoiceFormat)}
              >
                <SelectTrigger className="w-[120px] h-8 text-xs font-normal">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(FORMAT_CONFIG) as [InvoiceFormat, any][]).map(
                    ([key, config]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {config.label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Screen Preview */}
        <div className="flex justify-center bg-gray-100 p-4 rounded-md overflow-x-auto min-h-[300px]">
          <div
            className="bg-white text-black shadow-sm mx-auto"
            style={{
              width: `${f.previewWidthPx}px`,
              padding: `${f.isPosNarrow ? '16px' : '32px'}`,
              fontFamily: "Arial, sans-serif",
            }}
          >
            {generalSettings?.logoUrl && (
              <div className="flex justify-center mb-2">
                <img 
                  src={generalSettings.logoUrl} 
                  alt="Logo" 
                  style={{ maxHeight: `${f.logoMaxHeightMm * 4}px`, maxWidth: `${f.logoMaxWidthMm * 4}px`, objectFit: 'contain' }} 
                />
              </div>
            )}
            <div className="text-center border-b border-black pb-2 mb-4">
              <h2 className="font-bold uppercase tracking-wider" style={{ fontSize: `${f.titleFontSizePt * 1.3}px` }}>
                {generalSettings?.companyName || "HAMOOD TECH"}
              </h2>
              {generalSettings?.businessAddress && (
                <div className="text-gray-700 mt-1" style={{ fontSize: `${f.smallFontSizePt * 1.3}px` }}>
                  {generalSettings.businessAddress}
                </div>
              )}
              <div className="font-bold mt-2" style={{ fontSize: `${f.fontSizePt * 1.3}px` }}>PAYMENT RECEIPT</div>
            </div>

            <div className="flex justify-between items-center mb-4" style={{ fontSize: `${f.smallFontSizePt * 1.3}px` }}>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500">Name:</span>
                <span className="font-bold" style={{ fontSize: `${f.fontSizePt * 1.3}px` }}>{data.contactName}</span>
              </div>
              <div className="flex items-center gap-1.5 text-right">
                <span className="text-gray-500">Date:</span>
                <span className="font-bold">{new Date(data.date).toLocaleDateString()}</span>
              </div>
            </div>

            {data.allocations.length > 0 && (
              <div className="mb-4">
                <div className="font-bold border-b border-gray-300 pb-1 mb-2" style={{ fontSize: `${f.smallFontSizePt * 1.3}px` }}>
                  Payment Invoices
                </div>
                {data.allocations.map((alloc, idx) => (
                  <div key={idx} className="flex justify-between py-0.5" style={{ fontSize: `${f.smallFontSizePt * 1.3}px` }}>
                    <span>{alloc.invoiceNumber}</span>
                    <span>{formatCurrency(alloc.appliedAmount, { generalSettings })}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-black pt-2 mt-4">
              <div className="flex justify-between font-bold" style={{ fontSize: `${f.fontSizePt * 1.3}px` }}>
                <span>Total Received:</span>
                <span>{formatCurrency(data.totalPaid, { generalSettings })}</span>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-dashed border-gray-300 text-center">
              <div className="text-gray-500 italic mb-1" style={{ fontSize: `${f.smallFontSizePt * 1.3}px` }}>
                Thank you for your payment
              </div>
              <div className="text-gray-400" style={{ fontSize: `${f.smallFontSizePt * 1.3}px` }}>
                Powered by HamoodTech
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
