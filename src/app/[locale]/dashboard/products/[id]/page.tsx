"use client"

import { PageLayout } from "@/components/common/page-layout"
import { SkeletonList } from "@/components/skeletons/skeleton-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useBranches } from "@/lib/hooks/use-branches"
import { useProduct } from "@/lib/hooks/use-products"
import { ArrowLeft, Edit, Package } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useMemo, useState } from "react"

type TabType = "overview" | "variants" | "stock"

export default function ProductDetailsPage() {
  const t = useTranslations("products")
  const tCommon = useTranslations("common")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const productId = params.id as string

  const { data: product, isLoading } = useProduct(productId)
  const { data: branches } = useBranches()
  const [activeTab, setActiveTab] = useState<TabType>("overview")

  // Create branch map for quick lookup
  const branchMap = useMemo(() => {
    const map = new Map()
    if (branches) {
      branches.forEach((branch) => {
        map.set(branch.id, branch)
      })
    }
    return map
  }, [branches])

  const tabs: { id: TabType; label: string }[] = [
    { id: "overview", label: t("overview") || "Overview" },
    { id: "variants", label: t("variants") || "Variants" },
    { id: "stock", label: t("stock") || "Stock" },
  ]

  if (isLoading) {
    return (
      <PageLayout title={t("productDetails") || "Product Details"}>
        <SkeletonList count={8} />
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
    <PageLayout title={product.name} description={product.description || undefined} maxWidth="full">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${locale}/dashboard/products`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {tCommon("back") || "Back"}
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => {
            router.push(`/${locale}/dashboard/products?edit=${product.id}`)
          }}
        >
          <Edit className="mr-2 h-4 w-4" />
          {tCommon("edit") || "Edit"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2 text-sm font-medium transition-colors
                border-b-2 -mb-px
                ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t("basicInformation") || "Basic Information"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("name")}</p>
                    <p className="font-medium">{product.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("price")}</p>
                    <p className="font-medium">
                      {product.price.toLocaleString()} {product.unit?.suffix || ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("unit")}</p>
                    <p className="font-medium">{product.unit?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("brand")}</p>
                    <p className="font-medium">{product.brand?.name || "-"}</p>
                  </div>
                </div>
                {product.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t("productDescription")}</p>
                    <p className="font-medium">{product.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Categories */}
            {product.categories && product.categories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("categories")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {product.categories.map((category) => (
                      <Badge key={category.id} variant="secondary">
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Branches */}
            {product.branchIds && product.branchIds.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("branches") || t("branchesOptional")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {product.branchIds.map((branchId) => {
                      const branch = branchMap.get(branchId)
                      return (
                        <Badge key={branchId} variant="outline">
                          {branch?.name || branchId}
                        </Badge>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{t("settings") || "Settings"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{t("isVariable")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("isVariableDescription") || "Product has variants"}
                      </p>
                    </div>
                    <Badge variant={product.isVariable ? "default" : "secondary"}>
                      {product.isVariable ? tCommon("yes") : tCommon("no")}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{t("manageStocks")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("manageStocksDescription") || "Track inventory levels"}
                      </p>
                    </div>
                    <Badge variant={product.manageStocks ? "default" : "secondary"}>
                      {product.manageStocks ? tCommon("yes") : tCommon("no")}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>{t("metadata") || "Metadata"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("createdAt")}
                    </p>
                    <p className="font-medium">
                      {product.createdAt
                        ? new Date(product.createdAt).toLocaleString()
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("updatedAt")}
                    </p>
                    <p className="font-medium">
                      {product.updatedAt
                        ? new Date(product.updatedAt).toLocaleString()
                        : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Variants Tab */}
        {activeTab === "variants" && (
          <div className="space-y-4">
            {product.productVariants && product.productVariants.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{t("variants")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {product.productVariants.length} {t("variants")} {t("available") || "available"}
                    </p>
                  </div>
                </div>
                <div className="grid gap-4">
                  {product.productVariants.map((variant) => (
                    <Card key={variant.id}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{variant.variantName}</p>
                            </div>
                            {variant.price !== null && variant.price !== undefined && (
                              <div className="text-right">
                                <p className="font-semibold">
                                  {variant.price.toLocaleString()} {product.unit?.suffix || ""}
                                </p>
                              </div>
                            )}
                          </div>

                          {variant.options && Object.keys(variant.options).length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(variant.options).map(([key, val]) => {
                                // Convert "attr-{name}" format to readable attribute names
                                let displayKey = key
                                if (key.startsWith("attr-")) {
                                  const attrName = key.replace(/^attr-/, "").replace(/-/g, " ")
                                  displayKey = attrName
                                    .split(" ")
                                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                    .join(" ")
                                }
                                return (
                                  <Badge key={key} variant="secondary" className="text-xs">
                                    <span className="font-medium">{displayKey}:</span>{" "}
                                    <span className="ml-1">{String(val)}</span>
                                  </Badge>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t("noVariants") || "No variants available"}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Stock Tab */}
        {activeTab === "stock" && (
          <Card>
            <CardContent className="py-8 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {t("stockManagementComingSoon") || "Stock management coming soon"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
