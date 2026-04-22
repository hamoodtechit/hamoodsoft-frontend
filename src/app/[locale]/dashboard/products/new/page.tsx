"use client"

import { PageLayout } from "@/components/common/page-layout"
import { PermissionGuard } from "@/components/common/permission-guard"
import { ProductForm } from "@/components/products/product-form"
import { PERMISSIONS, MODULES } from "@/lib/utils/permissions"
import { useModuleAccessCheck } from "@/lib/hooks/use-permission-check"
import { SkeletonList } from "@/components/skeletons/skeleton-list"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"

export default function NewProductPage() {
  const t = useTranslations("products")
  const tModules = useTranslations("modulesPages.inventory")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string

  const { hasAccess, isLoading: isCheckingAccess } = useModuleAccessCheck(MODULES.INVENTORY)

  // Secure by module access (inventory)
  useEffect(() => {
    if (!isCheckingAccess && !hasAccess) {
      router.push(`/${locale}/dashboard`)
    }
  }, [hasAccess, isCheckingAccess, locale, router])

  // Show loading while checking permissions
  if (isCheckingAccess) {
    return (
      <PageLayout title={t("createProduct")} backHref="/dashboard/products" backLabel={t("title")}>
        <SkeletonList count={5} />
      </PageLayout>
    )
  }

  if (!hasAccess) {
    return (
      <PageLayout title={tModules("accessDenied")} description={tModules("noAccess")}>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{tModules("noAccessDescription")}</p>
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PermissionGuard permission={PERMISSIONS.PRODUCTS_CREATE}>
      <PageLayout
        title={t("createProduct")}
        description={t("createProductDescription")}
        backHref="/dashboard/products"
        backLabel={t("title")}
        maxWidth="full"
      >
        <ProductForm />
      </PageLayout>
    </PermissionGuard>
  )
}
