"use client"

import { Header } from "@/components/layout/header"
import { useTranslations } from "next-intl"
import { useAuthStore } from "@/store"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

export default function HomePage() {
  const t = useTranslations("common")
  const { isAuthenticated } = useAuthStore()
  const params = useParams()
  const router = useRouter()
  const locale = params?.locale || "en"

  useEffect(() => {
    if (isAuthenticated) {
      router.push(`/${locale}/dashboard`)
    }
  }, [isAuthenticated, locale, router])

  return (
    <div className="min-h-screen">
      <Header />
      <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-24">
        <div className="text-center space-y-6 max-w-2xl">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-4 shadow-lg">
            <Sparkles className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight">{t("welcome")}</h1>
          <p className="text-xl text-muted-foreground">
            Welcome to Hamood ERP - Your Complete Business Management Solution
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link href={`/${locale}/login`}>
              <Button size="lg" className="gap-2">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href={`/${locale}/register`}>
              <Button size="lg" variant="outline">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
