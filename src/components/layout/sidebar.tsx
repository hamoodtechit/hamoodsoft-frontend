"use client"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useBusinesses } from "@/lib/hooks/use-business"
import { cn } from "@/lib/utils"
import { useAuthStore, useUIStore } from "@/store"
import { useQueryClient } from "@tanstack/react-query"
import {
    BookOpen,
    Building2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    FolderTree,
    Fuel,
    LayoutDashboard,
    Package,
    Plus,
    Ruler,
    Settings,
    Shield,
    ShoppingCart,
    Users,
} from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { useMemo, useState } from "react"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

interface NavItemWithSubmenu extends NavItem {
  submenu?: NavItem[]
}

interface NavSection {
  title?: string
  items: (NavItem | NavItemWithSubmenu)[]
}

interface SidebarProps {
  isOpen?: boolean
}

// Module to sidebar item mapping - will be translated in component
const moduleSidebarMap: Record<string, (t: any) => NavItem> = {
  'inventory': (t) => ({
    title: t("sidebar.inventory"),
    href: "/dashboard/inventory",
    icon: Package,
  }),
  'sales': (t) => ({
    title: t("sidebar.sales"),
    href: "/dashboard/sales",
    icon: ShoppingCart,
  }),
  'purchases': (t) => ({
    title: t("sidebar.purchase"),
    href: "/dashboard/purchase",
    icon: Package,
  }),
  'accounting': (t) => ({
    title: t("sidebar.accounting"),
    href: "/dashboard/accounting",
    icon: BookOpen,
  }),
  'point-of-sale': (t) => ({
    title: t("sidebar.pointOfSale"),
    href: "/dashboard/point-of-sale",
    icon: CreditCard,
  }),
  'crm': (t) => ({
    title: t("sidebar.crm"),
    href: "/dashboard/crm",
    icon: Users,
  }),
  'oil-filling-station': (t) => ({
    title: t("sidebar.oilFillingStation"),
    href: "/dashboard/oil-filling-station",
    icon: Fuel,
  }),
}

export function Sidebar({ isOpen = true }: SidebarProps) {
  const pathname = usePathname()
  const params = useParams()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale || "en"
  const { toggleSidebar } = useUIStore()
  const { user: storeUser, businesses: storeBusinesses } = useAuthStore()
  const { data: apiBusinesses, isLoading: isLoadingBusinesses } = useBusinesses()
  const t = useTranslations()
  const queryClient = useQueryClient()
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    inventory: true,
    myBusiness: false,
  })

  // Use businesses from multiple sources in priority order
  const businesses = useMemo(() => {
    if (storeBusinesses.length > 0) return storeBusinesses
    const cachedBusinesses = queryClient.getQueryData<any>(["businesses"])
    if (cachedBusinesses && Array.isArray(cachedBusinesses) && cachedBusinesses.length > 0) {
      return cachedBusinesses
    }
    if (apiBusinesses && apiBusinesses.length > 0) return apiBusinesses
    return []
  }, [storeBusinesses, apiBusinesses, queryClient])

  // Get current business
  const currentBusiness = useMemo(() => {
    if (!storeUser?.currentBusinessId || !businesses || businesses.length === 0) return null
    return businesses.find((b) => b.id === storeUser.currentBusinessId)
  }, [storeUser?.currentBusinessId, businesses])

  const isLoading = isLoadingBusinesses && businesses.length === 0 && !storeBusinesses.length && !queryClient.getQueryData<any>(["businesses"])

  // Get enabled modules from current business
  const enabledModules = currentBusiness?.modules || []

  // Build sidebar sections
  const navSections: NavSection[] = useMemo(() => {
    const sections: NavSection[] = [
      {
        items: [
          {
            title: t("sidebar.dashboard"),
            href: "/dashboard",
            icon: LayoutDashboard,
          },
        ],
      },
    ]

    // Management modules
    const managementItems: (NavItem | NavItemWithSubmenu)[] = []
    
    // Inventory with submenu (no main page, only submenu items)
    if (enabledModules.includes('inventory')) {
      const inventorySubmenu: NavItem[] = [
        {
          title: t("sidebar.products"),
          href: "/dashboard/products",
          icon: Package,
        },
        {
          title: t("sidebar.stocks"),
          href: "/dashboard/stocks",
          icon: Package,
        },
        {
          title: t("sidebar.categories"),
          href: "/dashboard/categories",
          icon: FolderTree,
        },
        {
          title: t("sidebar.unit"),
          href: "/dashboard/units",
          icon: Ruler,
        },
        {
          title: t("sidebar.brands"),
          href: "/dashboard/brands",
          icon: Package,
        },
        {
          title: t("sidebar.attributes"),
          href: "/dashboard/attributes",
          icon: Package,
        },
      ]
      managementItems.push({
        title: t("sidebar.inventory"),
        href: "#",
        icon: Package,
        submenu: inventorySubmenu,
      })
    }

    // Other management modules
    const otherModules = ['sales', 'purchases', 'accounting', 'point-of-sale', 'crm']
    otherModules.forEach((moduleId) => {
      if (enabledModules.includes(moduleId)) {
        managementItems.push(moduleSidebarMap[moduleId](t))
      }
    })

    // My Business dropdown (always available when user has a business)
    if (currentBusiness) {
      const myBusinessSubmenu: NavItem[] = [
        {
          title: t("sidebar.businessSettings"),
          href: "/dashboard/settings",
          icon: Settings,
        },
        {
          title: t("sidebar.rolesPermissions"),
          href: "/dashboard/roles",
          icon: Shield,
        },
        {
          title: t("sidebar.createBusiness"),
          href: "/register-business",
          icon: Plus,
        },
        {
          title: t("sidebar.branches"),
          href: "/dashboard/branches",
          icon: Building2,
        },
      ]
      managementItems.push({
        title: t("sidebar.myBusiness"),
        href: "#",
        icon: Building2,
        submenu: myBusinessSubmenu,
      })
    }

    // Contacts (always available, not module-based) - appears after My Business dropdown
    managementItems.push({
      title: t("sidebar.contacts"),
      href: "/dashboard/contacts",
      icon: Users,
    })

    if (managementItems.length > 0) {
      sections.push({
        title: t("sidebar.management"),
        items: managementItems,
      })
    }

    // Special modules
    const specialModules = ['oil-filling-station']
    const specialItems = specialModules
      .filter((moduleId) => enabledModules.includes(moduleId))
      .map((moduleId) => moduleSidebarMap[moduleId](t))
      .filter(Boolean)

    if (specialItems.length > 0) {
      sections.push({
        title: t("sidebar.modules"),
        items: specialItems,
      })
    }

    return sections
  }, [enabledModules, currentBusiness])

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const renderNavItem = (item: NavItem | NavItemWithSubmenu, itemKey: string) => {
    const Icon = item.icon
    const fullHref = item.href === "#" ? "#" : `/${locale}${item.href}`
    const isActive = item.href !== "#" && pathname?.startsWith(fullHref)
    const hasSubmenu = 'submenu' in item && item.submenu && item.submenu.length > 0
    const isSubmenuOpen = openSubmenus[itemKey] || false

    // Check if any submenu item is active
    const isSubmenuActive = hasSubmenu && item.submenu?.some(
      (subItem) => pathname?.startsWith(`/${locale}${subItem.href}`)
    )

    if (!isOpen) {
      // Collapsed sidebar - show tooltip
      if (hasSubmenu) {
        return (
          <TooltipProvider key={itemKey}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isSubmenuActive ? "secondary" : "ghost"}
                  size="icon"
                  className={cn(
                    "w-full h-10",
                    isSubmenuActive && "bg-secondary font-medium"
                  )}
                  onClick={() => toggleSubmenu(itemKey)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="sr-only">{item.title}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.title}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      }

      return (
        <TooltipProvider key={itemKey}>
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

    // Expanded sidebar
    if (hasSubmenu) {
      return (
        <Collapsible
          key={itemKey}
          open={isSubmenuOpen}
          onOpenChange={() => toggleSubmenu(itemKey)}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant={isSubmenuActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-between gap-3 h-10 px-3",
                isSubmenuActive && "bg-secondary font-medium"
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left text-sm">{item.title}</span>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  isSubmenuOpen && "transform rotate-180"
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1 ml-4">
            {item.submenu?.map((subItem) => {
              const SubIcon = subItem.icon
              const subFullHref = `/${locale}${subItem.href}`
              const isSubActive = pathname?.startsWith(subFullHref)
              
              return (
                <Link key={subItem.href} href={subFullHref}>
                  <Button
                    variant={isSubActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-9 px-3 text-sm",
                      isSubActive && "bg-secondary font-medium"
                    )}
                  >
                    <SubIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 text-left">{subItem.title}</span>
                  </Button>
                </Link>
              )
            })}
          </CollapsibleContent>
        </Collapsible>
      )
    }

    // Regular item without submenu
    return (
      <Link key={itemKey} href={fullHref}>
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
  }

  // Settings menu item
  const settingsItem: NavItem = {
    title: t("sidebar.settings"),
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
                  {section.items.map((item, itemIndex) => {
                    const itemKey = `${sectionIndex}-${itemIndex}-${item.href}`
                    return renderNavItem(item, itemKey)
                  })}
                </div>
              </div>
            ))
          )}
        </nav>
      </ScrollArea>
      
      {/* Settings at the bottom */}
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
