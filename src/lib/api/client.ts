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
  resolve: (value?: any) => void
  reject: (error?: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
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
      } catch (e) {
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
        case 401:
          // Don't retry refresh token endpoint or if already retried
          if (
            originalRequest?.url?.includes("/auth/refresh") ||
            originalRequest?._retry
          ) {
            // Refresh failed or already retried - clear auth and redirect
            if (typeof window !== "undefined") {
              const currentPath = window.location.pathname
              const isOnboardingRoute = 
                currentPath.includes("/register-business") ||
                currentPath.includes("/select-modules") ||
                currentPath.includes("/dashboard")
              
              if (!isOnboardingRoute) {
                localStorage.removeItem("auth-storage")
                window.location.href = "/login"
              }
            }
            return Promise.reject(error)
          }

          // Try to refresh token
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
              // The API uses the current access token in Authorization header and empty body
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
                undefined // Empty body as per API spec (curl -d '')
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
              // Refresh failed - clear auth and redirect
              processQueue(refreshError, null)
              
              if (typeof window !== "undefined") {
                const currentPath = window.location.pathname
                const isOnboardingRoute = 
                  currentPath.includes("/register-business") ||
                  currentPath.includes("/select-modules") ||
                  currentPath.includes("/dashboard")
                
                if (!isOnboardingRoute) {
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
