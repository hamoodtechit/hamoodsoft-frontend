"use client"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { usePOSSession } from "@/lib/hooks/use-pos-sessions"
import { CreditCard } from "lucide-react"
import { useLocale } from "next-intl"
import Link from "next/link"

export function POSSessionIndicator() {
  const { selectedBranchId } = useBranchSelection()
  const { data: activeSession, isLoading } = usePOSSession(selectedBranchId || undefined)
  const locale = useLocale()

  if (isLoading || !selectedBranchId) return null

  const isOpen = !!activeSession

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={`/${locale}/dashboard/point-of-sale`}>
            <div className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-accent transition-colors cursor-pointer border bg-muted/30">
              <div className="relative flex h-2 w-2">
                {isOpen && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isOpen ? 'bg-green-500' : 'bg-slate-300'}`}></span>
              </div>
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase hidden md:inline-block">
                {isOpen ? 'POS Open' : 'POS Closed'}
              </span>
            </div>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="text-xs">
          <p>{isOpen ? 'Register is currently open and active.' : 'Register is closed. Click to start a new session.'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
