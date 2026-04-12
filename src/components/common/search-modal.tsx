"use client"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { Building2, Calculator, LayoutDashboard, Package, Settings, ShoppingCart, Users, Droplets } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const t = useTranslations("common")
  const router = useRouter()
  const params = useParams()
  const locale = params?.locale || "en"
  const currentBusiness = useCurrentBusiness()

  // Handle keyboard shortcuts (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        onOpenChange(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onOpenChange])

  const runCommand = (command: () => void) => {
    onOpenChange(false)
    command()
  }

  const navigateTo = (path: string) => {
    router.push(`/${locale}/dashboard${path}`)
  }

  const hasPos = currentBusiness?.modules?.includes("point-of-sale")
  const hasInventory = currentBusiness?.modules?.includes("inventory")
  const hasAccounting = currentBusiness?.modules?.includes("accounting")
  const hasCrm = currentBusiness?.modules?.includes("crm")
  const hasPetrol = currentBusiness?.modules?.includes("oil-filling-station")

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="General">
          <CommandItem onSelect={() => runCommand(() => navigateTo(""))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          {hasPos && (
            <CommandItem onSelect={() => runCommand(() => navigateTo("/point-of-sale"))}>
              <Calculator className="mr-2 h-4 w-4" />
              <span>Point of Sale</span>
            </CommandItem>
          )}
        </CommandGroup>
        
        <CommandSeparator />

        <CommandGroup heading="Modules">
          {hasInventory && (
            <CommandItem onSelect={() => runCommand(() => navigateTo("/products"))}>
              <Package className="mr-2 h-4 w-4" />
              <span>Inventory & Products</span>
            </CommandItem>
          )}
          {hasAccounting && (
            <CommandItem onSelect={() => runCommand(() => navigateTo("/sales"))}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              <span>Sales & Accounting</span>
            </CommandItem>
          )}
          {hasCrm && (
            <CommandItem onSelect={() => runCommand(() => navigateTo("/crm"))}>
              <Users className="mr-2 h-4 w-4" />
              <span>CRM & Contacts</span>
            </CommandItem>
          )}
          {hasPetrol && (
            <CommandItem onSelect={() => runCommand(() => navigateTo("/oil-filling-station"))}>
              <Droplets className="mr-2 h-4 w-4" />
              <span>Petrol Pump Details</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => navigateTo("/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Business Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigateTo("/profile"))}>
            <Building2 className="mr-2 h-4 w-4" />
            <span>My Profile</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
