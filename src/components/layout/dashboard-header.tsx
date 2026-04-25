"use client"

import { BranchSwitcher } from "@/components/common/branch-switcher"
import { BusinessSwitcher } from "@/components/common/business-switcher"
import { LanguageSwitcher } from "@/components/common/language-switcher"
import { SearchModal } from "@/components/common/search-modal"
import { ThemeToggle } from "@/components/common/theme-toggle"
import { POSSessionIndicator } from "@/components/pos/pos-session-indicator"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth, useLogout } from "@/lib/hooks/use-auth"
import { useAuthStore, useUIStore } from "@/store"
import { ChevronDown, Languages, Menu, Moon, Search, Sun, User } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useParams, usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { MobileSidebar } from "./mobile-sidebar"
import { NotificationPanel } from "./notification-panel"

export function DashboardHeader() {
  const t = useTranslations("auth")
  const tHeader = useTranslations("header")
  const tTheme = useTranslations("theme")
  const params = useParams()
  const currentLocale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale || "en"
  const { user } = useAuth()
  const { isAuthenticated } = useAuthStore()
  const { setLanguage } = useUIStore()
  const { setTheme } = useTheme()
  const logoutMutation = useLogout()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const switchLanguage = (newLocale: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setLanguage(newLocale as any)
    const segments = pathname.split("/")
    segments[1] = newLocale
    router.push(segments.join("/"))
  }

  const languages = [
    { code: "en", label: "English" },
    { code: "bn", label: "বাংলা" },
  ] as const

  return (
    <>
    <MobileSidebar open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen} />
    <header className="h-[76px] bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between px-4 sm:px-6 md:px-8 z-10 shrink-0 sticky top-0 transition-colors duration-300">
      
      {/* Mobile: Hamburger + Search Icon */}
      <div className="flex items-center gap-1 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          id="mobile-menu-button"
          aria-label="Open navigation menu"
          onClick={() => setMobileSidebarOpen(true)}
          className="text-slate-600 dark:text-slate-300"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} aria-label="Search">
          <Search className="w-5 h-5 text-slate-400" />
        </Button>
      </div>

      {/* Desktop: Full Search Bar */}
      <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-900/50 border border-transparent rounded-xl px-4 py-2.5 w-full max-w-md focus-within:ring-4 focus-within:ring-blue-50 dark:focus-within:ring-blue-900/30 focus-within:border-blue-200 dark:focus-within:border-blue-700 transition-all focus-within:bg-white dark:focus-within:bg-slate-900 shadow-inner dark:shadow-none cursor-text" onClick={() => setSearchOpen(true)}>
        <Search className="text-slate-400 mr-3 w-[18px] h-[18px]" />
        <input 
            type="text" 
            placeholder={tHeader("search") || "Search operations..."} 
            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-200 placeholder-slate-400 font-medium pointer-events-none"
            readOnly
        />
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
        
        {/* Switchers - Hidden on mobile (accessible via mobile sidebar) */}
        <div className="hidden md:flex items-center gap-2">
          <BusinessSwitcher />
          <BranchSwitcher />
          <POSSessionIndicator />
        </div>

        {/* Global Settings (Theme & Lang for desktop) */}
        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        {isAuthenticated && (
          <>
            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 p-2 rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                    <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center overflow-hidden border border-blue-100 dark:border-blue-800">
                        <User className="w-[18px] h-[18px]" />
                    </div>
                    <div className="hidden lg:flex flex-col text-left">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">
                          {user?.name || "User"}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Admin
                        </span>
                    </div>
                    <ChevronDown className="text-slate-400 w-4 h-4 hidden lg:block" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" sideOffset={5} alignOffset={-5}>
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name || tHeader("user")}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || ""}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/dashboard/profile`} className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>{tHeader("profileSettings")}</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                {/* Language Switcher - Show on small screens */}
                <div className="sm:hidden">
                  <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
                    {tHeader("language")}
                  </DropdownMenuLabel>
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => switchLanguage(lang.code)}
                      className={currentLocale === lang.code ? "bg-accent" : ""}
                    >
                      <Languages className="mr-2 h-4 w-4" />
                      {lang.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </div>
                {/* Theme Toggle - Show on small screens */}
                <div className="sm:hidden">
                  <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
                    {tHeader("theme")}
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="mr-2 h-4 w-4" />
                    {tTheme("light")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="mr-2 h-4 w-4" />
                    {tTheme("dark")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <span className="mr-2 h-4 w-4 flex items-center justify-center">⚙</span>
                    {tTheme("system")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </div>
                <DropdownMenuItem
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="text-destructive focus:text-destructive"
                >
                  {logoutMutation.isPending ? "..." : t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notification & Right Actions */}
            <div className="flex items-center gap-2 sm:gap-4 border-l border-slate-200 dark:border-slate-700/50 pl-2 sm:pl-6">
                {/* NotificationPanel logic currently contains its own trigger, 
                    we ideally want to wrap it or use its exact trigger.
                    Assuming NotificationPanel handles its own styling, we just render it here.
                    For exact identical UI, we can pass a custom trigger or style NotificationPanel.
                    But calling NotificationPanel directly is safer for existing logic.
                */}
                {/* <NotificationPanel /> */}
                

            </div>
          </>
        )}
      </div>

      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
    </>
  )
}
