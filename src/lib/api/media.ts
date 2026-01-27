import { UpdateMediaInput, UploadMediaInput } from "@/lib/validations/media"
import { ApiResponse, Media, PaginatedResult } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export interface MediaListParams {
  page?: number
  limit?: number
  search?: string
  type?: "image" | "document"
}

export interface MediaResponseShape {
  items: Media[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages?: number
  }
}

function normalizeMediaList(
  data: PaginatedResult<Media> | MediaResponseShape | Media[]
): PaginatedResult<Media> {
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
    },
  }
}

export const mediaApi = {
  upload: async (data: UploadMediaInput): Promise<Media> => {
    const formData = new FormData()
    formData.append("file", data.file)
    if (data.name) {
      formData.append("name", data.name)
    }

    const response = await apiClient.post<ApiResponse<Media>>(
      endpoints.media.upload,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    )
    return response.data.data
  },

  list: async (params?: MediaListParams): Promise<PaginatedResult<Media>> => {
    const cleanParams: Record<string, any> = {}
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value
        }
      })
    }

    const response = await apiClient.get<
      ApiResponse<PaginatedResult<Media> | MediaResponseShape | Media[]>
    >(endpoints.media.list, {
      params: Object.keys(cleanParams).length > 0 ? cleanParams : undefined,
    })
    return normalizeMediaList(response.data.data)
  },

  update: async (
    id: string,
    data: UpdateMediaInput
  ): Promise<Media> => {
    const formData = new FormData()
    if (data.file) {
      formData.append("file", data.file)
    }
    if (data.name !== undefined) {
      formData.append("name", data.name)
    }

    const response = await apiClient.patch<ApiResponse<Media>>(
      endpoints.media.update(id),
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    )
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(endpoints.media.delete(id))
  },
}
