"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BusinessEditDialog } from "@/components/common/business-edit-dialog"
import { useBusinesses, useSwitchBusiness } from "@/lib/hooks/use-business"
import { useAuthStore } from "@/store"
import { Business } from "@/types"
import { useQueryClient } from "@tanstack/react-query"
import { Building2, Check, Pencil } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function BusinessSwitcher() {
  const t = useTranslations("common")
  const { user, businesses: storeBusinesses } = useAuthStore()
  const { data: apiBusinesses, isLoading } = useBusinesses()
  const switchBusinessMutation = useSwitchBusiness()
  const queryClient = useQueryClient()
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Use businesses from multiple sources in priority order:
  // 1. Zustand store (from login response, persisted)
  // 2. React Query cache (might have cached data)
  // 3. API response
  const businesses = (() => {
    // First check Zustand store
    if (storeBusinesses.length > 0) return storeBusinesses
    
    // Then check React Query cache
    const cachedBusinesses = queryClient.getQueryData<any>(["businesses"])
    if (cachedBusinesses && Array.isArray(cachedBusinesses) && cachedBusinesses.length > 0) {
      return cachedBusinesses
    }
    
    // Finally use API response
    if (apiBusinesses && apiBusinesses.length > 0) return apiBusinesses
    
    return []
  })()

  const currentBusinessId = user?.currentBusinessId
  const currentBusiness = businesses?.find((b) => b.id === currentBusinessId)

  const handleSwitchBusiness = (businessId: string) => {
    console.log("Switch business clicked:", { businessId, currentBusinessId, isPending: switchBusinessMutation.isPending })
    if (businessId !== currentBusinessId) {
      console.log("Calling switchBusinessMutation.mutate with:", businessId)
      switchBusinessMutation.mutate(businessId)
    } else {
      console.log("Business already selected, skipping switch")
    }
  }

  const handleEditBusiness = (e: React.MouseEvent, business: Business) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingBusiness(business)
    setIsEditDialogOpen(true)
  }

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Building2 className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    )
  }

  if (!businesses || businesses.length === 0) {
    return null
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">
              {currentBusiness?.name || "Select Business"}
            </span>
            <span className="sm:hidden">Business</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Switch Business</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {businesses.map((business) => {
            const isCurrent = business.id === currentBusinessId
            return (
              <DropdownMenuItem
                key={business.id}
                onClick={(e) => {
                  // Don't switch if clicking on the edit button
                  const target = e.target as HTMLElement
                  if (target.closest('button[data-edit-button]')) {
                    return
                  }
                  // Don't switch if it's the current business
                  if (isCurrent) {
                    return
                  }
                  e.preventDefault()
                  e.stopPropagation()
                  handleSwitchBusiness(business.id)
                }}
                disabled={switchBusinessMutation.isPending}
                className={cn(
                  "flex items-center justify-between gap-2",
                  isCurrent && "opacity-100" // Keep visible even if current
                )}
                onSelect={(e) => {
                  // Prevent default selection behavior
                  e.preventDefault()
                  // Don't close dropdown if clicking on edit button or current business
                  const target = e.target as HTMLElement
                  if (target.closest('button[data-edit-button]') || isCurrent) {
                    e.preventDefault()
                  }
                }}
              >
                <span className="flex-1 truncate">{business.name}</span>
                <div className="flex items-center gap-1">
                  {isCurrent && <Check className="h-4 w-4 text-primary" />}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    data-edit-button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleEditBusiness(e, business)
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    disabled={switchBusinessMutation.isPending}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <BusinessEditDialog
        business={editingBusiness}
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) {
            setEditingBusiness(null)
          }
        }}
      />
    </>
  )
}
