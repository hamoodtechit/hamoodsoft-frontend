"use client"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BusinessSwitcher } from "@/components/common/business-switcher"
import { BranchSwitcher } from "@/components/common/branch-switcher"
import { useBusinesses } from "@/lib/hooks/use-business"
import { usePermissions } from "@/lib/providers/permissions-provider"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store"
import { useQueryClient } from "@tanstack/react-query"
import {
  BookOpen,
  Building2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  FolderTree,
  Fuel,
  LayoutDashboard,
  Package,
  Plus,
  Receipt,
  Ruler,
  Settings,
  Shield,
  ShoppingCart,
  UserPlus,
  Users,
  Wallet,
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
  requiredPermissions?: string[]
}

interface NavItemWithSubmenu extends NavItem {
  submenu?: NavItem[]
}

interface NavSection {
  title?: string
  items: (NavItem | NavItemWithSubmenu)[]
}

interface MobileSidebarContentProps {
  onLinkClick?: () => void
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
    requiredPermissions: ["sales:read"],
  }),
  'purchases': (t) => ({
    title: t("sidebar.purchase"),
    href: "/dashboard/purchase",
    icon: Package,
    requiredPermissions: ["purchases:read"],
  }),
  'accounting': (t) => ({
    title: t("sidebar.accounting"),
    href: "/dashboard/accounting",
    icon: BookOpen,
    requiredPermissions: ["accounts:read", "transactions:read", "payments:read"],
  }),
  'point-of-sale': (t) => ({
    title: t("sidebar.pointOfSale"),
    href: "/dashboard/point-of-sale",
    icon: CreditCard,
    requiredPermissions: ["pos:sessions:read"],
  }),
  'crm': (t) => ({
    title: t("sidebar.crm"),
    href: "/dashboard/crm",
    icon: Users,
    requiredPermissions: ["contacts:read"],
  }),
  'oil-filling-station': (t) => ({
    title: t("sidebar.oilFillingStation"),
    href: "/dashboard/oil-filling-station",
    icon: Fuel,
    requiredPermissions: ["fuel_types:read", "tankers:read", "dispensers:read", "dispenser_readings:read"],
  }),
}

export function MobileSidebarContent({ onLinkClick }: MobileSidebarContentProps = {}) {
  const t = useTranslations()
  const pathname = usePathname()
  const params = useParams()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale || "en"
  const { user: storeUser, businesses: storeBusinesses } = useAuthStore()
  const { data: apiBusinesses, isLoading: isLoadingBusinesses } = useBusinesses()
  const queryClient = useQueryClient()
  const { hasAnyPermission, isLoading: isLoadingPermissions } = usePermissions()
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    inventory: true,
    accounting: true,
    myBusiness: false,
  })

  // Use businesses from multiple sources
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

  const isOwner = currentBusiness?.ownerId === storeUser?.id

  const isLoading = isLoadingBusinesses && businesses.length === 0 && !storeBusinesses.length && !queryClient.getQueryData<any>(["businesses"])

  // Get enabled modules
  const enabledModules = currentBusiness?.modules || []

  // Permission-based visibility check
  const canSee = (requiredPermissions?: string[]): boolean => {
    // Owner sees everything
    if (isOwner) return true
    // No permissions required = always visible
    if (!requiredPermissions || requiredPermissions.length === 0) return true
    // While loading permissions, show items (they'll hide after load)
    if (isLoadingPermissions) return true
    return hasAnyPermission(requiredPermissions)
  }

  // Filter nav items by permission
  const filterByPermission = <T extends NavItem>(items: T[]): T[] => {
    return items.filter((item) => canSee(item.requiredPermissions))
  }

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
          requiredPermissions: ["products:read"],
        },
        {
          title: t("sidebar.stocks"),
          href: "/dashboard/stocks",
          icon: Package,
          requiredPermissions: ["stocks:read"],
        },
        {
          title: t("sidebar.categories"),
          href: "/dashboard/categories",
          icon: FolderTree,
          requiredPermissions: ["product_categories:read"],
        },
        {
          title: t("sidebar.unit"),
          href: "/dashboard/units",
          icon: Ruler,
          requiredPermissions: ["units:read"],
        },
        {
          title: t("sidebar.brands"),
          href: "/dashboard/brands",
          icon: Package,
          requiredPermissions: ["brands:read"],
        },
        {
          title: t("sidebar.attributes"),
          href: "/dashboard/attributes",
          icon: Package,
          requiredPermissions: ["attributes:read"],
        },
      ]

      // Filter submenu items by permission, only show parent if any child is visible
      const filteredSubmenu = filterByPermission(inventorySubmenu)
      if (filteredSubmenu.length > 0) {
        managementItems.push({
          title: t("sidebar.inventory"),
          href: "#",
          icon: Package,
          submenu: filteredSubmenu,
        })
      }
    }

    // Accounting
    if (enabledModules.includes('accounting')) {
      const accountingItem = {
        title: t("sidebar.accounts"),
        href: "/dashboard/accounting",
        icon: Wallet,
        requiredPermissions: ["accounts:read", "transactions:read", "payments:read"],
      }
      if (canSee(accountingItem.requiredPermissions)) {
        managementItems.push(accountingItem)
      }
    }

    // Other management modules
    const otherModules = ['sales', 'purchases', 'point-of-sale', 'crm']
    otherModules.forEach((moduleId) => {
      if (enabledModules.includes(moduleId)) {
        const item = moduleSidebarMap[moduleId](t)
        if (canSee(item.requiredPermissions)) {
          managementItems.push(item)
        }
      }
    })

    // My Business dropdown
    if (currentBusiness) {
      const myBusinessSubmenu: NavItem[] = [
        {
          title: t("sidebar.businessSettings"),
          href: "/dashboard/settings",
          icon: Settings,
          requiredPermissions: ["settings:read"],
        },
        {
          title: t("sidebar.rolesPermissions"),
          href: "/dashboard/roles",
          icon: Shield,
          requiredPermissions: ["roles:read"],
        },
        {
          title: t("sidebar.team"),
          href: "/dashboard/team",
          icon: UserPlus,
          requiredPermissions: ["user:manage"],
        },
        {
          title: t("sidebar.createBusiness"),
          href: "/register-business",
          icon: Plus,
          // Always visible — any user can create their own business
        },
        {
          title: t("sidebar.branches"),
          href: "/dashboard/branches",
          icon: Building2,
          requiredPermissions: ["branches:read"],
        },
      ]

      const filteredBusinessSubmenu = filterByPermission(myBusinessSubmenu)
      if (filteredBusinessSubmenu.length > 0) {
        managementItems.push({
          title: t("sidebar.myBusiness"),
          href: "#",
          icon: Building2,
          submenu: filteredBusinessSubmenu,
        })
      }
    }

    // Contacts (always available, not module-based) - appears after My Business dropdown
    const contactsItem: NavItem = {
      title: t("sidebar.contacts"),
      href: "/dashboard/contacts",
      icon: Users,
      requiredPermissions: ["contacts:read"],
    }
    if (canSee(contactsItem.requiredPermissions)) {
      managementItems.push(contactsItem)
    }

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
      .filter((item) => canSee(item.requiredPermissions))

    if (specialItems.length > 0) {
      sections.push({
        title: t("sidebar.modules"),
        items: specialItems,
      })
    }

    return sections
  }, [enabledModules, currentBusiness, isOwner, isLoadingPermissions])

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
                <Link key={subItem.href} href={subFullHref} onClick={onLinkClick}>
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
      <Link key={itemKey} href={fullHref} onClick={onLinkClick}>
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
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    requiredPermissions: ["settings:read"],
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
      <nav className="p-4 space-y-6">
        {/* Business & Branch Switchers — always visible on mobile */}
        <div className="space-y-2 pb-4 border-b border-slate-100 dark:border-slate-700">
          <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Workspace</p>
          <div className="flex flex-col gap-2 px-1">
            <BusinessSwitcher />
            <BranchSwitcher />
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="space-y-6">
          {navSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-2">
              {section.title && (
                <div className="px-3 py-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item, itemIndex) => {
                  const itemKey = `${sectionIndex}-${itemIndex}-${item.href}`
                  return renderNavItem(item, itemKey)
                })}
              </div>
            </div>
          ))}

          {/* Settings at the bottom — only if user has settings permission */}
          {canSee(settingsItem.requiredPermissions) && (
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
          )}
        </div>
      </nav>
    </ScrollArea>
  )
}
