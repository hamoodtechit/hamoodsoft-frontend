"use client"

import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { usePermissions } from "@/lib/providers/permissions-provider"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { useUIStore, useAuthStore } from "@/store"
import { cn } from "@/lib/utils"
import {
  BarChart2,
  Box,
  Building2,
  ChevronLeft,
  ChevronRight,
  Grid,
  Layers,
  LayoutDashboard,
  Settings,
  Users,
  Wallet
} from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export function Sidebar() {
  const pathname = usePathname()
  const params = useParams()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale || "en"
  const { toggleSidebar, sidebarOpen } = useUIStore()
  const { user } = useAuthStore()
  const t = useTranslations()
  const currentBusiness = useCurrentBusiness()
  const { hasAnyPermission, isLoading: isLoadingPermissions } = usePermissions()
  const { generalSettings } = useAppSettings()

  const isOwner = currentBusiness?.ownerId === user?.id

  const [currentHash, setCurrentHash] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentHash(window.location.hash)
      const handleHashChange = () => setCurrentHash(window.location.hash)
      window.addEventListener("hashchange", handleHashChange)
      return () => window.removeEventListener("hashchange", handleHashChange)
    }
  }, [])

  // Permission-based visibility check
  const canSee = (requiredPermissions?: string[]): boolean => {
    if (isOwner) return true
    if (!requiredPermissions || requiredPermissions.length === 0) return true
    if (isLoadingPermissions) return true
    return hasAnyPermission(requiredPermissions)
  }

  const navItems = [
    {
      id: "dashboard-top",
      title: t("sidebar.dashboard"),
      icon: LayoutDashboard,
      color: "text-blue-500",
      hash: "#dashboard-top",
      activePrefixes: [],
      requiredPermissions: [] as string[],
    },
    {
      id: "management-section",
      title: t("sidebar.management"),
      icon: Users,
      color: "text-cyan-400",
      hash: "#management-section",
      activePrefixes: ["/crm", "/contacts"],
      requiredPermissions: ["contacts:read"],
    },
    {
      id: "inventory-section",
      title: t("sidebar.inventory"),
      icon: Box,
      color: "text-emerald-400",
      hash: "#inventory-section",
      activePrefixes: ["/products", "/stocks", "/categories", "/units", "/brands", "/attributes", "/inventory"],
      requiredPermissions: ["products:read", "stocks:read", "units:read", "brands:read", "product_categories:read"],
    },
    {
      id: "accounting-section",
      title: t("sidebar.accounting"),
      icon: Wallet,
      color: "text-indigo-400",
      hash: "#accounting-section",
      activePrefixes: ["/accounting", "/sales", "/purchase", "/point-of-sale"],
      requiredPermissions: ["accounts:read", "transactions:read", "payments:read", "sales:read", "purchases:read", "pos:sessions:read"],
    },
    {
      id: "reports-section",
      title: t("sidebar.reports"),
      icon: BarChart2,
      color: "text-purple-400",
      hash: "#reports-section",
      activePrefixes: ["/reports", "/dashboard/reports/sales", "/dashboard/reports/purchases", "/dashboard/reports/income", "/dashboard/reports/expense"],
      requiredPermissions: ["reports:read"],
    },
    {
      id: "modules-section",
      title: t("sidebar.modules"),
      icon: Grid,
      color: "text-orange-400",
      hash: "#modules-section",
      activePrefixes: ["/oil-filling-station"],
      requiredPermissions: ["fuel_types:read", "tankers:read", "dispensers:read", "dispenser_readings:read"],
    },
    {
      id: "my-business-section",
      title: t("sidebar.myBusiness"),
      icon: Building2,
      color: "text-rose-400",
      hash: "#my-business-section",
      activePrefixes: ["/settings", "/roles", "/branches", "/team"],
      requiredPermissions: ["settings:read", "roles:read", "user:manage", "branches:read"],
    },
    {
      id: "settings-section",
      title: t("sidebar.settings"),
      icon: Settings,
      color: "text-slate-400",
      hash: "#settings-section",
      marginTop: true,
      activePrefixes: ["/settings"],
      requiredPermissions: ["settings:read"],
    },
  ]

  // Filter items by permission
  const visibleNavItems = navItems.filter((item) => canSee(item.requiredPermissions))

  // If we are on exactly `/dashboard`, we can just hash-link. 
  // If we are on `/dashboard/products`, we link to `/dashboard#inventory-section`.
  const isDashboardRoot = pathname === `/${locale}/dashboard` || pathname === `/dashboard`

  return (
    <aside
      id="sidebar"
      className={cn(
        "flex flex-col py-6 bg-white border-r dark:border-r-0 dark:bg-slate-800 z-20 shadow-xl transition-all duration-300 relative shrink-0",
        sidebarOpen ? "w-64 min-w-[256px]" : "w-[80px] min-w-[80px]"
      )}
    >
      {/* Sidebar Toggle Button */}
      <button
        id="sidebar-toggle"
        onClick={toggleSidebar}
        className="absolute -right-3.5 top-8 w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center shadow-md transition-colors z-50"
      >
        {sidebarOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {/* Logo */}
      <div className="mb-8 px-6 flex items-center gap-3">
        {generalSettings?.logoUrl ? (
          <img src={generalSettings.logoUrl} alt="Logo" className="w-8 h-8 rounded-full object-cover shrink-0 shadow-lg" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center shadow-lg shrink-0">
            <Layers className="text-white w-5 h-5 shrink-0" />
          </div>
        )}
        <span
          className={cn(
            "text-slate-900 dark:text-white font-bold text-base leading-tight tracking-wide line-clamp-2 transition-all duration-100",
            !sidebarOpen && "hidden"
          )}
          title={generalSettings?.companyName || currentBusiness?.name || "Patwary Pump"}
        >
          {generalSettings?.companyName || currentBusiness?.name || "Patwary Pump"}
        </span>
      </div>

      <nav className="flex flex-col gap-1 w-full pl-4 mt-4 flex-1 overflow-y-auto no-scrollbar" id="sidebar-nav">
        {visibleNavItems.map((item) => {
          const Icon = item.icon

          let isActuallyActive = false

          if (!isDashboardRoot) {
            // Check if current pathname matches any of the activePrefixes
            const subPath = pathname.replace(`/${locale}/dashboard`, "")
            isActuallyActive = item.activePrefixes?.some(p => subPath.startsWith(p)) || false
          } else {
            if (currentHash) {
              isActuallyActive = currentHash === item.hash
            } else {
              isActuallyActive = item.id === "dashboard-top"
            }
          }

          const href = isDashboardRoot ? item.hash : `/${locale}/dashboard${item.hash}`

          return (
            <Link
              key={item.id}
              href={href}
              className={cn(
                "nav-item flex items-center gap-4 px-4 py-3.5 rounded-l-2xl transition-colors cursor-pointer overflow-hidden",
                (item as any).marginTop && "mt-2",
                // Active State (bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white)
                // Inactive State (text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50)
                isActuallyActive
                  ? "bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50"
              )}
              onClick={() => {
                if (isDashboardRoot) {
                  // Smooth scroll manual trigger (optional, standard target hash handles it if css scroll-behavior smooth is set)
                  const targetEl = document.getElementById(item.id)
                  const mainScroll = document.getElementById("main-scroll")
                  if (targetEl && mainScroll) {
                    const scrollPos = targetEl.getBoundingClientRect().top + mainScroll.scrollTop - mainScroll.getBoundingClientRect().top
                    mainScroll.scrollTo({
                      top: scrollPos - 24,
                      behavior: "smooth",
                    })
                  }
                }
              }}
            >
              <Icon className={cn("w-5 h-5 shrink-0", item.color)} />
              <span
                className={cn(
                  "whitespace-nowrap transition-all duration-100",
                  isActuallyActive ? "font-semibold" : "font-medium",
                  "text-[15px]",
                  !sidebarOpen && "hidden"
                )}
              >
                {item.title}
              </span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

