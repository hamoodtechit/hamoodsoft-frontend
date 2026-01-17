import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios"
import { config } from "@/constants/config"

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: {
    "Content-Type": "application/json",
  },
})

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
    if (error.response) {
      // Handle different error status codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - only redirect if we're not in the middle of onboarding/business creation
          // Check if we're on certain routes that should handle 401 themselves
          if (typeof window !== "undefined") {
            const currentPath = window.location.pathname
            const isOnboardingRoute = 
              currentPath.includes("/register-business") ||
              currentPath.includes("/select-modules") ||
              currentPath.includes("/dashboard")
            
            // Only redirect if not on onboarding/dashboard routes
            // These routes handle auth themselves
            if (!isOnboardingRoute) {
              localStorage.removeItem("auth-storage")
              window.location.href = "/login"
            }
          }
          break
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
