import api from "./client"
import { Sale, Payment } from "@/types"

export interface SaleReturn {
  id: string
  totalAmount: number
  refundAmount: number
  createdAt: string
  contact?: { name: string }
  sale?: { invoiceNumber: string }
}

export interface ReportsSalesParams {
  branchId: string
  startDate?: string
  endDate?: string
}

export interface ReportsSalesResponse {
  sales: Sale[]
  returns: SaleReturn[]
  collections: (Payment & {
    account?: { name: string }
    sale?: { invoiceNumber: string; createdAt: string }
    contact?: { name: string }
  })[]
}

export interface ReportsPurchasesParams {
  branchId: string
  startDate?: string
  endDate?: string
}

export interface PurchaseReturn {
  id: string
  totalPrice: number
  createdAt: string
  contact?: { name: string }
  purchaseItems?: { purchase?: { poNumber: string } }[]
}

export interface ReportsPurchasesResponse {
  purchases: any[] // Using any here to avoid importing Purchase if it doesn't exist, will be mapped on UI
  returns: PurchaseReturn[]
  payments: (Payment & {
    account?: { name: string }
    purchase?: { poNumber: string; createdAt: string }
    contact?: { name: string }
  })[]
}

import { ApiResponse } from "@/types"

export const reportsApi = {
  getSalesReport: async (params: ReportsSalesParams): Promise<ReportsSalesResponse> => {
    const response = await api.get<ApiResponse<ReportsSalesResponse>>("/reports/sales", { params })
    return response.data.data
  },
  getPurchaseReport: async (params: ReportsPurchasesParams): Promise<ReportsPurchasesResponse> => {
    const response = await api.get<ApiResponse<ReportsPurchasesResponse>>("/reports/purchases", { params })
    return response.data.data
  },
}
