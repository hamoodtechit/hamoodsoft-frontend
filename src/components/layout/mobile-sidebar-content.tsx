"use client"

import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { useMemo } from "react"
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  BookOpen,
  CreditCard,
  Fuel,
  Settings,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useBusinesses } from "@/lib/hooks/use-business"
import { useAuthStore } from "@/store"
import { useQueryClient } from "@tanstack/react-query"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

interface NavSection {
  title?: string
  items: NavItem[]
}

interface MobileSidebarContentProps {
  onLinkClick?: () => void
}

// Module to sidebar item mapping (same as desktop sidebar)
const moduleSidebarMap: Record<string, NavItem> = {
  'inventory': {
    title: "Inventory",
    href: "/dashboard/inventory",
    icon: Package,
  },
  'sales': {
    title: "Sales",
    href: "/dashboard/sales",
    icon: ShoppingCart,
  },
  'purchases': {
    title: "Purchase",
    href: "/dashboard/purchase",
    icon: Package,
  },
  'accounting': {
    title: "Accounting",
    href: "/dashboard/accounting",
    icon: BookOpen,
  },
  'point-of-sale': {
    title: "Point of Sale",
    href: "/dashboard/point-of-sale",
    icon: CreditCard,
  },
  'crm': {
    title: "CRM",
    href: "/dashboard/crm",
    icon: Users,
  },
  'oil-filling-station': {
    title: "Oil Filling Station",
    href: "/dashboard/oil-filling-station",
    icon: Fuel,
  },
}

export function MobileSidebarContent({ onLinkClick }: MobileSidebarContentProps = {}) {
  const pathname = usePathname()
  const params = useParams()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale || "en"
  const { user: storeUser, businesses: storeBusinesses } = useAuthStore()
  const { data: apiBusinesses, isLoading: isLoadingBusinesses } = useBusinesses()
  const queryClient = useQueryClient()

  // Use businesses from multiple sources in priority order (same as desktop sidebar)
  const businesses = useMemo(() => {
    if (storeBusinesses.length > 0) return storeBusinesses
    
    const cachedBusinesses = queryClient.getQueryData<any>(["businesses"])
    if (cachedBusinesses && Array.isArray(cachedBusinesses) && cachedBusinesses.length > 0) {
      return cachedBusinesses
    }
    
    if (apiBusinesses && apiBusinesses.length > 0) return apiBusinesses
    
    return []
  }, [storeBusinesses, apiBusinesses, queryClient])

  // Get current business based on user's currentBusinessId
  const currentBusiness = useMemo(() => {
    if (!storeUser?.currentBusinessId || !businesses || businesses.length === 0) return null
    return businesses.find((b) => b.id === storeUser.currentBusinessId)
  }, [storeUser?.currentBusinessId, businesses])

  // Show loading state only if we're actively fetching AND have no businesses data at all
  const isLoading = isLoadingBusinesses && businesses.length === 0 && !storeBusinesses.length && !queryClient.getQueryData<any>(["businesses"])

  // Get enabled modules from current business
  const enabledModules = currentBusiness?.modules || []

  // Build sidebar sections based on enabled modules (same logic as desktop sidebar)
  const navSections: NavSection[] = useMemo(() => {
    const sections: NavSection[] = [
      {
        items: [
          {
            title: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
          },
        ],
      },
    ]

    // Management modules (always available core modules)
    const managementModules = ['inventory', 'sales', 'purchases', 'accounting', 'point-of-sale', 'crm']
    const managementItems = managementModules
      .filter((moduleId) => enabledModules.includes(moduleId))
      .map((moduleId) => moduleSidebarMap[moduleId])
      .filter(Boolean)

    if (managementItems.length > 0) {
      sections.push({
        title: "Management",
        items: managementItems,
      })
    }

    // Special modules (like oil-filling-station)
    const specialModules = ['oil-filling-station']
    const specialItems = specialModules
      .filter((moduleId) => enabledModules.includes(moduleId))
      .map((moduleId) => moduleSidebarMap[moduleId])
      .filter(Boolean)

    if (specialItems.length > 0) {
      sections.push({
        title: "Modules",
        items: specialItems,
      })
    }

    return sections
  }, [enabledModules])

  // Settings menu item - separate from navSections to position at bottom
  const settingsItem: NavItem = {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin mb-2 text-muted-foreground">⏳</div>
          <p className="text-xs text-muted-foreground">Loading modules...</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <nav className="p-4 space-y-8">
        {navSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-2">
            {section.title && (
              <div className="px-3 py-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const fullHref = `/${locale}${item.href}`
                const isActive = pathname?.startsWith(fullHref)
                return (
                  <Link key={item.href} href={fullHref} onClick={onLinkClick}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 h-10 px-3",
                        isActive && "bg-secondary font-medium"
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-left text-sm">{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <ChevronRight className="ml-auto h-4 w-4 flex-shrink-0" />
                      )}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
        
        {/* Settings at the bottom */}
        <div className="pt-4 border-t">
          <Link href={`/${locale}${settingsItem.href}`} onClick={onLinkClick}>
            <Button
              variant={pathname?.startsWith(`/${locale}${settingsItem.href}`) ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-10 px-3",
                pathname?.startsWith(`/${locale}${settingsItem.href}`) && "bg-secondary font-medium"
              )}
            >
              <Settings className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 text-left text-sm">{settingsItem.title}</span>
              {pathname?.startsWith(`/${locale}${settingsItem.href}`) && (
                <ChevronRight className="ml-auto h-4 w-4 flex-shrink-0" />
              )}
            </Button>
          </Link>
        </div>
      </nav>
    </ScrollArea>
  )
}
