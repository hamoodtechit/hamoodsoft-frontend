import { CreateAccountInput, UpdateAccountInput } from "@/lib/validations/accounts"
import { Account, AccountLedgerResponse, ApiResponse, PaginatedResult } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export type AccountsListParams = {
  page?: number
  limit?: number
  search?: string
  type?: "CASH" | "BANK" | "WALLET" | "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE"
  isActive?: boolean
}

export type AccountLedgerParams = {
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
}

type AccountsResponseShape = {
  items: Account[]
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
    [key: string]: any
  }
}

function normalizeAccountsList(data: PaginatedResult<Account> | AccountsResponseShape | Account[]): PaginatedResult<Account> {
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

export const accountsApi = {
  createAccount: async (data: CreateAccountInput): Promise<Account> => {
    const response = await apiClient.post<ApiResponse<Account>>(endpoints.accounts.create, data)
    return response.data.data
  },

  getAccounts: async (params?: AccountsListParams): Promise<PaginatedResult<Account>> => {
    const cleanParams: Record<string, any> = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof AccountsListParams]
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value
        }
      })
    }

    const response = await apiClient.get<ApiResponse<PaginatedResult<Account> | AccountsResponseShape | Account[]>>(
      endpoints.accounts.list,
      { params: cleanParams }
    )
    return normalizeAccountsList(response.data.data)
  },

  getAccountById: async (id: string): Promise<Account> => {
    const response = await apiClient.get<ApiResponse<Account>>(endpoints.accounts.getById(id))
    console.log("=".repeat(80))
    console.log("💳 GET ACCOUNT BY ID API RESPONSE")
    console.log("=".repeat(80))
    console.log("Account ID:", id)
    console.log("Full Response:", JSON.stringify(response.data, null, 2))
    console.log("Account Data:", JSON.stringify(response.data.data, null, 2))
    console.log("=".repeat(80))
    return response.data.data
  },

  updateAccount: async (id: string, data: UpdateAccountInput): Promise<Account> => {
    const response = await apiClient.patch<ApiResponse<Account>>(endpoints.accounts.update(id), data)
    return response.data.data
  },

  getAccountLedger: async (id: string, params?: AccountLedgerParams): Promise<AccountLedgerResponse> => {
    const cleanParams: Record<string, any> = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof AccountLedgerParams]
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value
        }
      })
    }

    const response = await apiClient.get<ApiResponse<AccountLedgerResponse>>(
      endpoints.accounts.ledger(id),
      { params: cleanParams }
    )
    console.log("=".repeat(80))
    console.log("📊 GET ACCOUNT LEDGER API RESPONSE")
    console.log("=".repeat(80))
    console.log("Account ID:", id)
    console.log("Params:", JSON.stringify(cleanParams, null, 2))
    console.log("Full Response:", JSON.stringify(response.data, null, 2))
    console.log("Ledger Data:", JSON.stringify(response.data.data, null, 2))
    console.log("Opening Balance:", response.data.data.openingBalance)
    console.log("Closing Balance:", response.data.data.closingBalance)
    console.log("Total Debit:", response.data.data.totals.debit)
    console.log("Total Credit:", response.data.data.totals.credit)
    console.log("Entries Count:", response.data.data.items.length)
    console.log("=".repeat(80))
    return response.data.data
  },
}
