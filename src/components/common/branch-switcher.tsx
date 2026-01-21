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
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { Branch } from "@/types"
import { Check, GitBranch } from "lucide-react"
import { useTranslations } from "next-intl"

export function BranchSwitcher() {
  const t = useTranslations("branches")
  const { branches, currentBranch, switchBranch } = useBranchSelection()

  if (!branches || branches.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <GitBranch className="h-4 w-4" />
          <span className="hidden sm:inline">
            {currentBranch?.name || t("title")}
          </span>
          <span className="sm:hidden">{t("title")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>{t("title")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {branches.map((branch: Branch) => {
          const isCurrent = branch.id === currentBranch?.id
          return (
            <DropdownMenuItem
              key={branch.id}
              onClick={() => {
                if (!isCurrent) switchBranch(branch.id)
              }}
              disabled={isCurrent}
              className="flex items-center justify-between gap-2"
            >
              <span className="flex-1 truncate">{branch.name}</span>
              {isCurrent && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

