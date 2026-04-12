"use client"

import { useUIStore } from "@/store"
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
  const t = useTranslations()

  const [currentHash, setCurrentHash] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentHash(window.location.hash)
      const handleHashChange = () => setCurrentHash(window.location.hash)
      window.addEventListener("hashchange", handleHashChange)
      return () => window.removeEventListener("hashchange", handleHashChange)
    }
  }, [])

  const navItems = [
    {
      id: "dashboard-top",
      title: t("sidebar.dashboard"),
      icon: LayoutDashboard,
      color: "text-blue-500",
      hash: "#dashboard-top",
      activePrefixes: [],
    },
    {
      id: "management-section",
      title: t("sidebar.management"),
      icon: Users,
      color: "text-cyan-400",
      hash: "#management-section",
      activePrefixes: ["/crm", "/contacts"],
    },
    {
      id: "inventory-section",
      title: t("sidebar.inventory"),
      icon: Box,
      color: "text-emerald-400",
      hash: "#inventory-section",
      activePrefixes: ["/products", "/stocks", "/categories", "/units", "/brands", "/attributes", "/inventory"],
    },
    {
      id: "accounting-section",
      title: t("sidebar.accounting"),
      icon: Wallet,
      color: "text-indigo-400",
      hash: "#accounting-section",
      activePrefixes: ["/accounting", "/sales", "/purchase", "/point-of-sale"],
    },
    {
      id: "reports-section",
      title: "Reports", // Keeping literal if no translation key
      icon: BarChart2,
      color: "text-purple-400",
      hash: "#reports-section",
      activePrefixes: ["/reports"],
    },
    {
      id: "modules-section",
      title: t("sidebar.modules"),
      icon: Grid,
      color: "text-orange-400",
      hash: "#modules-section",
      activePrefixes: ["/oil-filling-station"],
    },
    {
      id: "my-business-section",
      title: t("sidebar.myBusiness"),
      icon: Building2,
      color: "text-rose-400",
      hash: "#my-business-section",
      activePrefixes: ["/settings", "/roles", "/branches"],
    },
    {
      id: "settings-section",
      title: t("sidebar.settings"),
      icon: Settings,
      color: "text-slate-400",
      hash: "#settings-section",
      marginTop: true,
      activePrefixes: ["/settings"],
    },
  ]

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
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center shadow-lg shrink-0">
          <Layers className="text-white w-5 h-5 shrink-0" />
        </div>
        <span
          className={cn(
            "text-slate-900 dark:text-white font-bold text-xl tracking-wide whitespace-nowrap overflow-hidden transition-all duration-100",
            !sidebarOpen && "hidden"
          )}
        >
          Hamood ERP
        </span>
      </div>

      <nav className="flex flex-col gap-1 w-full pl-4 mt-4 flex-1 overflow-y-auto no-scrollbar" id="sidebar-nav">
        {navItems.map((item) => {
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
                item.marginTop && "mt-2",
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
