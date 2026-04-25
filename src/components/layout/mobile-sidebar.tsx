"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { MobileSidebarContent } from "./mobile-sidebar-content"

interface MobileSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0 sm:w-80 flex flex-col">
        <SheetHeader className="border-b px-4 py-3 shrink-0">
          <SheetTitle className="text-lg font-semibold text-left">Menu</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <MobileSidebarContent onLinkClick={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
