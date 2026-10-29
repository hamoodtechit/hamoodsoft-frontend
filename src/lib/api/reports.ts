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

export interface ProductSalesParams {
  branchId: string
  itemType: "FUEL" | "PRODUCT"
  itemId: string
  variantId?: string
  startDate: string
  endDate: string
  page?: number
  limit?: number
  all?: "true" | "false"
}

export interface ProductSalesOption {
  id: string
  name: string
  variants: { id: string; name: string }[]
}

export interface ProductSalesOptionsParams {
  branchId: string
  itemType: "FUEL" | "PRODUCT"
  search?: string
  page?: number
}

export interface ProductSalesResponse {
  filters: {
    branch: { id: string; name: string }
    itemName: string
    variantName: string | null
    startDate: string
    endDate: string
    timeZone: string
  }
  summary: {
    salesAmount: number
    refundAmount: number
    netAmount: number
    saleCount: number
    quantities: { unit: string; soldQuantity: number; returnedQuantity: number; netQuantity: number }[]
  }
  rows: {
    id: string
    kind: "SALE" | "RETURN"
    date: string
    invoiceNumber: string | null
    customer: string
    itemName: string
    variantName: string | null
    unit: string
    quantity: number
    unitPrice: number
    amount: number
  }[]
  total: number
  page: number
  limit: number
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
  getProductSalesReport: async (params: ProductSalesParams): Promise<ProductSalesResponse> => {
    const response = await api.get<ApiResponse<ProductSalesResponse>>("/reports/product-sales", { params })
    return response.data.data
  },
  getProductSalesOptions: async (params: ProductSalesOptionsParams) => {
    const response = await api.get<ApiResponse<{ items: ProductSalesOption[]; total: number; page: number; limit: number }>>("/reports/product-sales/options", { params })
    return response.data.data
  },
  getSalesReport: async (params: ReportsSalesParams): Promise<ReportsSalesResponse> => {
    const response = await api.get<ApiResponse<ReportsSalesResponse>>("/reports/sales", { params })
    return response.data.data
  },
  getPurchaseReport: async (params: ReportsPurchasesParams): Promise<ReportsPurchasesResponse> => {
    const response = await api.get<ApiResponse<ReportsPurchasesResponse>>("/reports/purchases", { params })
    return response.data.data
  },
  getOverallReport: async (params: { branchId: string; startDate?: string; endDate?: string }) => {
    const response = await api.get<ApiResponse<any>>("/reports/overall", { params })
    return response.data.data as {
      totalSales: number;
      totalSaleReturns: number;
      totalPurchases: number;
      totalPurchaseReturns: number;
      totalIncome: number;
      totalExpense: number;
      netProfit: number;
    }
  },
}
