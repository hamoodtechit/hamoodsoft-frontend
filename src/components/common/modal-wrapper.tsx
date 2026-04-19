import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import React from "react"

export interface ModalWrapperProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  contentClassName?: string
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "fit" | "full"
}

export function ModalWrapper({
  open,
  onOpenChange,
  children,
  contentClassName,
  size = "lg",
}: ModalWrapperProps) {
  const sizeClasses = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
    "3xl": "sm:max-w-3xl",
    "4xl": "sm:max-w-4xl",
    "5xl": "sm:max-w-5xl",
    fit: "sm:max-w-fit",
    full: "sm:max-w-[95vw]",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          sizeClasses[size],
          contentClassName
        )}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}
