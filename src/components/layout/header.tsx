"use client"

import { LanguageSwitcher } from "@/components/common/language-switcher"
import { ThemeToggle } from "@/components/common/theme-toggle"
import { Button } from "@/components/ui/button"
import { useLogout } from "@/lib/hooks/use-auth"
import { useAuthStore } from "@/store"
import { useTranslations } from "next-intl"
import Link from "next/link"

export function Header() {
  const t = useTranslations("auth")
  const { isAuthenticated } = useAuthStore()
  const logoutMutation = useLogout()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <h1 className="text-lg font-semibold">Hamood Tech</h1>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "..." : t("logout")}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  {t("signIn")}
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">{t("signUp")}</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
