"use client"

import { DataTable, type Column } from "@/components/common/data-table"
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog"
import { ExportButton } from "@/components/common/export-button"
import { InvoiceDialog } from "@/components/common/invoice-dialog"
import { PageLayout } from "@/components/common/page-layout"
import { PaymentDialog } from "@/components/common/payment-dialog"
import { PermissionGuard } from "@/components/common/permission-guard"
import { SaleDialog } from "@/components/common/sale-dialog"
import { ReturnSaleDialog } from "@/components/common/return-sale-dialog"
import { ViewToggle, type ViewMode } from "@/components/common/view-toggle"
import { Pagination } from "@/components/common/pagination"
import { PaymentReceiptDialog, type PaymentReceiptData } from "@/components/common/payment-receipt-dialog"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { useModuleAccessCheck } from "@/lib/hooks/use-permission-check"
import { useHasPermission } from "@/lib/hooks/use-permissions"
import { useProducts } from "@/lib/hooks/use-products"
import { useDeleteSale, useSale, useSales } from "@/lib/hooks/use-sales"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { formatCurrency } from "@/lib/utils/currency"
import { type ExportColumn } from "@/lib/utils/export"
import { MODULES, PERMISSIONS } from "@/lib/utils/permissions"
import { Payment, Product, Sale } from "@/types"
import { CreditCard, Eye, FileText, Mail, MoreVertical, Pencil, Phone, Plus, Search, ShoppingCart, Trash2, User, RotateCcw } from "lucide-react"
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
  const { generalSettings } = useAppSettings()
  const deleteMutation = useDeleteSale()

  const [search, setSearch] = useState("")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [selectedSales, setSelectedSales] = useState<Sale[]>([])
  
  const [receiptData, setReceiptData] = useState<PaymentReceiptData | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // View mode with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("sales-view-mode") as ViewMode) || "table"
    }
    return "table"
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

    if (paymentStatusFilter !== "ALL") {
      params.paymentStatus = paymentStatusFilter as any
    }

    if (statusFilter !== "ALL") {
      params.status = statusFilter as any
    }

    // Always include branchId (even if null) so React Query detects changes
    params.branchId = selectedBranchId || undefined

    return params
  }, [page, limit, search, selectedBranchId, paymentStatusFilter, statusFilter])

  // Reset to page 1 when branch changes
  useEffect(() => {
    setPage(1)
  }, [selectedBranchId])

  const { data, isLoading, refetch } = useSales(queryParams)
  
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

  const totalPages =
    meta?.totalPages ??
    Math.max(1, Math.ceil((meta?.total || 0) / (meta?.limit ?? limit)))
  
  const currentPage = meta?.page ?? page

  // Table columns configuration
  const tableColumns: Column<Sale>[] = useMemo(
    () => [
      {
        id: "invoiceNumber",
        header: t("invoiceNumber") || "Invoice No.",
        accessorKey: "invoiceNumber",
        cell: (row) => row.invoiceNumber || "-",
        sortable: true,
      },
      {
        id: "contactId",
        header: t("contact"),
        cell: (row) => row.contact?.name || row.contactId || "-",
        sortable: false,
      },

      {
        id: "vehicleNo",
        header: "Vehicle No.",
        cell: (row) => row.vehicleNo || "-",
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
        accessorKey: "totalPrice",
        cell: (row) => row.totalPrice?.toFixed(2) || "0.00",
        sortable: true,
      },
      {
        id: "discountAmount",
        header: t("discount") || "Discount",
        accessorKey: "discountAmount",
        cell: (row) => row.discountAmount ? row.discountAmount.toFixed(2) : "-",
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
        id: "dueAmount",
        header: t("dueAmount") || "Due Amount",
        cell: (row) => {
           const due = Math.max(0, (row.totalPrice || 0) - (row.paidAmount || 0))
           return <span className="text-red-600 dark:text-red-400 font-medium">{due.toFixed(2)}</span>
        },
        sortable: false,
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
      { key: "invoiceNumber", header: "Invoice No.", width: 15, format: (value, row) => row.invoiceNumber || "-" },
      { key: "contactId", header: "Contact ID", width: 20 },

      { key: "status", header: "Status", width: 15 },
      { key: "paymentStatus", header: "Payment Status", width: 15 },
      {
        key: "totalAmount",
        header: "Total Amount",
        format: (value, row) => row.totalPrice?.toFixed(2) || "0.00",
      },
      {
        key: "discountAmount",
        header: "Discount",
        format: (value, row) => row.discountAmount ? row.discountAmount.toFixed(2) : "-",
      },
      {
        key: "paidAmount",
        header: "Paid Amount",
        format: (value) => (value ? Number(value).toFixed(2) : "0.00"),
      },
      {
        key: "dueAmount",
        header: "Due Amount",
        format: (value, row) => Math.max(0, (row.totalPrice || 0) - (row.paidAmount || 0)).toFixed(2),
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
  const [showPaymentsSection, setShowPaymentsSection] = useState(false)
  const [invoiceSale, setInvoiceSale] = useState<Sale | null>(null)
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const [paymentSale, setPaymentSale] = useState<Sale | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [saleToReturn, setSaleToReturn] = useState<Sale | null>(null)

  const { data: viewSale, isLoading: isViewSaleLoading } = useSale(viewSaleId || undefined)

  // Permission checks
  const { hasAccess, isLoading: isCheckingAccess } = useModuleAccessCheck(MODULES.SALES)
  const canCreate = useHasPermission(PERMISSIONS.SALES_CREATE)
  const canUpdate = useHasPermission(PERMISSIONS.SALES_UPDATE)
  const canDelete = useHasPermission(PERMISSIONS.SALES_DELETE)

  // Scroll to payments section when showPaymentsSection is true
  useEffect(() => {
    if (showPaymentsSection && viewSale && isViewOpen) {
      const timer = setTimeout(() => {
        const paymentsSection = document.getElementById('payments-section')
        if (paymentsSection) {
          paymentsSection.scrollIntoView({ behavior: "smooth", block: "start" })
          setShowPaymentsSection(false)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [showPaymentsSection, viewSale, isViewOpen])

  // Secure by module access (sales)
  useEffect(() => {
    if (!isCheckingAccess && !hasAccess) {
      router.push(`/${locale}/dashboard`)
    }
  }, [hasAccess, isCheckingAccess, locale, router])

  // Show loading while checking permissions
  if (isCheckingAccess) {
    return (
      <PageLayout title={t("title")} description={t("description")} maxWidth="full">
        <SkeletonList count={5} />
      </PageLayout>
    )
  }

  if (!hasAccess) {
    return (
      <PageLayout title={t("title")} description={t("description")}>
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
    setShowPaymentsSection(false)
    setIsViewOpen(true)
  }

  const handleViewPayments = (sale: Sale) => {
    setViewSaleId(sale.id)
    setIsViewOpen(true)
    setShowPaymentsSection(true)
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

  const handleReturn = (sale: Sale) => {
    setSaleToReturn(sale)
    setIsReturnDialogOpen(true)
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
    return sale.totalPrice || 0
  }

  const calculateSubtotal = (sale: Sale) => {
    const items = getSaleItems(sale)
    return items.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
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
              <Select
                value={paymentStatusFilter}
                onValueChange={(value) => {
                  setPaymentStatusFilter(value)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder={t("paymentStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("paymentStatus")}</SelectItem>
                  <SelectItem value="PAID">{t("paymentStatusPaid")}</SelectItem>
                  <SelectItem value="UNPAID">{t("paymentStatusUnpaid") || "Unpaid (Due/Partial)"}</SelectItem>
                  <SelectItem value="DUE">{t("paymentStatusDue")}</SelectItem>
                  <SelectItem value="PARTIAL">{t("paymentStatusPartial")}</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder={t("status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("status")}</SelectItem>
                  <SelectItem value="DRAFT">{t("statusDraft")}</SelectItem>
                  <SelectItem value="SOLD">{t("statusSold")}</SelectItem>
                  <SelectItem value="PENDING">{t("statusPending")}</SelectItem>
                </SelectContent>
              </Select>
              <ViewToggle view={viewMode} onViewChange={setViewMode} />
              <ExportButton
                data={sales}
                columns={exportColumns}
                filename="sales"
                disabled={isLoading || sales.length === 0}
              />
              {selectedSales.length > 0 && (() => {
                const isSingleCustomer = new Set(selectedSales.map(s => s.contactId)).size === 1;
                return (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="default"
                      disabled={!isSingleCustomer}
                      onClick={() => {
                        setPaymentSale(null)
                        setIsPaymentDialogOpen(true)
                      }}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay Selected ({selectedSales.length})
                    </Button>
                    {!isSingleCustomer && (
                      <span className="text-xs text-red-500">
                        Select sales for a single customer
                      </span>
                    )}
                  </div>
                )
              })()}
              <PermissionGuard permission={PERMISSIONS.SALES_CREATE}>
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("createSale")}
                </Button>
              </PermissionGuard>
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
              <PermissionGuard permission={PERMISSIONS.SALES_CREATE}>
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("createSale")}
                </Button>
              </PermissionGuard>
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
                      {row.payments && row.payments.length > 0 && (
                        <DropdownMenuItem onClick={() => handleViewPayments(row)}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          View Payments
                        </DropdownMenuItem>
                      )}
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
                      {row.status === "DRAFT" && (
                        <DropdownMenuItem
                          onClick={() => handleDelete(row)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {tCommon("delete")}
                        </DropdownMenuItem>
                      )}
                      {row.status !== "DRAFT" && (
                        <DropdownMenuItem onClick={() => handleReturn(row)}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Return Sale
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                selectable={true}
                onSelectionChange={(selected) => {
                  setSelectedSales(selected as Sale[])
                }}
                emptyMessage={t("noSales")}
              />
              {meta && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={meta.total || 0}
                  limit={limit}
                  onPageChange={setPage}
                  onLimitChange={(newLimit) => {
                    setLimit(newLimit)
                    setPage(1)
                  }}
                />
              )}
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
                            {s.payments && s.payments.length > 0 && (
                              <DropdownMenuItem onClick={() => handleViewPayments(s)}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                View Payments
                              </DropdownMenuItem>
                            )}
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
                            {s.status === "DRAFT" && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(s)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {tCommon("delete")}
                              </DropdownMenuItem>
                            )}
                            {s.status !== "DRAFT" && (
                              <DropdownMenuItem onClick={() => handleReturn(s)}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Return Sale
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {meta && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={meta.total || 0}
                  limit={limit}
                  onPageChange={setPage}
                  onLimitChange={(newLimit) => {
                    setLimit(newLimit)
                    setPage(1)
                  }}
                />
              )}
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

      <ReturnSaleDialog
        sale={saleToReturn}
        open={isReturnDialogOpen}
        onOpenChange={setIsReturnDialogOpen}
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

              <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div className="rounded-lg border p-3 bg-muted/20">
                  <p className="text-xs text-muted-foreground">{t("subtotal") || "Subtotal"}</p>
                  <p className="font-medium text-lg">
                    {calculateSubtotal(viewSale).toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg border p-3 bg-muted/20">
                  <p className="text-xs text-muted-foreground">{t("discount") || "Discount"}</p>
                  <p className="font-medium text-lg text-amber-600">
                    {viewSale.discountAmount ? viewSale.discountAmount.toFixed(2) : "0.00"}
                  </p>
                </div>
                <div className="rounded-lg border p-3 bg-muted/20">
                  <p className="text-xs text-muted-foreground">{t("total")}</p>
                  <p className="font-medium text-lg">
                    {calculateTotal(viewSale).toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg border p-3 bg-muted/20">
                  <p className="text-xs text-muted-foreground">{t("paidAmount")}</p>
                  <p className="font-medium text-lg text-green-600">
                    {viewSale.paidAmount?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div className="rounded-lg border p-3 bg-muted/20">
                  <p className="text-xs text-muted-foreground">{t("dueAmount") || "Due Amount"}</p>
                  <p className="font-medium text-lg text-red-600">
                    {Math.max(0, calculateTotal(viewSale) - (viewSale.paidAmount || 0)).toFixed(2)}
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
                    {viewSale.vehicleNo && (
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          Vehicle No.
                        </p>
                        <p className="font-medium">{viewSale.vehicleNo}</p>
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
                                  <div 
                                    className="text-sm text-muted-foreground mt-1"
                                    dangerouslySetInnerHTML={{ __html: item.itemDescription }}
                                  />
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <span>
                                    {t("quantity")}: {item.quantity} {item.unit}
                                  </span>
                                  <span>
                                    {t("price")}: {item.price.toFixed(2)}
                                  </span>
                                  <span>
                                    {t("subtotal")}:{" "}
                                    {(item.price * item.quantity).toFixed(2)}
                                  </span>
                                  {(item.discountAmount ?? 0) > 0 && (
                                    <span className="text-amber-600">
                                      {t("discount") || "Discount"}:{" "}
                                      {(item.discountAmount ?? 0).toFixed(2)}{item.discountType === "PERCENTAGE" ? "%" : ""}
                                    </span>
                                  )}
                                  <span className="font-medium text-primary">
                                    {t("total") || "Total"}:{" "}
                                    {(item.totalPrice || 0).toFixed(2)}
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

              {/* Payments Section */}
              {viewSale.payments && viewSale.payments.length > 0 && (
                <div id="payments-section" className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{t("payments") || "Payments"}</h4>
                    <span className="text-sm text-muted-foreground">
                      {viewSale.payments.length} {tCommon("items") || "items"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {viewSale.payments.map((payment: Payment) => (
                      <div
                        key={payment.id}
                        className="rounded-lg border p-3 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={payment.type === "EXPENSE" ? "destructive" : "default"}>
                              {payment.type === "SALE_PAYMENT" 
                                ? t("paymentTypeSale") || "Sale Payment" 
                                : payment.type === "EXPENSE"
                                ? t("paymentTypeRefund") || "Refund Payment"
                                : t("paymentTypePurchase") || "Purchase Payment"}
                            </Badge>
                            {payment.accountId && (
                              <span className="text-sm text-muted-foreground">
                                {t("account") || "Account"}: {payment.account?.name || payment.accountId.slice(0, 8) + "..."}
                              </span>
                            )}
                          </div>
                          {payment.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{payment.notes}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {payment.occurredAt
                              ? new Date(payment.occurredAt).toLocaleDateString()
                              : "-"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${payment.type === "EXPENSE" ? "text-destructive" : "text-green-600"}`}>
                            {payment.type === "EXPENSE" ? "-" : ""}{formatCurrency(payment.amount, { generalSettings })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
            setSelectedSales([]) // clear selection after dialog closes
          }
        }}
        defaultType="SALE_PAYMENT"
        defaultSaleId={paymentSale?.id}
        defaultSales={selectedSales.length > 0 ? selectedSales : undefined}
        defaultContactId={paymentSale?.contactId}
        defaultBranchId={paymentSale?.branchId}
        defaultAccountId={undefined}
        onPaymentSuccess={(res) => {
          if (selectedSales.length > 0) {
            const allocations = selectedSales.map(s => {
              const dueAmount = (s.totalAmount || s.totalPrice || 0) - (s.paidAmount || 0);
              return {
                saleId: s.id,
                invoiceNumber: s.invoiceNumber || s.id,
                appliedAmount: dueAmount
              }
            }).filter(a => a.appliedAmount > 0);

            const totalPaid = allocations.reduce((sum, a) => sum + a.appliedAmount, 0);

            setReceiptData({
              contactName: selectedSales[0].contact?.name || "Customer",
              totalPaid,
              remainingDeposit: 0,
              allocations,
              date: new Date().toISOString()
            });
            setIsReceiptOpen(true);
            setSelectedSales([]);
          }
          refetch();
        }}
        defaultAmount={
          paymentSale
            ? (paymentSale.totalAmount || paymentSale.totalPrice || 0) - (paymentSale.paidAmount || 0)
            : selectedSales.length > 0
            ? selectedSales.reduce((acc, s) => acc + ((s.totalAmount || s.totalPrice || 0) - (s.paidAmount || 0)), 0)
            : undefined
        }
      />
      
      <PaymentReceiptDialog
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        data={receiptData}
      />
    </PageLayout>
  )
}
