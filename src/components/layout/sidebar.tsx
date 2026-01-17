"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useBusinesses } from "@/lib/hooks/use-business"
import { cn } from "@/lib/utils"
import { useAuthStore, useUIStore } from "@/store"
import { useQueryClient } from "@tanstack/react-query"
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Fuel,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Users
} from "lucide-react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { useMemo } from "react"

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

interface SidebarProps {
  isOpen?: boolean
}

// Module to sidebar item mapping
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

export function Sidebar({ isOpen = true }: SidebarProps) {
  const pathname = usePathname()
  const params = useParams()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale || "en"
  const { toggleSidebar } = useUIStore()
  const { user: storeUser, businesses: storeBusinesses } = useAuthStore()
  const { data: apiBusinesses, isLoading: isLoadingBusinesses } = useBusinesses()
  const queryClient = useQueryClient()

  // Use businesses from multiple sources in priority order:
  // 1. Zustand store (from login response)
  // 2. React Query cache (might have cached data)
  // 3. API response
  const businesses = useMemo(() => {
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
  }, [storeBusinesses, apiBusinesses, queryClient])

  // Get current business based on user's currentBusinessId
  const currentBusiness = useMemo(() => {
    if (!storeUser?.currentBusinessId || !businesses || businesses.length === 0) return null
    return businesses.find((b) => b.id === storeUser.currentBusinessId)
  }, [storeUser?.currentBusinessId, businesses])

  // Show loading state only if we're actively fetching AND have no businesses data at all
  // Don't show loading if we have cached data or store data
  const isLoading = isLoadingBusinesses && businesses.length === 0 && !storeBusinesses.length && !queryClient.getQueryData<any>(["businesses"])

  // Get enabled modules from current business
  const enabledModules = currentBusiness?.modules || []

  // Build sidebar sections based on enabled modules
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

  return (
    <aside
      className={cn(
        "hidden lg:flex lg:flex-col lg:border-r lg:bg-muted/40 transition-all duration-300 ease-in-out",
        isOpen ? "lg:w-64" : "lg:w-16"
      )}
    >
      <div className="flex h-14 items-center border-b px-3 lg:px-4">
        <div className="flex items-center justify-between w-full">
          {isOpen ? (
            <Link href={`/${locale}/dashboard`} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <span className="font-semibold whitespace-nowrap">Hamood ERP</span>
            </Link>
          ) : (
            <Link href={`/${locale}/dashboard`} className="flex items-center justify-center w-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LayoutDashboard className="h-5 w-5" />
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleSidebar}
          >
            {isOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <nav className={cn("space-y-6", isOpen ? "p-4" : "p-2")}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin mb-2 text-muted-foreground">⏳</div>
                {isOpen && (
                  <p className="text-xs text-muted-foreground">Loading modules...</p>
                )}
              </div>
            </div>
          ) : (
            navSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className={cn("space-y-2", sectionIndex > 0 && "mt-6")}>
                {section.title && isOpen && (
                  <div className="px-3 py-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </div>
                )}
                {!section.title && sectionIndex > 0 && isOpen && (
                  <div className="h-4" />
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const fullHref = `/${locale}${item.href}`
                    const isActive = pathname?.startsWith(fullHref)
                    
                    if (!isOpen) {
                      return (
                        <TooltipProvider key={item.href}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={fullHref} className="block">
                                <Button
                                  variant={isActive ? "secondary" : "ghost"}
                                  size="icon"
                                  className={cn(
                                    "w-full h-10",
                                    isActive && "bg-secondary font-medium"
                                  )}
                                >
                                  <Icon className="h-4 w-4" />
                                  <span className="sr-only">{item.title}</span>
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p>{item.title}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                    }

                    return (
                      <Link key={item.href} href={fullHref}>
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
            ))
          )}
        </nav>
      </ScrollArea>
      
      {/* Settings at the bottom - Fixed position */}
      <div className={cn("border-t", isOpen ? "p-4" : "p-2")}>
        {(() => {
          const SettingsIcon = settingsItem.icon
          const settingsHref = `/${locale}${settingsItem.href}`
          const isSettingsActive = pathname?.startsWith(settingsHref)
          
          if (!isOpen) {
            return (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={settingsHref} className="block">
                      <Button
                        variant={isSettingsActive ? "secondary" : "ghost"}
                        size="icon"
                        className={cn(
                          "w-full h-10",
                          isSettingsActive && "bg-secondary font-medium"
                        )}
                      >
                        <SettingsIcon className="h-4 w-4" />
                        <span className="sr-only">{settingsItem.title}</span>
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{settingsItem.title}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          }

          return (
            <Link href={settingsHref}>
              <Button
                variant={isSettingsActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10 px-3",
                  isSettingsActive && "bg-secondary font-medium"
                )}
              >
                <SettingsIcon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left text-sm">{settingsItem.title}</span>
                {isSettingsActive && (
                  <ChevronRight className="ml-auto h-4 w-4 flex-shrink-0" />
                )}
              </Button>
            </Link>
          )
        })()}
      </div>
    </aside>
  )
}
