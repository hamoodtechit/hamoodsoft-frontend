"use client"

import { FormEvent, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { BackButton } from "@/components/common/back-button"
import { PrintHeader } from "@/components/common/PrintHeader"
import { ReportActionButtons } from "@/components/common/ReportActionButtons"
import { ProductSalesItemSelect } from "@/components/reports/ProductSalesItemSelect"
import { ProductSalesResults } from "@/components/reports/ProductSalesResults"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  reportsApi,
  ProductSalesOption,
  ProductSalesParams,
  ProductSalesResponse
} from "@/lib/api/reports"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { useProductSalesReport } from "@/lib/hooks/use-reports"
import { useAppSettings } from "@/lib/providers/settings-provider"

function currentMonth(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit"
  }).formatToParts(new Date())
  const year = parts.find((part) => part.type === "year")!.value
  const month = parts.find((part) => part.type === "month")!.value
  const last = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate()
  return { from: `${year}-${month}-01`, to: `${year}-${month}-${last}` }
}

export default function ProductSalesReportPage() {
  const { businessId, selectedBranchId } = useBranchSelection()
  const { generalSettings } = useAppSettings()
  const timeZone = generalSettings?.timeZone || "Asia/Dhaka"
  // A context change removes the old business/branch's selected item and report immediately.
  return (
    <ProductSalesReport
      key={`${businessId}:${selectedBranchId}:${timeZone}`}
      businessId={businessId}
      branchId={selectedBranchId || ""}
      timeZone={timeZone}
    />
  )
}

function ProductSalesReport({
  businessId,
  branchId,
  timeZone
}: {
  businessId?: string
  branchId: string
  timeZone: string
}) {
  const t = useTranslations("productSalesReport")
  const [itemType, setItemType] =
    useState<ProductSalesParams["itemType"]>("FUEL")
  const [item, setItem] = useState<ProductSalesOption | null>(null)
  const [variantId, setVariantId] = useState("all")
  const [dates, setDates] = useState(() => currentMonth(timeZone))
  const [applied, setApplied] = useState<ProductSalesParams | null>(null)
  const [validation, setValidation] = useState("")
  const [printData, setPrintData] = useState<ProductSalesResponse | null>(null)
  const [printing, setPrinting] = useState(false)
  const [printError, setPrintError] = useState(false)
  const report = useProductSalesReport(businessId, applied)

  useEffect(() => {
    if (!printData || !printing) return
    let cancelled = false
    const prepare = async () => {
      try {
        await document.fonts.ready
        await Promise.all(
          Array.from(
            document.querySelectorAll<HTMLImageElement>(
              ".product-sales-print img"
            )
          ).map((image) => image.decode().catch(() => undefined))
        )
        // Allow React's complete print table to reach browser layout before opening the dialog.
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
        if (!cancelled) window.print()
      } catch {
        if (!cancelled) {
          setPrintError(true)
          setPrintData(null)
        }
      } finally {
        if (!cancelled) setPrinting(false)
      }
    }
    void prepare()
    return () => {
      cancelled = true
    }
  }, [printData, printing])

  const generate = (event: FormEvent) => {
    event.preventDefault()
    if (
      !branchId ||
      !item ||
      !dates.from ||
      !dates.to ||
      dates.from > dates.to
    ) {
      setValidation(t("validation"))
      return
    }
    setValidation("")
    setPrintData(null)
    setPrintError(false)
    const next: ProductSalesParams = {
      branchId,
      itemType,
      itemId: item.id,
      variantId: variantId === "all" ? undefined : variantId,
      startDate: dates.from,
      endDate: dates.to,
      page: 1,
      limit: 25
    }
    if (JSON.stringify(next) === JSON.stringify(applied)) void report.refetch()
    else setApplied(next)
  }

  const print = async () => {
    if (!applied || !report.data || report.isFetching) return
    setPrinting(true)
    setPrintError(false)
    // Clear any previous snapshot before starting another full report request.
    setPrintData(null)
    try {
      setPrintData(
        await reportsApi.getProductSalesReport({
          ...applied,
          page: 1,
          all: "true"
        })
      )
    } catch {
      setPrintError(true)
      setPrinting(false)
    }
  }

  const pageCount = report.data
    ? Math.max(1, Math.ceil(report.data.total / report.data.limit))
    : 1
  return (
    <div className="space-y-6">
      <div className="product-sales-screen space-y-6">
        <BackButton href="/dashboard#reports-section" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="mt-1 text-muted-foreground">{t("description")}</p>
          </div>
          <ReportActionButtons
            onPrint={() => void print()}
            disabled={!report.data || report.isFetching || printing}
            label={t(printing ? "preparingPrint" : "print")}
          />
        </div>
        <Card>
          <CardContent className="p-4">
            <form
              onSubmit={generate}
              className="flex flex-wrap items-end gap-4"
            >
              <div className="w-full space-y-1.5 sm:w-32">
                <Label htmlFor="report-type">{t("type")}</Label>
                <Select
                  value={itemType}
                  onValueChange={(value: ProductSalesParams["itemType"]) => {
                    setItemType(value)
                    setItem(null)
                    setVariantId("all")
                  }}
                >
                  <SelectTrigger id="report-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FUEL">{t("fuel")}</SelectItem>
                    <SelectItem value="PRODUCT">{t("product")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full min-w-0 space-y-1.5 sm:min-w-[200px] sm:flex-1">
                <Label htmlFor="report-item">
                  {t(itemType === "FUEL" ? "fuel" : "product")}
                </Label>
                <ProductSalesItemSelect
                  key={itemType}
                  businessId={businessId}
                  branchId={branchId}
                  itemType={itemType}
                  value={item}
                  onChange={(value) => {
                    setItem(value)
                    setVariantId("all")
                  }}
                />
              </div>
              {itemType === "PRODUCT" && !!item?.variants.length && (
                <div className="w-full space-y-1.5 sm:w-40">
                  <Label htmlFor="report-variant">{t("variant")}</Label>
                  <Select value={variantId} onValueChange={setVariantId}>
                    <SelectTrigger id="report-variant">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allVariants")}</SelectItem>
                      {item.variants.map((variant) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          {variant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="w-full space-y-1.5 sm:w-40">
                <Label htmlFor="report-from">{t("fromDate")}</Label>
                <Input
                  id="report-from"
                  type="date"
                  required
                  value={dates.from}
                  max={dates.to || undefined}
                  onChange={(e) =>
                    setDates((previous) => ({
                      ...previous,
                      from: e.target.value
                    }))
                  }
                />
              </div>
              <div className="w-full space-y-1.5 sm:w-40">
                <Label htmlFor="report-to">{t("toDate")}</Label>
                <Input
                  id="report-to"
                  type="date"
                  required
                  value={dates.to}
                  min={dates.from || undefined}
                  onChange={(e) =>
                    setDates((previous) => ({
                      ...previous,
                      to: e.target.value
                    }))
                  }
                />
              </div>
              <div className="w-full sm:w-auto">
                <Button
                  type="submit"
                  className="w-full whitespace-nowrap sm:w-auto"
                  disabled={!branchId || !item || report.isFetching || printing}
                >
                  {report.isFetching && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("generate")}
                </Button>
              </div>
              {!branchId && (
                <p
                  role="status"
                  className="w-full text-sm text-muted-foreground"
                >
                  {t("selectBranch")}
                </p>
              )}
              {validation && (
                <p role="alert" className="w-full text-sm text-destructive">
                  {validation}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
        {printError && (
          <p role="alert" className="text-destructive">
            {t("printError")}
          </p>
        )}
        {report.isError ? (
          <div role="alert">
            {t("loadError")}{" "}
            <Button variant="link" onClick={() => report.refetch()}>
              {t("retry")}
            </Button>
          </div>
        ) : report.isFetching ? (
          <p role="status" className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("loading")}
          </p>
        ) : report.data ? (
          <Card>
            <CardContent className="space-y-4 pt-5">
              <ProductSalesResults report={report.data} />
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button
                  variant="outline"
                  disabled={report.data.page <= 1 || printing}
                  onClick={() => {
                    setPrintData(null)
                    setApplied(
                      (previous) =>
                        previous && { ...previous, page: previous.page! - 1 }
                    )
                  }}
                >
                  {t("previous")}
                </Button>
                <span className="text-sm">
                  {t("page", {
                    page: report.data.page,
                    pages: pageCount,
                    total: report.data.total
                  })}
                </span>
                <Button
                  variant="outline"
                  disabled={report.data.page >= pageCount || printing}
                  onClick={() => {
                    setPrintData(null)
                    setApplied(
                      (previous) =>
                        previous && { ...previous, page: previous.page! + 1 }
                    )
                  }}
                >
                  {t("next")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <p className="text-muted-foreground">{t("selectPrompt")}</p>
        )}
      </div>
      <div className="product-sales-print hidden">
        <table className="product-sales-print-frame" role="presentation">
          <thead aria-hidden="true">
            <tr>
              <td>
                <div className="product-sales-page-spacing" />
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                {printData ? (
                  <>
                    <PrintHeader
                      title={t("title")}
                      dateRange={{
                        from: new Date(
                          `${printData.filters.startDate}T12:00:00`
                        ),
                        to: new Date(`${printData.filters.endDate}T12:00:00`)
                      }}
                    />
                    <ProductSalesResults report={printData} print />
                  </>
                ) : (
                  <p>{t("usePrintButton")}</p>
                )}
              </td>
            </tr>
          </tbody>
          <tfoot aria-hidden="true">
            <tr>
              <td>
                <div className="product-sales-page-spacing" />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
          }
          body {
            padding: 0 !important;
          }
          .product-sales-screen {
            display: none !important;
          }
          .product-sales-print {
            display: block !important;
            color: black;
            padding: 0 10mm;
          }
          /* Reserve internal spacing on every page without browser margin footers. */
          .product-sales-print-frame {
            width: 100%;
            border-collapse: collapse;
          }
          .product-sales-print-frame > thead {
            display: table-header-group;
          }
          .product-sales-print-frame > tfoot {
            display: table-footer-group;
          }
          .product-sales-print-frame > tbody > tr {
            break-inside: auto;
          }
          .product-sales-print-frame > thead > tr > td,
          .product-sales-print-frame > tbody > tr > td,
          .product-sales-print-frame > tfoot > tr > td {
            border: 0;
            padding: 0;
          }
          .product-sales-page-spacing {
            height: 10mm;
          }
          .product-sales-table thead {
            display: table-header-group;
          }
          .product-sales-table tr {
            break-inside: avoid;
          }
          .product-sales-table {
            width: 100%;
            table-layout: auto;
          }
        }
      `}</style>
    </div>
  )
}
