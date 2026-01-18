"use client"

import { BusinessSwitcher } from "@/components/common/business-switcher"
import { LanguageSwitcher } from "@/components/common/language-switcher"
import { SearchModal } from "@/components/common/search-modal"
import { ThemeToggle } from "@/components/common/theme-toggle"
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
import { Building2, Languages, Menu, Moon, Plus, Search, Sun, User } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useParams, usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { NotificationPanel } from "./notification-panel"

interface DashboardHeaderProps {
  onMenuClick?: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const t = useTranslations("auth")
  const params = useParams()
  const currentLocale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale || "en"
  const { user } = useAuth()
  const { isAuthenticated } = useAuthStore()
  const { sidebarOpen, toggleSidebar, setLanguage } = useUIStore()
  const { setTheme, theme } = useTheme()
  const logoutMutation = useLogout()
  const [searchOpen, setSearchOpen] = useState(false)

  const switchLanguage = (newLocale: string) => {
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-3 px-4 lg:gap-4 lg:px-6">
        {/* Left Side: Menu Toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden -ml-1"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>

          {/* Desktop Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md mx-2 sm:mx-4 min-w-0">
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground hover:text-foreground h-9 px-2 sm:px-3"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="mr-1 sm:mr-2 h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline truncate">Search...</span>
            <span className="sm:hidden">Search</span>
          </Button>
        </div>

        {/* Right Side Actions - Properly aligned to the right */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-auto">
          {/* Hide Business Switcher on very small screens */}
          <div className="hidden min-[400px]:block">
            <BusinessSwitcher />
          </div>
          {/* Create New Business Button - Hide text on small screens */}
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-1 sm:gap-2 h-9 px-2 sm:px-3"
          >
            <Link href={`/${locale}/register-business`}>
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline">Create Business</span>
            </Link>
          </Button>
          {/* Show language switcher and theme toggle on larger screens */}
          <div className="hidden sm:flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          
          {/* Notifications */}
          <NotificationPanel />

          {/* User Menu */}
          {isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" sideOffset={5} alignOffset={-5}>
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name || "User"}
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
                      <span>Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {/* Language Switcher - Show on small screens */}
                  <div className="sm:hidden">
                    <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
                      Language
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
                      Theme
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      <Sun className="mr-2 h-4 w-4" />
                      Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      <Moon className="mr-2 h-4 w-4" />
                      Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
                      <span className="mr-2 h-4 w-4 flex items-center justify-center">⚙</span>
                      System
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
          )}
        </div>
      </div>
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  )
}
