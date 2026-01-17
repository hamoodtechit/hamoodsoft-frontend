"use client"

import { businessApi } from "@/lib/api/business"
import { usersApi } from "@/lib/api/users"
import { CreateBusinessInput } from "@/lib/validations/business"
import { useAuthStore } from "@/store"
import { Business } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { toast } from "sonner"

export function useCreateBusiness() {
  const router = useRouter()
  const params = useParams()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale || "en"
  const queryClient = useQueryClient()
  const { user: storeUser, setUser, businesses: storeBusinesses, setBusinesses } = useAuthStore()

  return useMutation({
    mutationFn: (data: CreateBusinessInput) => businessApi.createBusiness(data),
    onSuccess: async (createdBusiness) => {
      // Check if user already has businesses
      const currentBusinesses = queryClient.getQueryData<Business[]>(["businesses"]) || storeBusinesses || []
      const hasExistingBusinesses = currentBusinesses.length > 0
      
      // If user doesn't have a currentBusinessId (first business), set it
      // If user already has businesses, don't automatically switch (let them choose)
      if (storeUser && createdBusiness.id) {
        if (!storeUser.currentBusinessId) {
          // First business - set it as current
          const updatedUser = {
            ...storeUser,
            currentBusinessId: createdBusiness.id,
          }
          // Update user in store and cache IMMEDIATELY
          setUser(updatedUser)
          queryClient.setQueryData(["auth", "profile"], updatedUser)
          
          // Try to update via API (in background, don't block on failure)
          if (storeUser.id) {
            usersApi.updateUser(storeUser.id, {
              currentBusinessId: createdBusiness.id,
            }).then((apiUpdatedUser) => {
              setUser(apiUpdatedUser)
              queryClient.setQueryData(["auth", "profile"], apiUpdatedUser)
            }).catch((error: any) => {
              console.warn("Failed to update user's currentBusinessId via API:", error)
            })
          }
        }
        // If user already has currentBusinessId, don't change it - they can switch manually
      }
      
      // Add the new business to the businesses array
      const updatedBusinesses = [...currentBusinesses, createdBusiness]
      setBusinesses(updatedBusinesses)
      queryClient.setQueryData(["businesses"], updatedBusinesses)
      
      // Onboarding status is now based on user.currentBusinessId, no need to invalidate
      
      if (hasExistingBusinesses) {
        toast.success("New business created successfully! You can switch to it from the business switcher.")
      } else {
        toast.success("Business registered successfully!")
      }
      
      // Redirect to dashboard
      router.push(`/${locale}/dashboard`)
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Failed to register business. Please try again."
      toast.error(message)
    },
  })
}

export function useBusinesses() {
  const { isAuthenticated, businesses: storeBusinesses, setBusinesses } = useAuthStore()
  const queryClient = useQueryClient()
  const hasInitializedRef = useRef(false)

  // Sync React Query cache with store businesses ONCE on mount
  // This ensures businesses (with modules) are available immediately after refresh
  useEffect(() => {
    if (!hasInitializedRef.current && storeBusinesses.length > 0) {
      const cachedData = queryClient.getQueryData(["businesses"])
      // Only update cache if it's empty (first load after refresh)
      if (!cachedData || (Array.isArray(cachedData) && cachedData.length === 0)) {
        queryClient.setQueryData(["businesses"], storeBusinesses)
        hasInitializedRef.current = true
      }
    }
  }, []) // Only run once on mount

  const query = useQuery({
    queryKey: ["businesses"],
    queryFn: async () => {
      const businesses = await businessApi.getBusinesses()
      return businesses
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    // Use store businesses as initial data if available
    initialData: storeBusinesses.length > 0 ? storeBusinesses : undefined,
    // Don't refetch on window focus to prevent loading on tab change
    refetchOnWindowFocus: false,
    // Don't refetch on mount if we have store businesses
    refetchOnMount: storeBusinesses.length > 0 ? false : true,
  })

  // Update store when data is fetched from API, but preserve modules from existing businesses
  // Only update if query.data is different from storeBusinesses to prevent loops
  useEffect(() => {
    if (query.data && query.data.length > 0 && query.isFetched) {
      // Check if data is actually different from store to prevent infinite loops
      const dataString = JSON.stringify(query.data.map(b => ({ id: b.id, modules: b.modules })))
      const storeString = JSON.stringify(storeBusinesses.map(b => ({ id: b.id, modules: b.modules })))
      
      if (dataString !== storeString) {
        // Merge API data with store businesses to preserve modules
        const mergedBusinesses = query.data.map((apiBusiness: Business) => {
          // Find existing business in store to preserve modules
          const existingBusiness = storeBusinesses.find(b => b.id === apiBusiness.id)
          // If existing business has modules, preserve them (unless API has modules)
          if (existingBusiness?.modules && existingBusiness.modules.length > 0 && 
              (!apiBusiness.modules || apiBusiness.modules.length === 0)) {
            return {
              ...apiBusiness,
              modules: existingBusiness.modules, // Preserve modules from store
            }
          }
          // Otherwise use API data (which might have modules)
          return apiBusiness
        })
        
        // Only update if merged data is different
        const mergedString = JSON.stringify(mergedBusinesses.map(b => ({ id: b.id, modules: b.modules })))
        if (mergedString !== storeString) {
          setBusinesses(mergedBusinesses)
        }
      }
    }
  }, [query.data, query.isFetched, setBusinesses]) // Removed storeBusinesses from deps to prevent loop

  return query
}

export function useBusiness(id: string | null | undefined) {
  const { isAuthenticated } = useAuthStore()

  return useQuery({
    queryKey: ["business", id],
    queryFn: () => businessApi.getBusinessById(id!),
    enabled: isAuthenticated && !!id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })
}

export function useSwitchBusiness() {
  const { user: storeUser, setUser, businesses: storeBusinesses, setBusinesses } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (businessId: string) => {
      console.log("useSwitchBusiness mutationFn called with businessId:", businessId)
      // Get user from query cache first, fallback to store
      const cachedUser = queryClient.getQueryData<any>(["auth", "profile"])
      const user = cachedUser || storeUser

      console.log("User from cache/store:", { userId: user?.id, currentBusinessId: user?.currentBusinessId })

      if (!user?.id) {
        throw new Error("User ID is required. Please refresh the page and try again.")
      }

      // Update user's currentBusinessId directly via API
      // Send the businessId in the body: { currentBusinessId: businessId }
      console.log("Calling usersApi.updateUser with:", { userId: user.id, currentBusinessId: businessId })
      const updatedUser = await usersApi.updateUser(user.id, {
        currentBusinessId: businessId,
      })
      
      console.log("usersApi.updateUser response:", updatedUser)
      
      // Return both the API response and the businessId we sent
      // This ensures we have the businessId even if API returns empty object
      return { updatedUser, businessId }
    },
    onSuccess: async ({ updatedUser, businessId }) => {
      console.log("useSwitchBusiness onSuccess called with:", { updatedUser, businessId })
      
      // Merge updated user with existing user to preserve all fields
      const currentUser = storeUser || queryClient.getQueryData<any>(["auth", "profile"])
      
      // IMPORTANT: Always use the businessId we sent, not the API response
      // The API might return the old currentBusinessId, so we trust what we sent
      const newCurrentBusinessId = businessId
      
      console.log("newCurrentBusinessId (using businessId we sent):", newCurrentBusinessId)
      console.log("API returned currentBusinessId:", updatedUser?.currentBusinessId)
      
      const mergedUser = {
        ...currentUser,
        ...updatedUser,
        currentBusinessId: newCurrentBusinessId, // Always use the businessId we sent
      }
      
      console.log("mergedUser:", mergedUser)
      
      // Update user in store and cache IMMEDIATELY
      setUser(mergedUser)
      queryClient.setQueryData(["auth", "profile"], mergedUser)
      
      console.log("User updated in store and cache")
      
     
      
      // Fetch the specific business to get its modules
      // Use the businessId we sent, not the one from API response (which might be undefined)
      try {
        const newCurrentBusiness = await businessApi.getBusinessById(newCurrentBusinessId)
        
        // Update businesses array: merge API response with existing business to preserve modules
        let updatedBusinesses = [...storeBusinesses]
        const existingIndex = updatedBusinesses.findIndex(b => b.id === newCurrentBusiness.id)
        
        if (existingIndex >= 0) {
          // Merge API response with existing business to preserve modules
          // If API response doesn't have modules, keep the existing ones
          const existingBusiness = updatedBusinesses[existingIndex]
          updatedBusinesses[existingIndex] = {
            ...newCurrentBusiness,
            modules: newCurrentBusiness.modules || existingBusiness.modules || [],
          }
        } else {
          // If business not in list, add it (modules might be empty if API doesn't return them)
          updatedBusinesses.push({
            ...newCurrentBusiness,
            modules: newCurrentBusiness.modules || [],
          })
        }
        
        // Update businesses in store and cache with modules preserved
        setBusinesses(updatedBusinesses)
        queryClient.setQueryData(["businesses"], updatedBusinesses)
      
     
      } catch (error) {
        // If fetch fails, still update user but log error
        console.warn("Failed to fetch business details after switch:", error)
        // Try to refetch all businesses as fallback
        try {
          const freshBusinesses = await businessApi.getBusinesses()
          // Merge with existing to preserve modules
          const mergedBusinesses = freshBusinesses.map((apiBusiness: Business) => {
            const existing = storeBusinesses.find(b => b.id === apiBusiness.id)
            return existing?.modules ? { ...apiBusiness, modules: existing.modules } : apiBusiness
          })
          setBusinesses(mergedBusinesses)
          queryClient.setQueryData(["businesses"], mergedBusinesses)
        } catch (fallbackError) {
          console.warn("Failed to refetch businesses after switch:", fallbackError)
        }
      }
      
      toast.success("Business switched successfully!")
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to switch business. Please try again."
      toast.error(message)
    },
  })
}
