import { CreateContactInput, UpdateContactInput } from "@/lib/validations/contacts"
import { ApiResponse, Contact, PaginatedResult } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export type ContactsListParams = {
  page?: number
  limit?: number
  search?: string
  type?: "CUSTOMER" | "SUPPLIER"
  isIndividual?: boolean
}

type ContactsResponseShape = {
  items: Contact[]
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
    [key: string]: unknown
  }
}

function normalizeContactsList(data: PaginatedResult<Contact> | ContactsResponseShape | Contact[] | null | undefined): PaginatedResult<Contact> {
  if (!data) {
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

  // If backend already returns { items, meta }
  if (!Array.isArray(data) && typeof data === "object" && "items" in data) {
    const items = Array.isArray(data.items) ? data.items : []
    const meta = data.meta || {}
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

  // Fallback: plain array
  const items = Array.isArray(data) ? data : []
  return {
    items,
    meta: {
      page: 1,
      limit: items.length || 10,
      total: items.length,
      totalPages: 1,
    },
  }
}

export const contactsApi = {
  createContact: async (data: CreateContactInput): Promise<Contact> => {
    const response = await apiClient.post<ApiResponse<Contact>>(endpoints.contacts.create, data)
    return response.data.data
  },

  getContacts: async (params?: ContactsListParams): Promise<PaginatedResult<Contact>> => {
    // Clean params - remove undefined/null/empty values
    const cleanParams: Record<string, string | number | boolean> = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof ContactsListParams]
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value
        }
      })
    }
    
    const response = await apiClient.get<ApiResponse<PaginatedResult<Contact> | ContactsResponseShape | Contact[]>>(
      endpoints.contacts.list,
      { params: cleanParams }
    )
    return normalizeContactsList(response.data.data)
  },

  getContactById: async (id: string): Promise<Contact> => {
    const response = await apiClient.get<ApiResponse<Contact>>(endpoints.contacts.getById(id))
    return response.data.data
  },

  updateContact: async (id: string, data: UpdateContactInput): Promise<Contact> => {
    const response = await apiClient.patch<ApiResponse<Contact>>(endpoints.contacts.update(id), data)
    return response.data.data
  },

  deleteContact: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(endpoints.contacts.delete(id))
  },
}
