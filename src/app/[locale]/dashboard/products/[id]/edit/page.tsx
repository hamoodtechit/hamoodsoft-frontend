"use client"

import { PageLayout } from "@/components/common/page-layout"
import { PermissionGuard } from "@/components/common/permission-guard"
import { ProductForm } from "@/components/products/product-form"
import { SkeletonList } from "@/components/skeletons/skeleton-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useProduct } from "@/lib/hooks/use-products"
import { useModuleAccessCheck } from "@/lib/hooks/use-permission-check"
import { PERMISSIONS, MODULES } from "@/lib/utils/permissions"
import { ArrowLeft } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"

export default function EditProductPage() {
  const t = useTranslations("products")
  const tCommon = useTranslations("common")
  const tModules = useTranslations("modulesPages.inventory")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const productId = params.id as string

  const { data: product, isLoading } = useProduct(productId)
  const { hasAccess, isLoading: isCheckingAccess } = useModuleAccessCheck(MODULES.INVENTORY)

  // Secure by module access (inventory)
  useEffect(() => {
    if (!isCheckingAccess && !hasAccess) {
      router.push(`/${locale}/dashboard`)
    }
  }, [hasAccess, isCheckingAccess, locale, router])

  // Show loading while checking permissions
  if (isCheckingAccess || isLoading) {
    return (
      <PageLayout title={t("editProduct")} backHref="/dashboard/products" backLabel={t("title")}>
        <SkeletonList count={8} />
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

  if (!product) {
    return (
      <PageLayout title={t("productDetails") || "Product Details"}>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">{t("productNotFound") || "Product not found"}</p>
            <Button
              variant="outline"
              onClick={() => router.push(`/${locale}/dashboard/products`)}
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tCommon("back") || "Back to Products"}
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PermissionGuard permission={PERMISSIONS.PRODUCTS_UPDATE}>
      <PageLayout
        title={t("editProduct")}
        description={t("editProductDescription")}
        backHref="/dashboard/products"
        backLabel={t("title")}
        maxWidth="full"
      >
        <ProductForm product={product} />
      </PageLayout>
    </PermissionGuard>
  )
}
