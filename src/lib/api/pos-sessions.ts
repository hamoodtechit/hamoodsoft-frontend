import { ApiResponse, ClosePOSSessionInput, OpenPOSSessionInput, POSSession } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export const posSessionsApi = {
  openSession: async (data: OpenPOSSessionInput): Promise<POSSession> => {
    const response = await apiClient.post<ApiResponse<POSSession>>(endpoints.pos.sessions.open, data)
    return response.data.data
  },

  closeSession: async (data: ClosePOSSessionInput): Promise<POSSession> => {
    const response = await apiClient.post<ApiResponse<POSSession>>(endpoints.pos.sessions.close, data)
    return response.data.data
  },

  getCurrentSession: async (branchId: string): Promise<POSSession | null> => {
    try {
      const response = await apiClient.get<ApiResponse<POSSession | null>>(endpoints.pos.sessions.current(branchId))
      return response.data.data
    } catch (error: any) {
      // If 404 or specifically "no active session", return null instead of throwing
      if (error?.response?.status === 404) {
        return null
      }
      throw error
    }
  },
}
