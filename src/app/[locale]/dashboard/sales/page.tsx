"use client"

import { DataTable, type Column } from "@/components/common/data-table"
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog"
import { ExportButton } from "@/components/common/export-button"
import { InvoiceDialog } from "@/components/common/invoice-dialog"
import { PageLayout } from "@/components/common/page-layout"
import { PaymentDialog } from "@/components/common/payment-dialog"
import { SaleDialog } from "@/components/common/sale-dialog"
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
import { type SalesListParams } from "@/lib/api/sales"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { useProducts } from "@/lib/hooks/use-products"
import { useDeleteSale, useSale, useSales } from "@/lib/hooks/use-sales"
import { type ExportColumn } from "@/lib/utils/export"
import { Product, Sale } from "@/types"
import { CreditCard, Eye, FileText, Mail, MoreVertical, Pencil, Phone, Plus, Search, ShoppingCart, Trash2, User } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

export default function SalesPage() {
  const t = useTranslations("sales")
  const tCommon = useTranslations("common")
  const tModules = useTranslations("modulesPages.sales")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string

  const currentBusiness = useCurrentBusiness()
  const { selectedBranchId } = useBranchSelection()
  const deleteMutation = useDeleteSale()

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const limit = 10

  // View mode with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("sales-view-mode") as ViewMode) || "cards"
    }
    return "cards"
  })

  // Save view mode preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sales-view-mode", viewMode)
    }
  }, [viewMode])

  const queryParams = useMemo(() => {
    const trimmed = search.trim()
    const params: SalesListParams = {
      page,
      limit,
    }

    if (trimmed) {
      params.search = trimmed
    }

    // Always include branchId (even if null) so React Query detects changes
    params.branchId = selectedBranchId || undefined

    return params
  }, [page, limit, search, selectedBranchId])

  // Reset to page 1 when branch changes
  useEffect(() => {
    setPage(1)
  }, [selectedBranchId])

  const { data, isLoading } = useSales(queryParams)
  
  // Fetch products to match with sale items for images
  const { data: productsData } = useProducts({ limit: 1000, branchId: selectedBranchId || undefined })
  const allProducts = productsData?.items ?? []
  
  // Create product map by SKU and by ID for quick lookup
  const productMapBySku = useMemo(() => {
    const map = new Map<string, Product>()
    allProducts.forEach(product => {
      // Map by product barcode/SKU if exists
      if (product.barcode) {
        map.set(product.barcode, product)
      }
      // Map variants by SKU
      const variants = product.productVariants || product.variants || []
      variants.forEach((variant: any) => {
        if (variant.sku) {
          map.set(variant.sku, product)
        }
      })
    })
    return map
  }, [allProducts])
  
  // Helper to get product image from SKU
  const getProductImageBySku = (sku?: string): string | null => {
    if (!sku) return null
    const product = productMapBySku.get(sku)
    if (!product) return null
    
    // Get product image (same logic as products page)
    if (product.thumbnailUrl) return product.thumbnailUrl
    const variants = product.productVariants || product.variants || []
    if (variants.length > 0) {
      const variant = variants.find((v: any) => v.sku === sku) || variants[0]
      if (variant.thumbnailUrl) return variant.thumbnailUrl
      if (variant.images && Array.isArray(variant.images) && variant.images.length > 0) {
        return variant.images[0]
      }
    }
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0]
    }
    return null
  }
  
  // Helper to get items from sale (handles both items and saleItems)
  const getSaleItems = (sale: Sale) => {
    return sale.items || sale.saleItems || []
  }
  
  // Console log sales data
  useEffect(() => {
    if (data) {
      console.log("=".repeat(80))
      console.log("💰 SALES PAGE - API RESPONSE DATA")
      console.log("=".repeat(80))
      console.log("📊 Response Structure:", {
        hasItems: !!data.items,
        itemsCount: data.items?.length || 0,
        hasMeta: !!data.meta,
        meta: data.meta,
      })
      console.log("")
      if (data.items && data.items.length > 0) {
        console.log("📦 Sales List:")
        data.items.forEach((sale, index) => {
          console.log(`  Sale ${index + 1}:`, {
            id: sale.id,
            invoiceNumber: sale.invoiceNumber,
            invoiceSequence: sale.invoiceSequence,
            branchId: sale.branchId,
            branch: sale.branch,
            contactId: sale.contactId,
            contact: sale.contact,
            status: sale.status,
            paymentStatus: sale.paymentStatus,
            paidAmount: sale.paidAmount,
            totalPrice: sale.totalPrice,
            totalAmount: sale.totalAmount,
            discountType: sale.discountType,
            discountAmount: sale.discountAmount,
            businessId: sale.businessId,
            itemsCount: sale.items?.length || sale.saleItems?.length || 0,
            items: sale.items,
            saleItems: sale.saleItems,
            createdAt: sale.createdAt,
            updatedAt: sale.updatedAt,
          })
          if (sale.items || sale.saleItems) {
            const items = sale.items || sale.saleItems || []
            console.log(`    Items (${items.length}):`)
            items.forEach((item: any, idx: number) => {
              console.log(`      Item ${idx + 1}:`, {
                id: item.id,
                saleId: item.saleId,
                sku: item.sku,
                itemName: item.itemName,
                unit: item.unit,
                price: item.price,
                quantity: item.quantity,
                totalPrice: item.totalPrice,
              })
            })
          }
        })
      }
      console.log("=".repeat(80))
    }
  }, [data])
  
  const sales = data?.items ?? []
  const meta = data?.meta
  const total = meta?.total ?? sales.length
  const totalPages =
    meta?.totalPages ??
    Math.max(1, Math.ceil((total || 0) / (meta?.limit ?? limit)))
  const currentPage = meta?.page ?? page

  // Table columns configuration
  const tableColumns: Column<Sale>[] = useMemo(
    () => [
      {
        id: "contactId",
        header: t("contact"),
        cell: (row) => row.contact?.name || row.contactId || "-",
        sortable: false,
      },
      {
        id: "branch",
        header: t("branch"),
        cell: (row) => row.branch?.name || "-",
        sortable: false,
      },
      {
        id: "status",
        header: t("status"),
        cell: (row) => {
          const statusColors = {
            DRAFT: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
            SOLD: "bg-green-500/10 text-green-600 dark:text-green-400",
            PENDING: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
          }
          const statusLabels = {
            DRAFT: t("statusDraft"),
            SOLD: t("statusSold"),
            PENDING: t("statusPending"),
          }
          return (
            <Badge className={statusColors[row.status] || ""}>
              {statusLabels[row.status] || row.status}
            </Badge>
          )
        },
        sortable: true,
      },
      {
        id: "paymentStatus",
        header: t("paymentStatus"),
        cell: (row) => {
          const paymentColors = {
            PAID: "bg-green-500/10 text-green-600 dark:text-green-400",
            DUE: "bg-red-500/10 text-red-600 dark:text-red-400",
            PARTIAL: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
          }
          const paymentLabels = {
            PAID: t("paymentStatusPaid"),
            DUE: t("paymentStatusDue"),
            PARTIAL: t("paymentStatusPartial"),
          }
          return (
            <Badge className={paymentColors[row.paymentStatus] || ""}>
              {paymentLabels[row.paymentStatus] || row.paymentStatus}
            </Badge>
          )
        },
        sortable: true,
      },
      {
        id: "totalAmount",
        header: t("total"),
        accessorKey: "totalAmount",
        cell: (row) => {
          const items = getSaleItems(row)
          const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
          return total.toFixed(2)
        },
        sortable: true,
      },
      {
        id: "paidAmount",
        header: t("paidAmount"),
        accessorKey: "paidAmount",
        cell: (row) => row.paidAmount?.toFixed(2) || "0.00",
        sortable: true,
      },
      {
        id: "items",
        header: t("items"),
        cell: (row) => getSaleItems(row).length,
        sortable: false,
      },
    ],
    [t]
  )

  // Export columns configuration
  const exportColumns: ExportColumn<Sale>[] = useMemo(
    () => [
      { key: "contactId", header: "Contact ID", width: 20 },
      {
        key: "branch",
        header: "Branch",
        format: (value, row) => row.branch?.name || "-",
      },
      { key: "status", header: "Status", width: 15 },
      { key: "paymentStatus", header: "Payment Status", width: 15 },
      {
        key: "totalAmount",
        header: "Total Amount",
        format: (value, row) => {
          const items = getSaleItems(row)
          const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
          return total.toFixed(2)
        },
      },
      {
        key: "paidAmount",
        header: "Paid Amount",
        format: (value) => (value ? Number(value).toFixed(2) : "0.00"),
      },
      {
        key: "items",
        header: "Items Count",
        format: (value, row) => getSaleItems(row).length,
      },
      {
        key: "items",
        header: "Items",
        format: (value, row) => {
          const items = getSaleItems(row)
          return items.length > 0
            ? items.map((item) => `${item.itemName} (${item.quantity} ${item.unit}) - ${item.price}`).join("; ")
            : "-"
        },
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
    ],
    []
  )

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null)
  const [viewSaleId, setViewSaleId] = useState<string | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [invoiceSale, setInvoiceSale] = useState<Sale | null>(null)
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const [paymentSale, setPaymentSale] = useState<Sale | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)

  const { data: viewSale, isLoading: isViewSaleLoading } = useSale(viewSaleId || undefined)

  // Secure by module access (sales)
  useEffect(() => {
    if (currentBusiness && !currentBusiness.modules?.includes("sales")) {
      router.push(`/${locale}/dashboard`)
    }
  }, [currentBusiness, locale, router])

  if (!currentBusiness?.modules?.includes("sales")) {
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
    setSelectedSale(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (sale: Sale) => {
    setSelectedSale(sale)
    setIsDialogOpen(true)
  }

  const handleView = (sale: Sale) => {
    setViewSaleId(sale.id)
    setIsViewOpen(true)
  }

  const handleDelete = (sale: Sale) => {
    setSaleToDelete(sale)
    setIsDeleteDialogOpen(true)
  }

  const handleInvoice = (sale: Sale) => {
    setInvoiceSale(sale)
    setIsInvoiceOpen(true)
  }

  const handleAddPayment = (sale: Sale) => {
    setPaymentSale(sale)
    setIsPaymentDialogOpen(true)
  }

  const confirmDelete = () => {
    if (!saleToDelete) return
    deleteMutation.mutate(saleToDelete.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        setSaleToDelete(null)
      },
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400"
      case "SOLD":
        return "bg-green-500/10 text-green-600 dark:text-green-400"
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
      default:
        return ""
    }
  }

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "PAID":
        return "bg-green-500/10 text-green-600 dark:text-green-400"
      case "DUE":
        return "bg-red-500/10 text-red-600 dark:text-red-400"
      case "PARTIAL":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
      default:
        return ""
    }
  }

  const calculateTotal = (sale: Sale) => {
    const items = getSaleItems(sale)
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  return (
    <PageLayout title={t("title")} description={t("description")} maxWidth="full">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>{t("title")}</CardTitle>
                <CardDescription>
                  {t("description")}
                  {selectedBranchId && (
                    <span className="ml-2 text-xs">
                      ({tCommon("filteredByBranch")})
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
                data={sales}
                columns={exportColumns}
                filename="sales"
                disabled={isLoading || sales.length === 0}
              />
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createSale")}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <SkeletonList count={6} />
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("noSales")}</h3>
              <p className="text-muted-foreground mb-4">{t("noSalesDescription")}</p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createSale")}
              </Button>
            </div>
          ) : viewMode === "table" ? (
            <div className="rounded-md border">
              <DataTable
                data={sales}
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
                      <DropdownMenuItem onClick={() => handleInvoice(row)}>
                        <FileText className="mr-2 h-4 w-4" />
                        View Invoice
                      </DropdownMenuItem>
                      {(row.paymentStatus === "DUE" || row.paymentStatus === "PARTIAL") && (
                        <DropdownMenuItem onClick={() => handleAddPayment(row)}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Add Payment
                        </DropdownMenuItem>
                      )}
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
                emptyMessage={t("noSales")}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {sales.map((s) => {
                const total = calculateTotal(s)
                return (
                  <Card key={s.id} className="relative">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{s.contact?.name || `Contact: ${s.contactId}`}</h4>
                            <Badge className={getStatusColor(s.status)}>
                              {s.status === "DRAFT"
                                ? t("statusDraft")
                                : s.status === "SOLD"
                                ? t("statusSold")
                                : t("statusPending")}
                            </Badge>
                            <Badge className={getPaymentStatusColor(s.paymentStatus)}>
                              {s.paymentStatus === "PAID"
                                ? t("paymentStatusPaid")
                                : s.paymentStatus === "DUE"
                                ? t("paymentStatusDue")
                                : t("paymentStatusPartial")}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">{t("branch")}: </span>
                              <span>{s.branch?.name || "-"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t("total")}: </span>
                              <span className="font-medium">
                                {total.toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t("paidAmount")}: </span>
                              <span className="font-medium text-green-600">
                                {s.paidAmount?.toFixed(2) || "0.00"}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t("items")}: </span>
                              <span>{getSaleItems(s).length}</span>
                            </div>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(s)}>
                              <Eye className="mr-2 h-4 w-4" />
                              {t("viewDetails")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleInvoice(s)}>
                              <FileText className="mr-2 h-4 w-4" />
                              View Invoice
                            </DropdownMenuItem>
                            {(s.paymentStatus === "DUE" || s.paymentStatus === "PARTIAL") && (
                              <DropdownMenuItem onClick={() => handleAddPayment(s)}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Add Payment
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleEdit(s)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              {tCommon("edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(s)}
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
                )
              })}

              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  {t("pagination", { page: currentPage, totalPages })}
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

      <SaleDialog
        sale={selectedSale}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDescription")}
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
              {viewSale && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleInvoice(viewSale)}
                  className="ml-auto"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Invoice
                </Button>
              )}
            </div>
          </SheetHeader>
          {isViewSaleLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">{tCommon("loading")}</p>
            </div>
          ) : viewSale ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{viewSale.contact?.name || `Contact: ${viewSale.contactId}`}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("branch")}: {viewSale.branch?.name || "-"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(viewSale.status)}>
                    {viewSale.status === "DRAFT"
                      ? t("statusDraft")
                      : viewSale.status === "SOLD"
                      ? t("statusSold")
                      : t("statusPending")}
                  </Badge>
                  <Badge className={getPaymentStatusColor(viewSale.paymentStatus)}>
                    {viewSale.paymentStatus === "PAID"
                      ? t("paymentStatusPaid")
                      : viewSale.paymentStatus === "DUE"
                      ? t("paymentStatusDue")
                      : t("paymentStatusPartial")}
                  </Badge>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{t("total")}</p>
                  <p className="font-medium text-lg">
                    {calculateTotal(viewSale).toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{t("paidAmount")}</p>
                  <p className="font-medium text-lg text-green-600">
                    {viewSale.paidAmount?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              {viewSale.contact && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <h4 className="font-medium">{t("contactInformation")}</h4>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">{t("contactName")}</p>
                      <p className="font-medium">{viewSale.contact.name}</p>
                      <Badge className="mt-2" variant="outline">
                        {viewSale.contact.type === "CUSTOMER" ? t("typeCustomer") : t("typeSupplier")}
                      </Badge>
                    </div>
                    {viewSale.contact.email && (
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {t("email")}
                        </p>
                        <p className="font-medium">{viewSale.contact.email}</p>
                      </div>
                    )}
                    {viewSale.contact.phone && (
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {t("phone")}
                        </p>
                        <p className="font-medium">{viewSale.contact.phone}</p>
                      </div>
                    )}
                    {viewSale.contact.address && (
                      <div className="rounded-lg border p-3 sm:col-span-2">
                        <p className="text-xs text-muted-foreground">{t("address")}</p>
                        <p className="font-medium">{viewSale.contact.address}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3 border-t pt-4">
                <h4 className="font-medium">{t("items")}</h4>
                {getSaleItems(viewSale).length > 0 ? (
                  <div className="space-y-2">
                    {getSaleItems(viewSale).map((item, index) => {
                      const productImage = getProductImageBySku(item.sku)
                      return (
                        <Card key={index} className="border">
                          <CardContent className="py-3">
                            <div className="flex items-start justify-between gap-3">
                              {productImage && (
                                <div className="flex-shrink-0">
                                  <img
                                    src={productImage}
                                    alt={item.itemName}
                                    className="h-16 w-16 rounded-md object-cover border"
                                  />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-medium">{item.itemName}</p>
                                {item.itemDescription && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {item.itemDescription}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <span>
                                    {t("quantity")}: {item.quantity} {item.unit}
                                  </span>
                                  <span>
                                    {t("price")}: {item.price.toFixed(2)}
                                  </span>
                                  <span className="font-medium">
                                    {t("subtotal")}:{" "}
                                    {(item.price * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                    {t("noSales")}
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground border-t pt-4">
                <div>
                  <p className="text-xs uppercase tracking-wide">{tCommon("createdAt")}</p>
                  <p className="font-medium text-foreground">
                    {viewSale.createdAt
                      ? new Date(viewSale.createdAt).toLocaleString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide">{tCommon("updatedAt")}</p>
                  <p className="font-medium text-foreground">
                    {viewSale.updatedAt
                      ? new Date(viewSale.updatedAt).toLocaleString()
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Invoice Dialog */}
      <InvoiceDialog
        sale={invoiceSale}
        open={isInvoiceOpen}
        onOpenChange={setIsInvoiceOpen}
      />

      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={(open) => {
          setIsPaymentDialogOpen(open)
          if (!open) {
            setPaymentSale(null)
          }
        }}
        defaultType="SALE_PAYMENT"
        defaultSaleId={paymentSale?.id}
        defaultContactId={paymentSale?.contactId}
        defaultBranchId={paymentSale?.branchId}
        defaultAccountId={undefined}
        defaultAmount={
          paymentSale
            ? (paymentSale.totalAmount || paymentSale.totalPrice || 0) - (paymentSale.paidAmount || 0)
            : undefined
        }
      />
    </PageLayout>
  )
}
