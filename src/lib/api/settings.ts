import { UpdateSettingInput } from "@/lib/validations/settings"
import { ApiResponse, PaginatedResult, Setting } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

type SettingsResponseShape = {
  items: Setting[]
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
    [key: string]: any
  }
}

function normalizeSettingsList(
  data: PaginatedResult<Setting> | SettingsResponseShape | Setting[]
): PaginatedResult<Setting> {
  // If backend already returns { items, meta }
  if (!Array.isArray(data) && "items" in data) {
    const meta = data.meta || {}
    const items = data.items || []
    return {
      items,
      meta: {
        page: meta.page ?? 1,
        limit: meta.limit ?? (items.length || 20),
        total: meta.total ?? items.length ?? 0,
        totalPages: meta.totalPages ?? undefined,
      },
    }
  }

  // If backend returns full PaginatedResult with meta nested
  if (!Array.isArray(data) && "meta" in data && "items" in data) {
    const paginatedData = data as PaginatedResult<Setting>
    return {
      items: paginatedData.items,
      meta: paginatedData.meta,
    }
  }

  // Fallback: plain array
  const items = Array.isArray(data) ? data : []
  return {
    items,
    meta: {
      page: 1,
      limit: items.length || 20,
      total: items.length,
      totalPages: 1,
    },
  }
}

export const settingsApi = {
  getSettings: async (): Promise<PaginatedResult<Setting>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResult<Setting> | SettingsResponseShape | Setting[]>>(
      endpoints.settings.list
    )
    return normalizeSettingsList(response.data.data)
  },

  updateSetting: async (id: string, data: UpdateSettingInput): Promise<Setting> => {
    const response = await apiClient.patch<ApiResponse<Setting>>(endpoints.settings.update(id), data)
    return response.data.data
  },
}
