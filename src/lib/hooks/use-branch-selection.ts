"use client"

import { useBranches } from "@/lib/hooks/use-branches"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { useUIStore } from "@/store"
import { Branch } from "@/types"
import { useEffect, useMemo } from "react"

/**
 * Returns current branch + list of branches.
 * - Stores selection in UI store (persisted) keyed by businessId
 * - Defaults to the first branch if none is selected
 */
export function useBranchSelection() {
  const currentBusiness = useCurrentBusiness()
  const businessId = currentBusiness?.id
  const { data: branches = [] } = useBranches()
  const { selectedBranchByBusinessId, setSelectedBranch } = useUIStore()

  const selectedBranchId = businessId ? selectedBranchByBusinessId[businessId] : null

  const currentBranch = useMemo(() => {
    if (!branches || branches.length === 0) return null
    if (selectedBranchId) {
      return branches.find((b: Branch) => b.id === selectedBranchId) || null
    }
    return branches[0] || null
  }, [branches, selectedBranchId])

  // Default select first branch when available
  useEffect(() => {
    if (!businessId) return
    if (!branches || branches.length === 0) return
    if (!selectedBranchId) {
      setSelectedBranch(businessId, branches[0].id)
    } else {
      // If selected branch no longer exists, fallback to first
      const exists = branches.some((b: Branch) => b.id === selectedBranchId)
      if (!exists) setSelectedBranch(businessId, branches[0].id)
    }
  }, [businessId, branches, selectedBranchId, setSelectedBranch])

  const switchBranch = (branchId: string) => {
    if (!businessId) return
    setSelectedBranch(businessId, branchId)
  }

  return {
    businessId,
    branches,
    currentBranch,
    selectedBranchId: currentBranch?.id || null,
    switchBranch,
  }
}

