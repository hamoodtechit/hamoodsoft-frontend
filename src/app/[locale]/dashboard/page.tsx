"use client"

import { DraggableDashboardCard } from "@/components/common/draggable-dashboard-card"
import { DashboardSkeletonGrid } from "@/components/skeletons/dashboard-card-skeleton"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
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
  Ruler,
  Settings,
  Shield,
  ShoppingCart,
  Store,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

interface DashboardItem {
  id: string
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  enabled: boolean
  category?: string
  order?: number
}

const STORAGE_KEY = "dashboard-item-order"

export default function DashboardPage() {
  const t = useTranslations()
  const router = useRouter()
  const params = useParams()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale || "en"
  const currentBusiness = useCurrentBusiness()
  const enabledModules = currentBusiness?.modules || []
  const [isLoading, setIsLoading] = useState(true)
  
  // State for "See More" functionality
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  
  // Load saved order from localStorage
  const [savedOrder, setSavedOrder] = useState<Record<string, string[]>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  })

  // Items to show initially per category
  const initialItemsToShow: Record<string, number> = {
    main: 4,
    inventory: 6,
    accounting: 999, // Show all accounting items (no "See More" button)
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
      id: "income",
      title: t("sidebar.income") || "Income",
      href: "/dashboard/income",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      enabled: enabledModules.includes("accounting"),
      category: "accounting",
    },
    {
      id: "expense",
      title: t("sidebar.expense") || "Expense",
      href: "/dashboard/expense",
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
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

  // Apply saved order to items
  const orderedItems = useMemo(() => {
    return enabledItems.map((item) => {
      const category = item.category || "other"
      const categoryOrder = savedOrder[category] || []
      const orderIndex = categoryOrder.indexOf(item.id)
      return {
        ...item,
        order: orderIndex >= 0 ? orderIndex : Infinity,
      }
    })
  }, [enabledItems, savedOrder])

  // Group items by category and sort by order
  const groupedItems = useMemo(() => {
    const grouped = orderedItems.reduce(
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

    // Sort each category by order
    Object.keys(grouped).forEach((category) => {
      grouped[category].sort((a, b) => {
        const orderA = a.order ?? Infinity
        const orderB = b.order ?? Infinity
        return orderA - orderB
      })
    })

    return grouped
  }, [orderedItems])

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent, category: string) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const items = groupedItems[category] || []
    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newItems = arrayMove(items, oldIndex, newIndex)
    const newOrder = newItems.map((item) => item.id)

    // Update saved order
    const updatedOrder = {
      ...savedOrder,
      [category]: newOrder,
    }
    setSavedOrder(updatedOrder)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrder))
  }

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
    title: string
  ) => {
    const isExpanded = expandedCategories[category] || false
    const initialCount = initialItemsToShow[category] || items.length
    const itemsToShow = isExpanded ? items : items.slice(0, initialCount)
    const hasMore = items.length > initialCount

    if (itemsToShow.length === 0) return null

    const itemIds = itemsToShow.map((item) => item.id)

    return (
      <div 
        id={`${category}-section`}
        className="mb-8 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-100/60 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">{title}</h3>
          {hasMore && (
            <button
              onClick={() => toggleCategory(category)}
              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline transition-colors"
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
        {isLoading ? (
          <DashboardSkeletonGrid count={itemsToShow.length} />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => handleDragEnd(event, category)}
          >
            <SortableContext items={itemIds} strategy={rectSortingStrategy}>
              <div className="flex flex-wrap gap-x-8 gap-y-10 md:gap-x-12">
                {itemsToShow.map((item) => {
                  const Icon = item.icon
                  return (
                    <DraggableDashboardCard
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      href={item.href}
                      icon={Icon}
                      color={item.color}
                      bgColor={item.bgColor}
                      onClick={() => handleItemClick(item.href)}
                    />
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full space-y-6 pb-10">
      {/* Header Text */}
      <div className="mb-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4" id="dashboard-top">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight transition-colors">
            {t("sidebar.dashboard")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium transition-colors">
            {currentBusiness?.name
              ? `Welcome to ${currentBusiness.name}! Manage your business operations.`
              : "Welcome back! Here's what's happening with your business today."}
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-300 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          System Online
        </div>
      </div>

      {/* Main Modules Grid */}
      {groupedItems.main && groupedItems.main.length > 0 &&
        renderCategoryGrid(groupedItems.main, "management", t("sidebar.management"))
      }

      {/* Inventory Grid */}
      {groupedItems.inventory && groupedItems.inventory.length > 0 &&
        renderCategoryGrid(groupedItems.inventory, "inventory", t("sidebar.inventory"))
      }

      {/* Accounting Grid */}
      {groupedItems.accounting && groupedItems.accounting.length > 0 &&
        renderCategoryGrid(groupedItems.accounting, "accounting", t("sidebar.accounting"))
      }

      {/* Business Management Grid */}
      {groupedItems.business && groupedItems.business.length > 0 &&
        renderCategoryGrid(groupedItems.business, "my-business", t("sidebar.myBusiness"))
      }

      {/* Special Modules Grid */}
      {groupedItems.modules && groupedItems.modules.length > 0 &&
        renderCategoryGrid(groupedItems.modules, "modules", t("sidebar.modules"))
      }

      {/* Empty State */}
      {!isLoading && enabledItems.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 sm:p-12 text-center">
          <Package className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No modules enabled</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Please enable modules in your business settings to get started.
          </p>
          <button
            onClick={() => handleItemClick("/dashboard/settings")}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Go to Settings
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

    </div>
  )
}
