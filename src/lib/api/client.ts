import { config } from "@/constants/config"
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios"

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: {
    "Content-Type": "application/json",
  },
})

// Flag to prevent infinite refresh loops
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (error?: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from store or localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("auth-storage") : null
    
    if (token) {
      try {
        const parsed = JSON.parse(token)
        if (parsed?.state?.token) {
          config.headers.Authorization = `Bearer ${parsed.state.token}`
        }
      } catch {
        // Ignore parsing errors
      }
    }
    
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response) {
      // Handle different error status codes
      switch (error.response.status) {
        case 401: {
          const requestUrl = originalRequest?.url || ""
          const isAuthEndpoint =
            requestUrl.includes("/auth/login") ||
            requestUrl.includes("/auth/register") ||
            requestUrl.includes("/auth/refresh") ||
            requestUrl.includes("/auth/request-password-reset") ||
            requestUrl.includes("/auth/reset-password") ||
            requestUrl.includes("/auth/google")

          // Don't attempt token refresh for auth endpoints or if already retried
          if (isAuthEndpoint || originalRequest?._retry) {
            return Promise.reject(error)
          }

          // Try to refresh token for normal protected endpoints
          if (!isRefreshing) {
            isRefreshing = true

            try {
              // Get current access token from localStorage
              const authStorage = typeof window !== "undefined" ? localStorage.getItem("auth-storage") : null
              if (!authStorage) {
                throw new Error("No auth storage available")
              }

              const parsed = JSON.parse(authStorage)
              const currentToken = parsed?.state?.token

              if (!currentToken) {
                throw new Error("No access token available")
              }

              // Call refresh API (create a separate axios instance to avoid interceptor loop)
              const refreshAxios = axios.create({
                baseURL: config.api.baseUrl,
                timeout: config.api.timeout,
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${currentToken}`,
                },
              })
              
              const refreshResponse = await refreshAxios.post(
                "/auth/refresh",
                undefined // Empty body as per API spec
              )

              const refreshData = refreshResponse.data.data || refreshResponse.data
              const newToken = refreshData.token
              const newRefreshToken = refreshData.refreshToken || parsed?.state?.refreshToken

              // Update tokens in localStorage
              if (typeof window !== "undefined") {
                const updatedAuth = {
                  ...parsed,
                  state: {
                    ...parsed.state,
                    token: newToken,
                    refreshToken: newRefreshToken,
                  },
                }
                localStorage.setItem("auth-storage", JSON.stringify(updatedAuth))
                
                // Also update Zustand store if available (dispatch custom event)
                window.dispatchEvent(new CustomEvent("auth-token-refreshed", { 
                  detail: { token: newToken, refreshToken: newRefreshToken } 
                }))
              }

              // Update the original request with new token
              if (originalRequest) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`
                originalRequest._retry = true
              }

              // Process queued requests
              processQueue(null, newToken)

              // Retry the original request
              return apiClient(originalRequest)
            } catch (refreshError) {
              // Refresh failed - clear auth and redirect if not on auth page
              processQueue(refreshError, null)
              
              if (typeof window !== "undefined") {
                const currentPath = window.location.pathname
                const isAuthPage = 
                  currentPath.includes("/login") ||
                  currentPath.includes("/register") ||
                  currentPath.includes("/forgot-password") ||
                  currentPath.includes("/reset-password")
                const isOnboardingRoute = 
                  currentPath.includes("/register-business") ||
                  currentPath.includes("/select-modules")
                
                if (!isAuthPage && !isOnboardingRoute) {
                  localStorage.removeItem("auth-storage")
                  window.location.href = "/login"
                }
              }
              
              return Promise.reject(refreshError)
            } finally {
              isRefreshing = false
            }
          } else {
            // Already refreshing - queue this request
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject })
            })
              .then((token) => {
                if (originalRequest && token) {
                  originalRequest.headers.Authorization = `Bearer ${token}`
                  return apiClient(originalRequest)
                }
              })
              .catch((err) => {
                return Promise.reject(err)
              })
          }
        }
        case 403:
          // Forbidden
          break
        case 404:
          // Not found
          break
        case 500:
          // Server error
          break
      }
    } else if (error.request) {
      // Network error
      console.error("Network error:", error.request)
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
