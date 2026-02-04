import { CreateIncomeTransactionInput, CreateExpenseTransactionInput } from "@/lib/validations/transactions"
import { ApiResponse, PaginatedResult, Transaction } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export type TransactionsListParams = {
  page?: number
  limit?: number
  search?: string
  type?: "INCOME" | "EXPENSE"
  accountId?: string
  branchId?: string
  contactId?: string
  categoryId?: string
  startDate?: string
  endDate?: string
}

type TransactionsResponseShape = {
  items: Transaction[]
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
    [key: string]: any
  }
}

function normalizeTransaction(transaction: any): Transaction {
  // Normalize type: "IN" -> "INCOME", "EX" -> "EXPENSE"
  let normalizedType: "INCOME" | "EXPENSE" = "INCOME"
  if (transaction.type === "IN") {
    normalizedType = "INCOME"
  } else if (transaction.type === "EX") {
    normalizedType = "EXPENSE"
  } else if (transaction.type === "INCOME") {
    normalizedType = "INCOME"
  } else if (transaction.type === "EXPENSE") {
    normalizedType = "EXPENSE"
  }

  return {
    ...transaction,
    type: normalizedType,
    categoryId: transaction.incomeExpenseCategoryId || transaction.categoryId || null,
    // Preserve all API response fields - incomeExpenseCategory is the object, category is a string
    incomeExpenseCategory: transaction.incomeExpenseCategory || null,
    account: transaction.account || null,
    branch: transaction.branch || null,
    contact: transaction.contact || null,
  } as Transaction
}

function normalizeTransactionsList(data: PaginatedResult<Transaction> | TransactionsResponseShape | Transaction[]): PaginatedResult<Transaction> {
  if (!Array.isArray(data) && "items" in data) {
    const meta = data.meta || {}
    const items = (data.items || []).map(normalizeTransaction)
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
      items: data.map(normalizeTransaction),
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

export const transactionsApi = {
  getTransactions: async (params?: TransactionsListParams): Promise<PaginatedResult<Transaction>> => {
    const cleanParams: Record<string, any> = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof TransactionsListParams]
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value
        }
      })
    }

    const response = await apiClient.get<ApiResponse<PaginatedResult<Transaction> | TransactionsResponseShape | Transaction[]>>(
      endpoints.transactions.list,
      { params: cleanParams }
    )
    return normalizeTransactionsList(response.data.data)
  },

  getTransactionById: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get<ApiResponse<Transaction>>(endpoints.transactions.getById(id))
    // Normalize the transaction type
    return normalizeTransaction(response.data.data)
  },

  createIncomeTransaction: async (data: CreateIncomeTransactionInput): Promise<Transaction> => {
    const response = await apiClient.post<ApiResponse<Transaction>>(endpoints.transactions.createIncome, data)
    return normalizeTransaction(response.data.data)
  },

  createExpenseTransaction: async (data: CreateExpenseTransactionInput): Promise<Transaction> => {
    const response = await apiClient.post<ApiResponse<Transaction>>(endpoints.transactions.createExpense, data)
    return normalizeTransaction(response.data.data)
  },
}
