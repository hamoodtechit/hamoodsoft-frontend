"use client"

import { authApi } from "@/lib/api/auth"
import {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "@/lib/validations/auth"
import { useAuthStore } from "@/store"
import { User } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"
import { extractError } from "@/lib/utils/error"
import { getNextOnboardingStep } from "./use-onboarding"

export function useLogin() {
  const router = useRouter()
  const params = useParams()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale || "en"
  const { setToken, setRefreshToken, setUser, setBusinesses } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LoginInput) => authApi.login(data),
    onSuccess: async (response) => {
      // Set tokens and user data from login response
      setToken(response.token)
      if (response.refreshToken) {
        setRefreshToken(response.refreshToken)
      }
      if (response.user) {
        setUser(response.user)
        // Cache user data in React Query
        queryClient.setQueryData(["auth", "profile"], response.user)
      }
      if (response.businesses) {
        setBusinesses(response.businesses)
        // Also cache businesses in React Query for immediate use
        queryClient.setQueryData(["businesses"], response.businesses)
      }
      
      // Check onboarding status and redirect accordingly
      // Since we removed the /business/status API, we only check user.currentBusinessId
      const nextStep = getNextOnboardingStep(locale, response.user)
      
      if (nextStep) {
        // Onboarding incomplete, redirect to next step
        router.push(nextStep)
      } else {
        // Onboarding complete, go to dashboard
        router.push(`/${locale}/dashboard`)
      }
      
      toast.success("Login successful!")
    },
    onError: (error) => {
      toast.error(extractError(error, "Login failed. Please try again."))
    },
  })
}

export function useRegister() {
  const router = useRouter()
  const params = useParams()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale || "en"
  const { setToken, setRefreshToken, setUser, setBusinesses } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RegisterInput) => authApi.register(data),
    onSuccess: (response) => {
      setToken(response.token)
      if (response.refreshToken) {
        setRefreshToken(response.refreshToken)
      }
      if (response.user) {
        setUser(response.user)
        queryClient.setQueryData(["auth", "profile"], response.user)
      }
      if (response.businesses) {
        setBusinesses(response.businesses)
        // Also cache businesses in React Query
        queryClient.setQueryData(["businesses"], response.businesses)
      }
      toast.success("Registration successful! Please register your business.")
      // Redirect to business registration step
      router.push(`/${locale}/register-business`)
    },
    onError: (error) => {
      toast.error(extractError(error, "Registration failed. Please try again."))
    },
  })
}

export function useLogout() {
  const router = useRouter()
  const { logout } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      logout()
      queryClient.clear()
      // Clear localStorage explicitly (Zustand persist storage)
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth-storage")
        // Also clear sessionStorage
        sessionStorage.clear()
      }
      toast.success("Logged out successfully")
      router.push("/login")
    },
    onError: () => {
      // Even if API call fails, clear local state
      logout()
      queryClient.clear()
      // Clear localStorage explicitly (Zustand persist storage)
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth-storage")
        // Also clear sessionStorage
        sessionStorage.clear()
      }
      router.push("/login")
    },
  })
}

export function useAuth() {
  const { user: storeUser, isAuthenticated, token, setUser } = useAuthStore()

  const { data, isLoading, error, isFetched } = useQuery({
    queryKey: ["auth", "profile"],
    queryFn: () => authApi.getProfile(),
    enabled: !!token && isAuthenticated,
    retry: false,
    // Re-fetch permissions when user returns to tab (catches role changes)
    refetchOnWindowFocus: true,
    // Refetch on mount to ensure fresh permissions after navigation
    refetchOnMount: true,
    // Background polling every 60 seconds for live permission sync
    refetchInterval: 60 * 1000,
    // Only poll when the tab is visible (saves resources)
    refetchIntervalInBackground: false,
    // Keep previous data while refetching to prevent UI flicker
    placeholderData: (prev: User | undefined) => prev,
  })

  // Update store when profile data is fetched from API
  // Only update if data is actually different to prevent loops
  useEffect(() => {
    if (data && isFetched) {
      // Only update if store user is null or if data is different
      if (!storeUser) {
        setUser(data)
      } else if (data.id === storeUser.id) {
        // Check if data is actually different
        const dataChanged = 
          data.currentBusinessId !== storeUser.currentBusinessId ||
          data.name !== storeUser.name ||
          data.email !== storeUser.email ||
          // Detect permission changes for live role update sync
          JSON.stringify(data.permissions) !== JSON.stringify(storeUser.permissions) ||
          data.roleId !== storeUser.roleId
        
        if (dataChanged) {
          // Merge to preserve any store updates while applying API changes
          setUser({ ...storeUser, ...data })
        }
      }
    }
  }, [data, isFetched, setUser]) // Removed storeUser from deps to prevent loop

  // Prioritize storeUser over query data to ensure business switch updates are reflected
  // Only use query data if storeUser is null (initial load)
  const user = storeUser || data
  
  return {
    user,
    isAuthenticated,
    isLoading,
    error,
  }
}

export function useForgotPassword() {
  const router = useRouter()
  const params = useParams()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale || "en"

  return useMutation({
    mutationFn: (data: ForgotPasswordInput) => authApi.requestPasswordReset(data),
    onSuccess: (response) => {
      // Store token in sessionStorage instead of URL for better security
      // This prevents token from appearing in browser history, server logs, etc.
      if (response.token && typeof window !== "undefined") {
        sessionStorage.setItem("passwordResetToken", response.token)
        toast.success("Password reset token generated. Redirecting to reset page...")
        router.push(`/${locale}/reset-password`)
      } else {
        toast.success("Password reset requested successfully!")
      }
    },
    onError: (error) => {
      toast.error(extractError(error, "Failed to request password reset. Please try again."))
    },
  })
}

export function useResetPassword() {
  const router = useRouter()
  const params = useParams()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale || "en"

  return useMutation({
    mutationFn: (data: ResetPasswordInput) => authApi.resetPassword(data),
    onSuccess: () => {
      toast.success("Password reset successful! You can now login.")
      router.push(`/${locale}/login`)
    },
    onError: (error) => {
      toast.error(extractError(error, "Failed to reset password. The link may be invalid or expired."))
    },
  })
}

