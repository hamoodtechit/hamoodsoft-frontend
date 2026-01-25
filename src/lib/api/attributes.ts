import { CreateAttributeInput, UpdateAttributeInput } from "@/lib/validations/attributes"
import { ApiResponse, Attribute, PaginatedResult } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export interface AttributesListParams {
  page?: number
  limit?: number
  search?: string
  brandId?: string
}

export interface AttributesResponseShape {
  items: Attribute[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages?: number
  }
}

function normalizeAttributesList(
  data: PaginatedResult<Attribute> | AttributesResponseShape | Attribute[]
): PaginatedResult<Attribute> {
  if (Array.isArray(data)) {
    return {
      items: data,
      meta: {
        page: 1,
        limit: data.length,
        total: data.length,
      },
    }
  }

  const meta = "meta" in data ? data.meta : { page: 1, limit: 10, total: 0 }
  const items = Array.isArray(data) ? data : data.items || []

  return {
    items,
    meta: {
      page: meta.page ?? 1,
      limit: meta.limit ?? (items?.length || 10),
      total: meta.total ?? items?.length ?? 0,
      totalPages: meta.totalPages ?? undefined,
      ...meta,
    },
  }
}

export const attributesApi = {
  create: async (data: CreateAttributeInput): Promise<Attribute> => {
    const response = await apiClient.post<ApiResponse<Attribute>>(
      endpoints.attributes.create,
      data
    )
    return response.data.data
  },

  list: async (params?: AttributesListParams): Promise<PaginatedResult<Attribute>> => {
    const cleanParams: Record<string, any> = {}
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value
        }
      })
    }

    const response = await apiClient.get<ApiResponse<PaginatedResult<Attribute> | AttributesResponseShape | Attribute[]>>(
      endpoints.attributes.list,
      { params: Object.keys(cleanParams).length > 0 ? cleanParams : undefined }
    )
    return normalizeAttributesList(response.data.data)
  },

  getById: async (id: string): Promise<Attribute> => {
    const response = await apiClient.get<ApiResponse<Attribute>>(endpoints.attributes.getById(id))
    return response.data.data
  },

  update: async (id: string, data: UpdateAttributeInput): Promise<Attribute> => {
    const response = await apiClient.patch<ApiResponse<Attribute>>(
      endpoints.attributes.update(id),
      data
    )
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(endpoints.attributes.delete(id))
  },
}

