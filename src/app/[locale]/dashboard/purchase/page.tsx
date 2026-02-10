"use client"

import { DataTable, type Column } from "@/components/common/data-table"
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog"
import { ExportButton } from "@/components/common/export-button"
import { InvoiceDialog } from "@/components/common/invoice-dialog"
import { PageLayout } from "@/components/common/page-layout"
import { PaymentDialog } from "@/components/common/payment-dialog"
import { PurchaseDialog } from "@/components/common/purchase-dialog"
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
import { type PurchasesListParams } from "@/lib/api/purchases"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { useDeletePurchase, usePurchases } from "@/lib/hooks/use-purchases"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { formatCurrency } from "@/lib/utils/currency"
import { type ExportColumn } from "@/lib/utils/export"
import { Purchase } from "@/types"
import { CreditCard, Eye, FileText, Mail, MoreVertical, Package, Pencil, Phone, Plus, Search, Trash2, User } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

export default function PurchasePage() {
  const t = useTranslations("purchases")
  const tCommon = useTranslations("common")
  const tModules = useTranslations("modulesPages.purchases")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string

  const currentBusiness = useCurrentBusiness()
  const { selectedBranchId } = useBranchSelection()
  const { generalSettings } = useAppSettings()
  const deleteMutation = useDeletePurchase()

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const limit = 10

  // View mode with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("purchases-view-mode") as ViewMode) || "cards"
    }
    return "cards"
  })

  // Save view mode preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("purchases-view-mode", viewMode)
    }
  }, [viewMode])

  const queryParams = useMemo(() => {
    const trimmed = search.trim()
    const params: PurchasesListParams = {
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

  const { data, isLoading } = usePurchases(queryParams)
  const purchases = data?.items ?? []
  const meta = data?.meta
  const total = meta?.total ?? purchases.length
  const totalPages =
    meta?.totalPages ??
    Math.max(1, Math.ceil((total || 0) / (meta?.limit ?? limit)))
  const currentPage = meta?.page ?? page

  // Table columns configuration
  const tableColumns: Column<Purchase>[] = useMemo(
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
            PENDING: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
            COMPLETED: "bg-green-500/10 text-green-600 dark:text-green-400",
            CANCELLED: "bg-red-500/10 text-red-600 dark:text-red-400",
          }
          const statusLabels = {
            PENDING: t("statusPending"),
            COMPLETED: t("statusCompleted"),
            CANCELLED: t("statusCancelled"),
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
        id: "totalAmount",
        header: t("total"),
        accessorKey: "totalPrice",
        cell: (row) => (row.totalPrice || row.totalAmount || 0)?.toFixed(2) || "0.00",
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
        header: t("dueAmount"),
        accessorKey: "dueAmount",
        cell: (row) => row.dueAmount?.toFixed(2) || "0.00",
        sortable: true,
      },
      {
        id: "items",
        header: t("items"),
        cell: (row) => row.items?.length || 0,
        sortable: false,
      },
    ],
    [t]
  )

  // Export columns configuration
  const exportColumns: ExportColumn<Purchase>[] = useMemo(
    () => [
      { key: "contactId", header: "Contact ID", width: 20 },
      {
        key: "branch",
        header: "Branch",
        format: (value, row) => row.branch?.name || "-",
      },
      { key: "status", header: "Status", width: 15 },
      {
        key: "totalPrice",
        header: "Total Amount",
        format: (value, row) => ((row.totalPrice || row.totalAmount || 0) ? Number(row.totalPrice || row.totalAmount || 0).toFixed(2) : "0.00"),
      },
      {
        key: "paidAmount",
        header: "Paid Amount",
        format: (value) => (value ? Number(value).toFixed(2) : "0.00"),
      },
      {
        key: "dueAmount",
        header: "Due Amount",
        format: (value) => (value ? Number(value).toFixed(2) : "0.00"),
      },
      {
        key: "items",
        header: "Items Count",
        format: (value, row) => row.items?.length || 0,
      },
      {
        key: "items",
        header: "Items",
        format: (value, row) =>
          row.items
            ?.map(
              (item) =>
                `${item.itemName} (${item.quantity} ${item.unit}) - ${item.price}`
            )
            .join("; ") || "-",
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

  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null)
  const [viewPurchase, setViewPurchase] = useState<Purchase | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [paymentPurchase, setPaymentPurchase] = useState<Purchase | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [showPaymentsSection, setShowPaymentsSection] = useState(false)
  const [receiptPurchase, setReceiptPurchase] = useState<Purchase | null>(null)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)

  // Secure by module access (purchases)
  useEffect(() => {
    if (currentBusiness && !currentBusiness.modules?.includes("purchases")) {
      router.push(`/${locale}/dashboard`)
    }
  }, [currentBusiness, locale, router])

  if (!currentBusiness?.modules?.includes("purchases")) {
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
    setSelectedPurchase(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setIsDialogOpen(true)
  }

  const handleView = (purchase: Purchase) => {
    setViewPurchase(purchase)
    setShowPaymentsSection(false)
    setIsViewOpen(true)
  }

  const handleViewPayments = (purchase: Purchase) => {
    setViewPurchase(purchase)
    setIsViewOpen(true)
    setShowPaymentsSection(true)
  }

  const handleDelete = (purchase: Purchase) => {
    setPurchaseToDelete(purchase)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (!purchaseToDelete) return
    deleteMutation.mutate(purchaseToDelete.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        setPurchaseToDelete(null)
      },
    })
  }

  const handleAddPayment = (purchase: Purchase) => {
    setPaymentPurchase(purchase)
    setIsPaymentDialogOpen(true)
  }

  const handleViewReceipt = (purchase: Purchase) => {
    setReceiptPurchase(purchase)
    setIsReceiptOpen(true)
  }

  // Scroll to payments section when showPaymentsSection is true
  useEffect(() => {
    if (showPaymentsSection && viewPurchase && isViewOpen) {
      const timer = setTimeout(() => {
        const paymentsSection = document.getElementById('purchase-payments-section')
        if (paymentsSection) {
          paymentsSection.scrollIntoView({ behavior: "smooth", block: "start" })
          setShowPaymentsSection(false)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [showPaymentsSection, viewPurchase, isViewOpen])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
      case "COMPLETED":
        return "bg-green-500/10 text-green-600 dark:text-green-400"
      case "CANCELLED":
        return "bg-red-500/10 text-red-600 dark:text-red-400"
      default:
        return ""
    }
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
                data={purchases}
                columns={exportColumns}
                filename="purchases"
                disabled={isLoading || purchases.length === 0}
              />
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createPurchase")}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <SkeletonList count={6} />
          ) : purchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("noPurchases")}</h3>
              <p className="text-muted-foreground mb-4">{t("noPurchasesDescription")}</p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createPurchase")}
              </Button>
            </div>
          ) : viewMode === "table" ? (
            <div className="rounded-md border">
              <DataTable
                data={purchases}
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
                      <DropdownMenuItem onClick={() => handleViewReceipt(row)}>
                        <FileText className="mr-2 h-4 w-4" />
                        {tCommon("receipt") || "Receipt"}
                      </DropdownMenuItem>
                      {row.payments && row.payments.length > 0 && (
                        <DropdownMenuItem onClick={() => handleViewPayments(row)}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          View Payments
                        </DropdownMenuItem>
                      )}
                      {(row.dueAmount || 0) > 0 && (
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
                emptyMessage={t("noPurchases")}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {purchases.map((p) => (
                <Card key={p.id} className="relative">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{p.contact?.name || `Contact: ${p.contactId}`}</h4>
                          <Badge className={getStatusColor(p.status)}>
                            {p.status === "PENDING"
                              ? t("statusPending")
                              : p.status === "COMPLETED"
                              ? t("statusCompleted")
                              : t("statusCancelled")}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">{t("branch")}: </span>
                            <span>{p.branch?.name || "-"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t("total")}: </span>
                            <span className="font-medium">
                              {(p.totalPrice || p.totalAmount || 0)?.toFixed(2) || "0.00"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t("paidAmount")}: </span>
                            <span className="font-medium text-green-600">
                              {p.paidAmount?.toFixed(2) || "0.00"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t("dueAmount")}: </span>
                            <span className="font-medium text-red-600">
                              {p.dueAmount?.toFixed(2) || "0.00"}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {t("items")}: {p.items?.length || 0}
                        </div>
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
                          <DropdownMenuItem onClick={() => handleViewReceipt(p)}>
                            <FileText className="mr-2 h-4 w-4" />
                            {tCommon("receipt") || "Receipt"}
                          </DropdownMenuItem>
                          {p.payments && p.payments.length > 0 && (
                            <DropdownMenuItem onClick={() => handleViewPayments(p)}>
                              <CreditCard className="mr-2 h-4 w-4" />
                              View Payments
                            </DropdownMenuItem>
                          )}
                          {(p.dueAmount || 0) > 0 && (
                            <DropdownMenuItem onClick={() => handleAddPayment(p)}>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Add Payment
                            </DropdownMenuItem>
                          )}
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

      <PurchaseDialog
        purchase={selectedPurchase}
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
            <SheetTitle>{t("detailsTitle")}</SheetTitle>
            <SheetDescription>{t("detailsDescription")}</SheetDescription>
          </SheetHeader>
          {viewPurchase ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{viewPurchase.contact?.name || `Contact: ${viewPurchase.contactId}`}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("branch")}: {viewPurchase.branch?.name || "-"}
                  </p>
                </div>
                <Badge className={getStatusColor(viewPurchase.status)}>
                  {viewPurchase.status === "PENDING"
                    ? t("statusPending")
                    : viewPurchase.status === "COMPLETED"
                    ? t("statusCompleted")
                    : t("statusCancelled")}
                </Badge>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{t("total")}</p>
                  <p className="font-medium text-lg">
                    {(viewPurchase.totalPrice || viewPurchase.totalAmount || 0)?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Tax</p>
                  <div className="flex items-center gap-1">
                     <p className="font-medium text-lg">
                       {(viewPurchase.taxAmount || 0).toFixed(2)} 
                     </p>
                     {viewPurchase.taxType === "PERCENTAGE" && viewPurchase.taxRate && (
                        <span className="text-xs text-muted-foreground">
                          ({viewPurchase.taxRate}%)
                        </span>
                     )}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{t("paidAmount")}</p>
                  <p className="font-medium text-lg text-green-600">
                    {viewPurchase.paidAmount?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{t("dueAmount")}</p>
                  <p className="font-medium text-lg text-red-600">
                    {viewPurchase.dueAmount?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              {viewPurchase.contact && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <h4 className="font-medium">{t("contactInformation")}</h4>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">{t("contactName")}</p>
                      <p className="font-medium">{viewPurchase.contact.name}</p>
                      <Badge className="mt-2" variant="outline">
                        {viewPurchase.contact.type === "CUSTOMER" ? t("typeCustomer") : t("typeSupplier")}
                      </Badge>
                    </div>
                    {viewPurchase.contact.email && (
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {t("email")}
                        </p>
                        <p className="font-medium">{viewPurchase.contact.email}</p>
                      </div>
                    )}
                    {viewPurchase.contact.phone && (
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {t("phone")}
                        </p>
                        <p className="font-medium">{viewPurchase.contact.phone}</p>
                      </div>
                    )}
                    {viewPurchase.contact.address && (
                      <div className="rounded-lg border p-3 sm:col-span-2">
                        <p className="text-xs text-muted-foreground">{t("address")}</p>
                        <p className="font-medium">{viewPurchase.contact.address}</p>
                      </div>
                    )}
                    {!viewPurchase.contact.isIndividual && viewPurchase.contact.companyName && (
                      <>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">{t("companyName")}</p>
                          <p className="font-medium">{viewPurchase.contact.companyName}</p>
                        </div>
                        {viewPurchase.contact.companyPhone && (
                          <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">{t("companyPhone")}</p>
                            <p className="font-medium">{viewPurchase.contact.companyPhone}</p>
                          </div>
                        )}
                        {viewPurchase.contact.companyAddress && (
                          <div className="rounded-lg border p-3 sm:col-span-2">
                            <p className="text-xs text-muted-foreground">{t("companyAddress")}</p>
                            <p className="font-medium">{viewPurchase.contact.companyAddress}</p>
                          </div>
                        )}
                      </>
                    )}
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">{t("balance")}</p>
                      <p className="font-medium">{viewPurchase.contact.balance?.toFixed(2) || "0.00"}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">{t("creditLimit")}</p>
                      <p className="font-medium">{viewPurchase.contact.creditLimit?.toFixed(2) || "0.00"}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 border-t pt-4">
                <h4 className="font-medium">{t("items")}</h4>
                {viewPurchase.items && viewPurchase.items.length > 0 ? (
                  <div className="space-y-2">
                    {viewPurchase.items.map((item, index) => (
                      <Card key={index} className="border">
                        <CardContent className="py-3">
                          <div className="flex items-start justify-between gap-3">
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
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                    {t("noPurchases")}
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground border-t pt-4">
                <div>
                  <p className="text-xs uppercase tracking-wide">{tCommon("createdAt")}</p>
                  <p className="font-medium text-foreground">
                    {viewPurchase?.createdAt
                      ? new Date(viewPurchase.createdAt).toLocaleString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide">{tCommon("updatedAt")}</p>
                  <p className="font-medium text-foreground">
                    {viewPurchase?.updatedAt
                      ? new Date(viewPurchase.updatedAt).toLocaleString()
                      : "-"}
                  </p>
                </div>
              </div>

              {/* Payments Section */}
              <div id="purchase-payments-section" className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{t("payments") || "Payments"}</h4>
                  {(viewPurchase?.dueAmount || 0) > 0 && (
                     <Button 
                       size="sm" 
                       variant="outline" 
                       onClick={() => handleAddPayment(viewPurchase as Purchase)}
                     >
                       <Plus className="h-4 w-4 mr-2" />
                       Add Payment
                     </Button>
                   )}
                </div>
                
                {viewPurchase?.payments && viewPurchase.payments.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-sm text-muted-foreground">
                        {viewPurchase.payments.length} {tCommon("items") || "items"}
                       </span>
                    </div>
                    <div className="space-y-2">
                      {viewPurchase.payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="rounded-lg border p-3 flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="default">
                                {payment.type === "SALE_PAYMENT" ? "Sale Payment" : "Purchase Payment"}
                              </Badge>
                              {payment.accountId && (
                                <span className="text-sm text-muted-foreground">
                                  Account: {payment.accountId.slice(0, 8)}...
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
                            <p className="font-semibold text-green-600">
                              {formatCurrency(payment.amount, { generalSettings })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                    No payments record found.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={(open) => {
          setIsPaymentDialogOpen(open)
          if (!open) {
            setPaymentPurchase(null)
          }
        }}
        defaultType="PURCHASE_PAYMENT"
        defaultPurchaseId={paymentPurchase?.id}
        defaultContactId={paymentPurchase?.contactId}
        defaultBranchId={paymentPurchase?.branchId}
        defaultAmount={
          paymentPurchase
            ? (paymentPurchase.totalPrice || paymentPurchase.totalAmount || 0) - (paymentPurchase.paidAmount || 0)
            : undefined
        }
      />
      
      <InvoiceDialog
        purchase={receiptPurchase}
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
      />
    </PageLayout>
  )
}
