"use client"

import { DataTable, type Column } from "@/components/common/data-table"
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog"
import { ExportButton } from "@/components/common/export-button"
import { PageLayout } from "@/components/common/page-layout"
import { ProductDialog } from "@/components/common/product-dialog"
import { ViewToggle, type ViewMode } from "@/components/common/view-toggle"
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
import { type ProductsListParams } from "@/lib/api/products"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { useBranches } from "@/lib/hooks/use-branches"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { useDeleteProduct, useProduct, useProducts } from "@/lib/hooks/use-products"
import { type ExportColumn } from "@/lib/utils/export"
import { Product } from "@/types"
import { Eye, MoreVertical, Package, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

export default function ProductsPage() {
  const t = useTranslations("products")
  const tAttributes = useTranslations("attributes")
  const tCommon = useTranslations("common")
  const tModules = useTranslations("modulesPages.inventory")
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = params.locale as string

  const currentBusiness = useCurrentBusiness()
  const { selectedBranchId } = useBranchSelection()
  const deleteMutation = useDeleteProduct()

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const limit = 10
  
  // View mode with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("products-view-mode") as ViewMode) || "cards"
    }
    return "cards"
  })

  // Save view mode preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("products-view-mode", viewMode)
    }
  }, [viewMode])

  const queryParams = useMemo(() => {
    const trimmed = search.trim()
    const params: ProductsListParams = { 
      page, 
      limit, 
    }
    
    if (trimmed) {
      params.search = trimmed
    }
    
    // Always include branchId (even if null) so React Query detects changes
    // The API will handle null/undefined by not filtering
    params.branchId = selectedBranchId || undefined
    
    return params
  }, [page, limit, search, selectedBranchId])

  // Reset to page 1 when branch changes
  useEffect(() => {
    setPage(1)
  }, [selectedBranchId])

  const { data, isLoading } = useProducts(queryParams)
  const products = data?.items ?? []
  const meta = data?.meta
  const total = meta?.total ?? products.length
  const totalPages =
    meta?.totalPages ??
    Math.max(1, Math.ceil((total || 0) / (meta?.limit ?? limit)))
  const currentPage = meta?.page ?? page

  // Table columns configuration
  const tableColumns: Column<Product>[] = useMemo(() => [
    {
      id: "name",
      header: t("name"),
      accessorKey: "name",
      sortable: true,
    },
    {
      id: "price",
      header: t("price"),
      accessorKey: "price",
      sortable: true,
      cell: (row) => (
        <span>
          {t("priceValue", { price: row.price })}
          {row.unit?.suffix ? ` / ${row.unit.suffix}` : ""}
        </span>
      ),
    },
    {
      id: "unit",
      header: t("unit"),
      cell: (row) => row.unit?.name || "-",
      sortable: false,
    },
    {
      id: "categories",
      header: t("categories"),
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.categories && row.categories.length > 0 ? (
            row.categories.map((c) => (
              <Badge key={c.id} variant="secondary" className="text-xs">
                {c.name}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          )}
        </div>
      ),
      sortable: false,
    },
    {
      id: "manageStocks",
      header: t("manageStocks"),
      cell: (row) => (row.manageStocks ? tCommon("yes") : tCommon("no")),
      sortable: true,
    },
    {
      id: "isVariable",
      header: t("isVariable"),
      cell: (row) => (row.isVariable ? tCommon("yes") : tCommon("no")),
      sortable: true,
    },
  ], [t, tCommon])

  // Export columns configuration
  const exportColumns: ExportColumn<Product>[] = useMemo(() => [
    { key: "name", header: "Product Name", width: 25 },
    { key: "description", header: "Description", width: 40 },
    { key: "price", header: "Price", width: 15 },
    {
      key: "unit",
      header: "Unit",
      format: (value, row) => row.unit?.name || "-",
    },
    {
      key: "unitSuffix",
      header: "Unit Suffix",
      format: (value, row) => row.unit?.suffix || "-",
    },
    {
      key: "categories",
      header: "Categories",
      format: (value, row) =>
        row.categories?.map((c) => c.name).join(", ") || "-",
    },
    {
      key: "branches",
      header: "Branches",
      format: (value, row) => {
        if (!row.branchIds || row.branchIds.length === 0) return "All Branches"
        return row.branchIds.join(", ")
      },
    },
    {
      key: "manageStocks",
      header: "Manage Stocks",
      format: (value) => (value ? "Yes" : "No"),
    },
    {
      key: "isVariable",
      header: "Variable Product",
      format: (value) => (value ? "Yes" : "No"),
    },
    {
      key: "createdAt",
      header: "Created At",
      format: (value) => (value ? new Date(value).toLocaleString() : "-"),
    },
    {
      key: "updatedAt",
      header: "Updated At",
      format: (value) => (value ? new Date(value).toLocaleString() : "-"),
    },
  ], [])

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [viewProductId, setViewProductId] = useState<string | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  const { data: viewProduct, isLoading: isViewProductLoading } = useProduct(viewProductId || undefined)
  // Fetch full product details when editing
  const { data: editProduct, isLoading: isEditProductLoading } = useProduct(selectedProductId || undefined)

  // Handle edit from URL query parameter
  useEffect(() => {
    const editId = searchParams.get("edit")
    if (editId && products.length > 0) {
      setSelectedProductId(editId)
      setIsDialogOpen(true)
      // Clean up URL
      router.replace(`/${locale}/dashboard/products`, { scroll: false })
    }
  }, [searchParams, products, locale, router])

  const { data: branchesData } = useBranches()
  const branches = Array.isArray(branchesData) ? branchesData : []
  const branchMap = useMemo(() => {
    const map = new Map<string, any>()
    branches.forEach((b: any) => map.set(b.id, b))
    return map
  }, [branches])

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
    setSelectedProductId(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (product: Product) => {
    setSelectedProductId(product.id)
    setSelectedProduct(null) // Clear to ensure fresh fetch
    setIsDialogOpen(true)
  }

  const handleView = (product: Product) => {
    // Fetch full product details using the API
    setViewProductId(product.id)
    setIsViewOpen(true)
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
                <CardDescription>
                  {t("description")}
                  {selectedBranchId && (
                    <span className="ml-2 text-xs">
                      ({t("filteredByBranch")})
                    </span>
                  )}
                </CardDescription>
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
              <ViewToggle view={viewMode} onViewChange={setViewMode} />
              <ExportButton
                data={products}
                columns={exportColumns}
                filename="products"
                disabled={isLoading || products.length === 0}
              />
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
          ) : viewMode === "table" ? (
            <div className="rounded-md border">
              <DataTable
                data={products}
                columns={tableColumns}
                onRowClick={handleView}
                actions={(row) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(row)}>
                        <Eye className="mr-2 h-4 w-4" />
                        {t("viewDetails")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(row)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {tCommon("edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(row)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {tCommon("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                emptyMessage={t("noProducts")}
              />
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

      <ProductDialog 
        product={editProduct || selectedProduct} 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setSelectedProductId(null)
            setSelectedProduct(null)
          }
        }} 
      />

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
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle>{t("detailsTitle")}</SheetTitle>
                <SheetDescription>{t("detailsDescription")}</SheetDescription>
              </div>
              {viewProduct && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    router.push(`/${locale}/dashboard/products/${viewProduct.id}`)
                    setViewProductId(null)
                  }}
                  className="ml-auto"
                >
                  {t("viewFullDetails") || "View Full Details"}
                  <Eye className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </SheetHeader>
          {isViewProductLoading ? (
            <div className="space-y-4">
              <SkeletonList count={5} />
            </div>
          ) : viewProduct ? (
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

              {viewProduct.brand && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("brand")}</p>
                  <div className="rounded-lg border p-3">
                    <p className="font-medium">{viewProduct.brand.name}</p>
                    {viewProduct.brand.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {viewProduct.brand.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

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

              {viewProduct.branchIds && viewProduct.branchIds.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("branchesOptional")}</p>
                  <div className="flex flex-wrap gap-2">
                    {viewProduct.branchIds.map((branchId) => {
                      const branch = branchMap.get(branchId)
                      return (
                        <Badge key={branchId} variant="outline">
                          {branch?.name || branchId}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}
              {(!viewProduct.branchIds || viewProduct.branchIds.length === 0) && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("branchesOptional")}</p>
                  <Badge variant="secondary">{t("branchesHint") || "All Branches"}</Badge>
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

              {((viewProduct.variants && viewProduct.variants.length > 0) || 
                (viewProduct.productVariants && viewProduct.productVariants.length > 0)) && (
                <div className="space-y-3 border-t pt-4">
                  <div>
                    <p className="text-sm font-medium">{t("variants")}</p>
                    <p className="text-xs text-muted-foreground">
                      {((viewProduct.variants || viewProduct.productVariants || []).length)} {t("variants")} {t("available") || "available"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {(viewProduct.variants || viewProduct.productVariants || []).map((v: any, index: number) => {
                      const variant = v.variantName ? v : {
                        variantName: v.variantName || "N/A",
                        sku: v.sku,
                        price: v.price,
                        unitId: v.unitId,
                        options: v.options || {},
                      }
                      return (
                      <Card key={index} className="border">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div>
                              <p className="font-medium text-sm">{variant.variantName}</p>
                            </div>
                            
                            {variant.options && Object.keys(variant.options).length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(variant.options).map(([key, val]: [string, unknown]) => {
                                  // Convert "attr-{name}" format to readable attribute names (e.g., "attr-color" -> "Color")
                                  let displayKey = key
                                  if (key.startsWith("attr-")) {
                                    const attrName = key.replace(/^attr-/, "").replace(/-/g, " ")
                                    displayKey = attrName
                                      .split(" ")
                                      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
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
                            
                            {variant.price !== null && variant.price !== undefined && (
                              <div className="flex items-center justify-between pt-2 border-t">
                                <span className="text-xs text-muted-foreground">{t("price")}</span>
                                <p className="font-semibold">
                                  {variant.price.toLocaleString()} {viewProduct.unit?.suffix || ""}
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

    </PageLayout>
  )
}

