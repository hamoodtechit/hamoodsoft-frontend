"use client"

import {
  reportsApi,
  type ReportsSalesParams,
  type ReportsPurchasesParams,
  type ProductSalesParams,
  type ProductSalesOptionsParams,
} from "@/lib/api/reports"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"

export function useProductSalesReport(
  businessId: string | undefined,
  params: ProductSalesParams | null
) {
  return useQuery({
    queryKey: ["reports", "product-sales", businessId, params],
    queryFn: () => reportsApi.getProductSalesReport(params!),
    enabled: !!businessId && !!params?.branchId,
    staleTime: 0,
  })
}

export function useProductSalesOptions(
  businessId: string | undefined,
  params: ProductSalesOptionsParams,
  enabled: boolean
) {
  return useInfiniteQuery({
    queryKey: [
      "reports", "product-sales-options", businessId,
      params.branchId, params.itemType, params.search,
    ],
    queryFn: ({ pageParam }) => reportsApi.getProductSalesOptions({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.limit < lastPage.total ? lastPage.page + 1 : undefined,
    enabled: !!businessId && !!params.branchId && enabled,
    staleTime: 0,
  })
}

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

export function useOverallReport(params: { branchId: string; startDate?: string; endDate?: string }) {
  const queryKey = [
    "reports",
    "overall",
    params.branchId,
    params.startDate ?? null,
    params.endDate ?? null,
  ] as const

  return useQuery({
    queryKey,
    queryFn: () => reportsApi.getOverallReport(params),
    refetchOnWindowFocus: true,
    staleTime: 0,
    enabled: !!params.branchId,
  })
}
