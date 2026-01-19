"use client"

import { PageLayout } from "@/components/common/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/hooks/use-auth"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { ShoppingCart } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect } from "react"

export default function SalesPage() {
  const t = useTranslations("modulesPages.sales")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const { user } = useAuth()
  const currentBusiness = useCurrentBusiness()

  // Check if user has access to sales module
  useEffect(() => {
    if (currentBusiness && !currentBusiness.modules?.includes("sales")) {
      router.push(`/${locale}/dashboard`)
    }
  }, [currentBusiness, locale, router])

  if (!currentBusiness?.modules?.includes("sales")) {
    return (
      <PageLayout title={t("accessDenied")} description={t("noAccess")}>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              {t("noAccessDescription")}
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={t("title")}
      description={t("description")}
      maxWidth="full"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>{t("cardTitle")}</CardTitle>
              <CardDescription>
                {t("cardDescription")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {t("pageDescription")}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>{t("createOrders")}</li>
              <li>{t("trackPerformance")}</li>
              <li>{t("manageCustomers")}</li>
              <li>{t("handleInvoices")}</li>
              <li>{t("generateReports")}</li>
            </ul>
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>{t("placeholderNote").split(":")[0]}:</strong> {t("placeholderNote").split(":")[1]}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  )
}
