"use client"

import { posSessionsApi } from "@/lib/api/pos-sessions"
import { ClosePOSSessionInput, OpenPOSSessionInput, POSSession } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { extractError } from "@/lib/utils/error"

export function usePOSSession(branchId: string | undefined) {
  return useQuery({
    queryKey: ["pos-session", branchId],
    queryFn: () => posSessionsApi.getCurrentSession(branchId!),
    enabled: !!branchId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useOpenPOSSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: OpenPOSSessionInput) => posSessionsApi.openSession(data),
    onSuccess: (session: POSSession) => {
      queryClient.invalidateQueries({ queryKey: ["pos-session", session.branchId] })
      toast.success("POS session opened successfully!")
    },
    onError: (error) => {
      toast.error(extractError(error, "Failed to open POS session. Please try again."))
    },
  })
}

export function useClosePOSSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ClosePOSSessionInput) => posSessionsApi.closeSession(data),
    onSuccess: (session: POSSession) => {
      queryClient.invalidateQueries({ queryKey: ["pos-session", session.branchId] })
      toast.success("POS session closed successfully!")
    },
    onError: (error) => {
      toast.error(extractError(error, "Failed to close POS session. Please try again."))
    },
  })
}
