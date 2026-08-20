"use client"

import { reportsApi, type ReportsSalesParams, type ReportsPurchasesParams } from "@/lib/api/reports"
import { useQuery } from "@tanstack/react-query"

export function useSalesReports(params: ReportsSalesParams) {
  const queryKey = [
    "reports",
    "sales",
    params.branchId,
    params.startDate ?? null,
    params.endDate ?? null,
  ] as const

  return useQuery({
    queryKey,
    queryFn: () => reportsApi.getSalesReport(params),
    refetchOnWindowFocus: true,
    staleTime: 0,
    enabled: !!params.branchId,
  })
}

export function usePurchasesReports(params: ReportsPurchasesParams) {
  const queryKey = [
    "reports",
    "purchases",
    params.branchId,
    params.startDate ?? null,
    params.endDate ?? null,
  ] as const

  return useQuery({
    queryKey,
    queryFn: () => reportsApi.getPurchaseReport(params),
    refetchOnWindowFocus: true,
    staleTime: 0,
    enabled: !!params.branchId,
  })
}
