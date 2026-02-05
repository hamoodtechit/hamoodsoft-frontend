"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Plus, X } from "lucide-react"
import { useState } from "react"

interface QuickAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

interface FloatingActionButtonProps {
  actions: QuickAction[]
  className?: string
}

export function FloatingActionButton({ actions, className }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (actions.length === 0) return null

  // If only one action, show as single button
  if (actions.length === 1) {
    const action = actions[0]
    const Icon = action.icon
    return (
      <div className={cn("fixed bottom-6 right-6 z-50", className)}>
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          onClick={action.onClick}
          aria-label={action.label}
        >
          <Icon className="h-6 w-6" />
        </Button>
      </div>
    )
  }

  // Multiple actions - show as dropdown
  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className={cn(
              "h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300",
              isOpen && "rotate-45 scale-110"
            )}
            aria-label="Quick actions"
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Plus className="h-6 w-6" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="end"
          className="mb-2 w-56"
        >
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <div key={action.id}>
                {index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onClick={() => {
                    action.onClick()
                    setIsOpen(false)
                  }}
                  className="cursor-pointer"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {action.label}
                </DropdownMenuItem>
              </div>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
