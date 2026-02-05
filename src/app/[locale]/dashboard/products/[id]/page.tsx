"use client"

import { PageLayout } from "@/components/common/page-layout"
import { SkeletonList } from "@/components/skeletons/skeleton-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
            {/* Product Images Gallery */}
            {(() => {
              const allImages: string[] = []
              
              // Add product thumbnail if exists
              if (product.thumbnailUrl) {
                allImages.push(product.thumbnailUrl)
              }
              
              // Add product images
              if (product.images && Array.isArray(product.images)) {
                product.images.forEach(img => {
                  if (img && !allImages.includes(img)) allImages.push(img)
                })
              }
              
              return allImages.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("images") || "Product Images"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {allImages.map((img, idx) => (
                        <div key={idx} className="aspect-square rounded-md overflow-hidden border">
                          <img
                            src={img}
                            alt={`${product.name} - Image ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null
            })()}

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
            {((product.productVariants && product.productVariants.length > 0) || (product.variants && product.variants.length > 0)) ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{t("variants")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {(product.productVariants || product.variants || []).length} {t("variants")} {t("available") || "available"}
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {(product.productVariants || product.variants || []).map((variant: any) => {
                    const variantImage = variant.thumbnailUrl || (variant.images && Array.isArray(variant.images) && variant.images.length > 0 ? variant.images[0] : null)
                    const variantImages = variant.images && Array.isArray(variant.images) ? variant.images : []
                    return (
                      <Card key={variant.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex flex-col sm:flex-row">
                            {/* Variant Image */}
                            {variantImage ? (
                              <div className="w-full sm:w-32 h-32 sm:h-auto bg-muted border-b sm:border-b-0 sm:border-r flex-shrink-0">
                                <img
                                  src={variantImage}
                                  alt={variant.variantName || "Variant"}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-full sm:w-32 h-32 sm:h-auto bg-muted border-b sm:border-b-0 sm:border-r flex-shrink-0 flex items-center justify-center">
                                <Package className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            
                            {/* Variant Details */}
                            <div className="flex-1 p-4 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-base">{variant.variantName || "Unnamed Variant"}</h4>
                                  {variant.sku && (
                                    <p className="text-xs text-muted-foreground mt-1">SKU: {variant.sku}</p>
                                  )}
                                </div>
                                {variant.price !== null && variant.price !== undefined && variant.price > 0 && (
                                  <div className="text-right flex-shrink-0">
                                    <p className="font-bold text-lg text-primary">
                                      {variant.price.toLocaleString()}
                                    </p>
                                    {product.unit?.suffix && (
                                      <p className="text-xs text-muted-foreground">/{product.unit.suffix}</p>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Variant Options */}
                              {variant.options && Object.keys(variant.options).length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {Object.entries(variant.options).map(([key, val]) => {
                                    let displayKey = key
                                    if (key.startsWith("attr-")) {
                                      const attrName = key.replace(/^attr-/, "").replace(/-/g, " ")
                                      displayKey = attrName
                                        .split(" ")
                                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                        .join(" ")
                                    }
                                    return (
                                      <Badge key={key} variant="outline" className="text-xs">
                                        <span className="font-medium">{displayKey}:</span>{" "}
                                        <span className="ml-1">{String(val)}</span>
                                      </Badge>
                                    )
                                  })}
                                </div>
                              )}

                              {/* Gallery Images */}
                              {variantImages.length > 1 && (
                                <div className="pt-2 border-t">
                                  <p className="text-xs text-muted-foreground mb-2">Gallery Images ({variantImages.length})</p>
                                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                                    {variantImages.slice(0, 5).map((img: string, idx: number) => (
                                      <div key={idx} className="w-12 h-12 rounded border overflow-hidden flex-shrink-0">
                                        <img
                                          src={img}
                                          alt={`Gallery ${idx + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ))}
                                    {variantImages.length > 5 && (
                                      <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs text-muted-foreground">+{variantImages.length - 5}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
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
          <div className="space-y-4">
            {product.stocks && product.stocks.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{t("stock") || "Stock"}</h3>
                    <p className="text-sm text-muted-foreground">
                      {product.stocks.length} {t("stockEntries") || "stock entries"} {t("available") || "available"}
                    </p>
                  </div>
                </div>
                <div className="grid gap-4">
                  {product.stocks.map((stock) => {
                    const branch = branchMap.get(stock.branchId)
                    return (
                      <Card key={stock.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">
                                  {branch?.name || stock.branchId}
                                </h4>
                                <Badge variant={stock.quantity > 0 ? "default" : "destructive"}>
                                  {stock.quantity} {product.unit?.suffix || ""}
                                </Badge>
                              </div>
                              {stock.sku && (
                                <p className="text-sm text-muted-foreground">
                                  SKU: {stock.sku}
                                </p>
                              )}
                              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                                {stock.purchasePrice !== null && stock.purchasePrice !== undefined && (
                                  <div>
                                    <span className="text-muted-foreground">{t("purchasePrice") || "Purchase Price"}:</span>
                                    <span className="ml-2 font-medium">{stock.purchasePrice.toLocaleString()}</span>
                                  </div>
                                )}
                                {stock.salePrice !== null && stock.salePrice !== undefined && (
                                  <div>
                                    <span className="text-muted-foreground">{t("salePrice") || "Sale Price"}:</span>
                                    <span className="ml-2 font-medium">{stock.salePrice.toLocaleString()}</span>
                                  </div>
                                )}
                                {stock.profitMarginAmount !== null && stock.profitMarginAmount !== undefined && (
                                  <div>
                                    <span className="text-muted-foreground">{t("profitMarginAmount") || "Profit Margin Amount"}:</span>
                                    <span className="ml-2 font-medium">{stock.profitMarginAmount.toLocaleString()}</span>
                                  </div>
                                )}
                                {stock.profitMarginPercent !== null && stock.profitMarginPercent !== undefined && (
                                  <div>
                                    <span className="text-muted-foreground">{t("profitMarginPercent") || "Profit Margin %"}:</span>
                                    <span className="ml-2 font-medium">{stock.profitMarginPercent}%</span>
                                  </div>
                                )}
                              </div>
                              {stock.createdAt && (
                                <p className="text-xs text-muted-foreground">
                                  {t("createdAt") || "Created"}: {new Date(stock.createdAt).toLocaleString()}
                                </p>
                              )}
                              {stock.updatedAt && (
                                <p className="text-xs text-muted-foreground">
                                  {t("updatedAt") || "Updated"}: {new Date(stock.updatedAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {t("noStockData") || "No stock data available"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
