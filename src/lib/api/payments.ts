import { CreatePaymentInput } from "@/lib/validations/payments"
import { ApiResponse, PaginatedResult, Payment } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export type PaymentsListParams = {
  page?: number
  limit?: number
  search?: string
  type?: "SALE_PAYMENT" | "PURCHASE_PAYMENT" | "DEPOSIT"
  accountId?: string
  saleId?: string
  purchaseId?: string
  contactId?: string
  branchId?: string
  startDate?: string
  endDate?: string
}

type PaymentsResponseShape = {
  items: Payment[]
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
    [key: string]: unknown
  }
}

function normalizePaymentsList(data: PaginatedResult<Payment> | PaymentsResponseShape | Payment[]): PaginatedResult<Payment> {
  if (!Array.isArray(data) && "items" in data) {
    const meta = data.meta || {}
    const items = data.items || []
    return {
      items,
      meta: {
        page: meta.page ?? 1,
        limit: meta.limit ?? (items.length || 10),
        total: meta.total ?? items.length ?? 0,
        totalPages: meta.totalPages ?? undefined,
      },
    }
  }

  if (Array.isArray(data)) {
    return {
      items: data,
      meta: {
        page: 1,
        limit: data.length,
        total: data.length,
        totalPages: 1,
      },
    }
  }

  return {
    items: [],
    meta: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  }
}

export const paymentsApi = {
  createPayment: async (data: CreatePaymentInput): Promise<Payment> => {
    const response = await apiClient.post<ApiResponse<Payment>>(endpoints.payments.create, data)
    return response.data.data
  },

  getPayments: async (params?: PaymentsListParams): Promise<PaginatedResult<Payment>> => {
    const cleanParams: Record<string, string | number | boolean> = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof PaymentsListParams]
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value
        }
      })
    }

    const response = await apiClient.get<ApiResponse<PaginatedResult<Payment> | PaymentsResponseShape | Payment[]>>(
      endpoints.payments.list,
      { params: cleanParams }
    )
    return normalizePaymentsList(response.data.data)
  },

  getPaymentById: async (id: string): Promise<Payment> => {
    const response = await apiClient.get<ApiResponse<Payment>>(endpoints.payments.getById(id))
    return response.data.data
  },

  deletePayment: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(endpoints.payments.delete(id))
  },
}
