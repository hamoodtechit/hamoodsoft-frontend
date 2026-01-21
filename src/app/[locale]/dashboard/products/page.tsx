"use client"

import { AttributeDialog } from "@/components/common/attribute-dialog"
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog"
import { PageLayout } from "@/components/common/page-layout"
import { ProductDialog } from "@/components/common/product-dialog"
import { ProductVariantDialog } from "@/components/common/product-variant-dialog"
import { SkeletonList } from "@/components/skeletons/skeleton-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useAttributes, useCreateAttribute, useDeleteAttribute, useUpdateAttribute } from "@/lib/hooks/use-attributes"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import {
  useCreateProductVariant,
  useDeleteProductVariant,
  useProductVariants,
  useUpdateProductVariant,
} from "@/lib/hooks/use-product-variants"
import { useDeleteProduct, useProducts } from "@/lib/hooks/use-products"
import { Attribute, Product, ProductVariant } from "@/types"
import { Eye, MoreVertical, Package, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

export default function ProductsPage() {
  const t = useTranslations("products")
  const tAttributes = useTranslations("attributes")
  const tCommon = useTranslations("common")
  const tModules = useTranslations("modulesPages.inventory")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string

  const currentBusiness = useCurrentBusiness()
  const deleteMutation = useDeleteProduct()

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const limit = 10

  const queryParams = useMemo(() => {
    const trimmed = search.trim()
    return { page, limit, search: trimmed || undefined }
  }, [page, limit, search])

  const { data, isLoading } = useProducts(queryParams)
  const products = data?.items ?? []
  const meta = data?.meta
  const total = meta?.total ?? products.length
  const totalPages =
    meta?.totalPages ??
    Math.max(1, Math.ceil((total || 0) / (meta?.limit ?? limit)))
  const currentPage = meta?.page ?? page

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [viewProduct, setViewProduct] = useState<Product | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [variantDialogOpen, setVariantDialogOpen] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [attributeDialogOpen, setAttributeDialogOpen] = useState(false)
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null)

  const { data: variantsData, isLoading: variantsLoading } = useProductVariants(viewProduct?.id)
  const variants = variantsData?.items || []
  const createVariantMutation = useCreateProductVariant(viewProduct?.id)
  const updateVariantMutation = useUpdateProductVariant(viewProduct?.id)
  const deleteVariantMutation = useDeleteProductVariant(viewProduct?.id)

  const { data: attributes = [], isLoading: attributesLoading } = useAttributes(viewProduct?.id)
  const createAttributeMutation = useCreateAttribute(viewProduct?.id)
  const updateAttributeMutation = useUpdateAttribute(viewProduct?.id)
  const deleteAttributeMutation = useDeleteAttribute(viewProduct?.id)

  // Secure by module access (inventory)
  useEffect(() => {
    if (currentBusiness && !currentBusiness.modules?.includes("inventory")) {
      router.push(`/${locale}/dashboard`)
    }
  }, [currentBusiness, locale, router])

  if (!currentBusiness?.modules?.includes("inventory")) {
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

  const handleCreate = () => {
    setSelectedProduct(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setIsDialogOpen(true)
  }

  const handleView = (product: Product) => {
    setViewProduct(product)
    setIsViewOpen(true)
  }

  const openCreateVariant = () => {
    setSelectedVariant(null)
    setVariantDialogOpen(true)
  }

  const openEditVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant)
    setVariantDialogOpen(true)
  }

  const handleDeleteVariant = (variant: ProductVariant) => {
    deleteVariantMutation.mutate(variant.id)
  }

  const openCreateAttribute = () => {
    setSelectedAttribute(null)
    setAttributeDialogOpen(true)
  }

  const openEditAttribute = (attribute: Attribute) => {
    setSelectedAttribute(attribute)
    setAttributeDialogOpen(true)
  }

  const handleDeleteAttribute = (attribute: Attribute) => {
    deleteAttributeMutation.mutate(attribute.id)
  }

  const handleDelete = (product: Product) => {
    setProductToDelete(product)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (!productToDelete) return
    deleteMutation.mutate(productToDelete.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        setProductToDelete(null)
      },
    })
  }

  return (
    <PageLayout title={t("title")} description={t("description")} maxWidth="full">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>{t("title")}</CardTitle>
                <CardDescription>{t("description")}</CardDescription>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <div className="relative w-full sm:w-[280px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  placeholder={t("searchPlaceholder")}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createProduct")}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <SkeletonList count={6} />
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("noProducts")}</h3>
              <p className="text-muted-foreground mb-4">{t("noProductsDescription")}</p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createProduct")}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((p) => (
                <Card key={p.id} className="relative">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold truncate">{p.name}</h4>
                          <span className="text-sm text-muted-foreground">
                            {t("priceValue", { price: p.price })}
                            {p.unit?.suffix ? ` / ${p.unit.suffix}` : ""}
                          </span>
                        </div>
                        {p.description ? (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {p.description}
                          </p>
                        ) : null}
                        {p.categories && p.categories.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {p.categories.map((c) => (
                              <span
                                key={c.id}
                                className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                              >
                                {c.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(p)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t("viewDetails")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(p)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {tCommon("edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(p)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {tCommon("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  {t("pagination", { page, totalPages })}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    {tCommon("previous")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    {tCommon("next")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ProductDialog product={selectedProduct} open={isDialogOpen} onOpenChange={setIsDialogOpen} />

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDescription", { name: productToDelete?.name || "" })}
        isLoading={deleteMutation.isPending}
      />

      <Sheet open={isViewOpen} onOpenChange={setIsViewOpen}>
        <SheetContent
          side="bottom"
          className="w-full max-w-3xl mx-auto rounded-t-2xl sm:rounded-2xl sm:max-h-[90vh] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>{t("detailsTitle")}</SheetTitle>
            <SheetDescription>{t("detailsDescription")}</SheetDescription>
          </SheetHeader>
          {viewProduct ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{viewProduct.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {viewProduct.description || t("descriptionPlaceholder")}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {t("priceValue", { price: viewProduct.price })}{" "}
                    {viewProduct.unit?.suffix ? `/ ${viewProduct.unit.suffix}` : ""}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t("unit")}: {viewProduct.unit?.name || "-"}
                  </div>
                </div>
              </div>

              {viewProduct.categories && viewProduct.categories.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("categories")}</p>
                  <div className="flex flex-wrap gap-2">
                    {viewProduct.categories.map((c) => (
                      <Badge key={c.id} variant="secondary">
                        {c.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{t("manageStocks")}</p>
                  <p className="font-medium">{viewProduct.manageStocks ? tCommon("yes") : tCommon("no")}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{t("isVariable")}</p>
                  <p className="font-medium">{viewProduct.isVariable ? tCommon("yes") : tCommon("no")}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div>
                  <p className="text-xs uppercase tracking-wide">{t("createdAt")}</p>
                  <p className="font-medium text-foreground">
                    {viewProduct.createdAt ? new Date(viewProduct.createdAt).toLocaleString() : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide">{t("updatedAt")}</p>
                  <p className="font-medium text-foreground">
                    {viewProduct.updatedAt ? new Date(viewProduct.updatedAt).toLocaleString() : "-"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                {/* Attributes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{tAttributes("title")}</p>
                      <p className="text-xs text-muted-foreground">
                        {tAttributes("noAttributesDescription")}
                      </p>
                    </div>
                    <Button size="sm" onClick={openCreateAttribute} disabled={!viewProduct}>
                      <Plus className="mr-2 h-4 w-4" />
                      {tAttributes("createAttribute")}
                    </Button>
                  </div>

                  {attributesLoading ? (
                    <SkeletonList count={2} />
                  ) : attributes.length === 0 ? (
                    <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                      {tAttributes("noAttributes")}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {attributes.map((a) => (
                        <Card key={a.id} className="border">
                          <CardContent className="py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-medium truncate">{a.name}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {(a.values || []).join(", ")}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => openEditAttribute(a)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive"
                                  onClick={() => handleDeleteAttribute(a)}
                                  disabled={deleteAttributeMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Variants */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t("variants")}</p>
                    <p className="text-xs text-muted-foreground">{t("noVariantsDescription")}</p>
                  </div>
                  <Button size="sm" onClick={openCreateVariant} disabled={!viewProduct}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("addVariant")}
                  </Button>
                </div>

                {variantsLoading ? (
                  <SkeletonList count={2} />
                ) : variants.length === 0 ? (
                  <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                    {t("noVariants")}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {variants.map((v) => (
                      <Card key={v.id} className="border">
                        <CardContent className="py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">{v.variantName}</p>
                                <span className="text-xs text-muted-foreground">SKU: {v.sku}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {t("priceValue", { price: v.price })}{" "}
                                {v.unit?.suffix ? `/ ${v.unit.suffix}` : ""}
                              </p>
                              {v.options && Object.keys(v.options).length > 0 && (
                                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                                  {Object.entries(v.options).map(([key, val]) => (
                                    <div key={key} className="flex gap-2">
                                      <span className="font-medium">{key}:</span>
                                      <span>{String(val)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openEditVariant(v)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleDeleteVariant(v)}
                                disabled={deleteVariantMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {viewProduct ? (
        <ProductVariantDialog
          productId={viewProduct.id}
          variant={selectedVariant}
          open={variantDialogOpen}
          onOpenChange={setVariantDialogOpen}
          onSubmitCreate={(data) =>
            createVariantMutation.mutate(data, { onSuccess: () => setVariantDialogOpen(false) })
          }
          onSubmitUpdate={(id, data) =>
            updateVariantMutation.mutate(
              { id, data },
              { onSuccess: () => setVariantDialogOpen(false) }
            )
          }
          isLoading={createVariantMutation.isPending || updateVariantMutation.isPending}
        />
      ) : null}

      {viewProduct ? (
        <AttributeDialog
          productId={viewProduct.id}
          attribute={selectedAttribute}
          open={attributeDialogOpen}
          onOpenChange={setAttributeDialogOpen}
          onSubmitCreate={(data) =>
            createAttributeMutation.mutate(data, { onSuccess: () => setAttributeDialogOpen(false) })
          }
          onSubmitUpdate={(id, data) =>
            updateAttributeMutation.mutate(
              { id, data },
              { onSuccess: () => setAttributeDialogOpen(false) }
            )
          }
          isLoading={createAttributeMutation.isPending || updateAttributeMutation.isPending}
        />
      ) : null}
    </PageLayout>
  )
}

