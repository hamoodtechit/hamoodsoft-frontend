"use client"

import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { cn } from "@/lib/utils"
import {
  ArrowRight,
  BarChart3,
  Building2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  FileText,
  FolderTree,
  Package,
  Receipt,
  Ruler,
  Settings,
  Shield,
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
  Wallet
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

interface DashboardItem {
  id: string
  title: string
  href: string
  icon: any
  color: string
  bgColor: string
  enabled: boolean
  category?: string
}

export default function DashboardPage() {
  const t = useTranslations()
  const router = useRouter()
  const params = useParams()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale || "en"
  const currentBusiness = useCurrentBusiness()
  const enabledModules = currentBusiness?.modules || []
  
  // State for "See More" functionality
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  
  // Items to show initially per category
  const initialItemsToShow: Record<string, number> = {
    main: 4,
    inventory: 6,
    accounting: 2,
    business: 3,
    modules: 2,
  }

  // Define all dashboard items with colors
  const allItems: DashboardItem[] = [
    // Main modules
    {
      id: "point-of-sale",
      title: t("sidebar.pointOfSale"),
      href: "/dashboard/point-of-sale",
      icon: CreditCard,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      enabled: enabledModules.includes("point-of-sale"),
      category: "main",
    },
    {
      id: "sales",
      title: t("sidebar.sales"),
      href: "/dashboard/sales",
      icon: ShoppingCart,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      enabled: enabledModules.includes("sales"),
      category: "main",
    },
    {
      id: "purchase",
      title: t("sidebar.purchase"),
      href: "/dashboard/purchase",
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      enabled: enabledModules.includes("purchases"),
      category: "main",
    },
    {
      id: "contacts",
      title: t("sidebar.contacts"),
      href: "/dashboard/contacts",
      icon: Users,
      color: "text-pink-600",
      bgColor: "bg-pink-50 dark:bg-pink-950/20",
      enabled: true, // Always available
      category: "main",
    },
    // Inventory submenu items
    {
      id: "products",
      title: t("sidebar.products"),
      href: "/dashboard/products",
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      enabled: enabledModules.includes("inventory"),
      category: "inventory",
    },
    {
      id: "stocks",
      title: t("sidebar.stocks"),
      href: "/dashboard/stocks",
      icon: Store,
      color: "text-teal-600",
      bgColor: "bg-teal-50 dark:bg-teal-950/20",
      enabled: enabledModules.includes("inventory"),
      category: "inventory",
    },
    {
      id: "categories",
      title: t("sidebar.categories"),
      href: "/dashboard/categories",
      icon: FolderTree,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
      enabled: enabledModules.includes("inventory"),
      category: "inventory",
    },
    {
      id: "brands",
      title: t("sidebar.brands"),
      href: "/dashboard/brands",
      icon: FileText,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
      enabled: enabledModules.includes("inventory"),
      category: "inventory",
    },
    {
      id: "units",
      title: t("sidebar.unit"),
      href: "/dashboard/units",
      icon: Ruler,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
      enabled: enabledModules.includes("inventory"),
      category: "inventory",
    },
    {
      id: "attributes",
      title: t("sidebar.attributes"),
      href: "/dashboard/attributes",
      icon: BarChart3,
      color: "text-rose-600",
      bgColor: "bg-rose-50 dark:bg-rose-950/20",
      enabled: enabledModules.includes("inventory"),
      category: "inventory",
    },
    // Accounting submenu items
    {
      id: "accounts",
      title: t("sidebar.accounts"),
      href: "/dashboard/accounting",
      icon: Wallet,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      enabled: enabledModules.includes("accounting"),
      category: "accounting",
    },
    {
      id: "transactions",
      title: t("sidebar.transactions"),
      href: "/dashboard/transactions",
      icon: Receipt,
      color: "text-violet-600",
      bgColor: "bg-violet-50 dark:bg-violet-950/20",
      enabled: enabledModules.includes("accounting"),
      category: "accounting",
    },
    // Business management
    {
      id: "branches",
      title: t("sidebar.branches"),
      href: "/dashboard/branches",
      icon: Building2,
      color: "text-slate-600",
      bgColor: "bg-slate-50 dark:bg-slate-950/20",
      enabled: true, // Always available
      category: "business",
    },
    {
      id: "settings",
      title: t("sidebar.businessSettings"),
      href: "/dashboard/settings",
      icon: Settings,
      color: "text-gray-600",
      bgColor: "bg-gray-50 dark:bg-gray-950/20",
      enabled: true, // Always available
      category: "business",
    },
    {
      id: "roles",
      title: t("sidebar.rolesPermissions"),
      href: "/dashboard/roles",
      icon: Shield,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      enabled: true, // Always available
      category: "business",
    },
    // Special modules
    {
      id: "oil-filling-station",
      title: t("sidebar.oilFillingStation"),
      href: "/dashboard/oil-filling-station",
      icon: TrendingUp,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      enabled: enabledModules.includes("oil-filling-station"),
      category: "modules",
    },
    {
      id: "crm",
      title: t("sidebar.crm"),
      href: "/dashboard/crm",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      enabled: enabledModules.includes("crm"),
      category: "modules",
    },
  ]

  // Filter enabled items
  const enabledItems = allItems.filter((item) => item.enabled)

  // Group items by category
  const groupedItems = enabledItems.reduce(
    (acc, item) => {
      const category = item.category || "other"
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(item)
      return acc
    },
    {} as Record<string, DashboardItem[]>
  )

  const handleItemClick = (href: string) => {
    router.push(`/${locale}${href}`)
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  const renderCategoryGrid = (
    items: DashboardItem[],
    category: string,
    title: string,
    gridCols: string = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
  ) => {
    const isExpanded = expandedCategories[category] || false
    const initialCount = initialItemsToShow[category] || items.length
    const itemsToShow = isExpanded ? items : items.slice(0, initialCount)
    const hasMore = items.length > initialCount

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          {hasMore && (
            <button
              onClick={() => toggleCategory(category)}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  See Less
                </>
              ) : (
                <>
                  See More
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
        <div className={cn("grid gap-4", gridCols)}>
          {itemsToShow.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.href)}
                className={cn(
                  "group relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-transparent p-6 transition-all duration-200",
                  "hover:scale-105 hover:shadow-lg",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2",
                  item.bgColor,
                  "hover:border-current/20"
                )}
              >
                <div
                  className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110",
                    item.bgColor,
                    "border-2 border-current/20"
                  )}
                >
                  <Icon className={cn("h-8 w-8", item.color)} />
                </div>
                <span className="text-sm font-medium text-foreground">{item.title}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("sidebar.dashboard")}</h1>
        <p className="text-muted-foreground">
          {currentBusiness?.name
            ? `Welcome to ${currentBusiness.name}! Manage your business operations.`
            : "Welcome back! Here's what's happening with your business today."}
        </p>
      </div>

      {/* Main Modules Grid */}
      {groupedItems.main && groupedItems.main.length > 0 &&
        renderCategoryGrid(groupedItems.main, "main", t("sidebar.management"))
      }

      {/* Inventory Grid */}
      {groupedItems.inventory && groupedItems.inventory.length > 0 &&
        renderCategoryGrid(groupedItems.inventory, "inventory", t("sidebar.inventory"), "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6")
      }

      {/* Accounting Grid */}
      {groupedItems.accounting && groupedItems.accounting.length > 0 &&
        renderCategoryGrid(groupedItems.accounting, "accounting", t("sidebar.accounting"))
      }

      {/* Business Management Grid */}
      {groupedItems.business && groupedItems.business.length > 0 &&
        renderCategoryGrid(groupedItems.business, "business", t("sidebar.myBusiness"))
      }

      {/* Special Modules Grid */}
      {groupedItems.modules && groupedItems.modules.length > 0 &&
        renderCategoryGrid(groupedItems.modules, "modules", t("sidebar.modules"))
      }

      {/* Empty State */}
      {enabledItems.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Package className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No modules enabled</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Please enable modules in your business settings to get started.
          </p>
          <button
            onClick={() => handleItemClick("/dashboard/settings")}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to Settings
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
