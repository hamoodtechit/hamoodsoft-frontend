import { CreateAttributeInput, UpdateAttributeInput } from "@/lib/validations/attributes"
import { ApiResponse, Attribute } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export const attributesApi = {
  create: async (productId: string, data: CreateAttributeInput): Promise<Attribute> => {
    const response = await apiClient.post<ApiResponse<Attribute>>(
      endpoints.attributes.create(productId),
      data
    )
    return response.data.data
  },

  listByProduct: async (productId: string): Promise<Attribute[]> => {
    const response = await apiClient.get<ApiResponse<Attribute[]>>(
      endpoints.attributes.listByProduct(productId)
    )
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

