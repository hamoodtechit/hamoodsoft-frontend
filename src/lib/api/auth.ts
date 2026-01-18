import {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "@/lib/validations/auth"
import { ApiResponse, Business, User } from "@/types"
import apiClient from "./client"
import { endpoints } from "./endpoints"

export interface LoginResponse {
  token: string
  refreshToken: string
  user: User
  businesses: Business[]
}

export interface RegisterResponse {
  token: string
  refreshToken?: string
  user?: User
  businesses?: Business[]
}

export const authApi = {
  login: async (data: LoginInput): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      endpoints.auth.login,
      data
    )
    return response.data.data
  },

  register: async (data: RegisterInput): Promise<RegisterResponse> => {
    // Exclude confirmPassword from the request
    const { confirmPassword, ...registerData } = data
    const response = await apiClient.post<ApiResponse<RegisterResponse>>(
      endpoints.auth.register,
      registerData
    )
    return response.data.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post(endpoints.auth.logout)
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>(endpoints.auth.me)
    return response.data.data
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>(endpoints.auth.profile)
    return response.data.data
  },

  requestPasswordReset: async (data: ForgotPasswordInput): Promise<{ token: string }> => {
    const response = await apiClient.post<ApiResponse<{ token: string }>>(
      endpoints.auth.requestPasswordReset,
      data
    )
    return response.data.data
  },

  resetPassword: async (data: ResetPasswordInput): Promise<{ id: string; email: string }> => {
    const response = await apiClient.post<ApiResponse<{ id: string; email: string }>>(
      endpoints.auth.resetPassword,
      {
        token: data.token,
        newPassword: data.newPassword,
      }
    )
    return response.data.data
  },

  refreshToken: async (): Promise<{ token: string; refreshToken?: string }> => {
    const response = await apiClient.post<ApiResponse<{ token: string; refreshToken?: string }>>(
      endpoints.auth.refresh
    )
    return response.data.data
  },
}
