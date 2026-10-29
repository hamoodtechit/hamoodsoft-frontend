"use client"

import { useLocale, useTranslations } from "next-intl"
import { ProductSalesResponse } from "@/lib/api/reports"
import { ReportSummary } from "@/components/reports/ReportSummary"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { formatCurrency } from "@/lib/utils/currency"
import { formatDateTime } from "@/lib/utils/date"

export function ProductSalesResults({
  report,
  print = false
}: {
  report: ProductSalesResponse
  print?: boolean
}) {
  const t = useTranslations("productSalesReport")
  const locale = useLocale()
  const { generalSettings } = useAppSettings()
  const money = (amount: number) => formatCurrency(amount, { generalSettings })
  const number = (quantity: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }).format(quantity)
  const quantities = (
    key: "soldQuantity" | "returnedQuantity" | "netQuantity"
  ) =>
    report.summary.quantities.length
      ? report.summary.quantities
          .map((entry) => `${number(entry[key])} ${entry.unit}`)
          .join(" / ")
      : "0"
  const summary = [
    { label: t("soldQuantity"), value: quantities("soldQuantity") },
    { label: t("salesAmount"), value: money(report.summary.salesAmount) },
    { label: t("returnedQuantity"), value: quantities("returnedQuantity") },
    { label: t("refundAmount"), value: money(report.summary.refundAmount) },
    { label: t("netQuantity"), value: quantities("netQuantity") },
    { label: t("netAmount"), value: money(report.summary.netAmount) }
  ]
  return (
    <div className="space-y-4">
      <div className="text-sm">
        <p className="font-semibold">
          {t("productName")}: {report.filters.itemName}
        </p>
        {report.filters.variantName && (
          <p>{t("variant")}: {report.filters.variantName}</p>
        )}
        {!print && (
          <>
            <p>
              {report.filters.startDate} — {report.filters.endDate} (
              {report.filters.timeZone})
            </p>
            <p className="mt-1 text-muted-foreground">{t("amountNote")}</p>
            <p className="text-muted-foreground">{t("returnsNote")}</p>
          </>
        )}
      </div>
      {!print && <ReportSummary items={summary} />}
      <p className="text-sm">
        {t("invoiceCount", { count: report.summary.saleCount })}
      </p>
      <div className="overflow-x-auto print:overflow-visible">
        <table className="product-sales-table w-full border-collapse text-left text-sm print:text-[10px]">
          <caption className="sr-only">{t("title")}</caption>
          <thead className="bg-muted print:bg-gray-100">
            <tr>
              {[
                "date",
                "type",
                "invoice",
                "customer",
                "item",
                "quantity",
                "unitPrice",
                "amount"
              ].map((key, index) => (
                <th
                  key={key}
                  scope="col"
                  className={`border p-2 ${index >= 5 ? "text-right" : ""}`}
                >
                  {t(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="border p-6 text-center">
                  {t("noResults")}
                </td>
              </tr>
            ) : (
              report.rows.map((row) => (
                <tr key={`${row.kind}-${row.id}`}>
                  <td className="border p-2">
                    {formatDateTime(row.date, {
                      timeZone: report.filters.timeZone,
                      locale
                    })}
                  </td>
                  <td className="border p-2">
                    {t(row.kind === "SALE" ? "sale" : "return")}
                  </td>
                  <td className="border p-2">{row.invoiceNumber || "—"}</td>
                  <td className="border p-2 break-words">{row.customer}</td>
                  <td className="border p-2 break-words">
                    {row.itemName}
                    {row.variantName && (
                      <span className="block text-xs">{row.variantName}</span>
                    )}
                  </td>
                  <td className="border p-2 text-right">
                    {row.kind === "RETURN" ? "−" : ""}
                    {number(row.quantity)} {row.unit}
                  </td>
                  <td className="border p-2 text-right">
                    {money(row.unitPrice)}
                  </td>
                  <td className="border p-2 text-right">
                    {row.kind === "RETURN" ? "−" : ""}
                    {money(row.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {print ? (
        <section className="product-sales-print-summary ml-auto w-full max-w-sm break-inside-avoid border-2 border-slate-800">
          <h3 className="border-b-2 border-slate-800 bg-slate-100 p-2 text-center text-sm font-bold uppercase">
            {t("summary")}
          </h3>
          <dl className="space-y-2 p-3 text-sm">
            {summary.map((item, index) => (
              <div
                key={item.label}
                className={`grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 ${index >= 4 ? "border-t border-slate-300 pt-2 font-bold" : "font-medium"}`}
              >
                <dt>{item.label}</dt>
                <dd className="text-right">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : (
        <div className="border-t pt-2 text-right text-sm font-bold">
          {t("netAmount")}: {money(report.summary.netAmount)}
        </div>
      )}
    </div>
  )
}
