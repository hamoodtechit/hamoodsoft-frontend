"use client"

import { BrandDialog } from "@/components/common/brand-dialog"
import { DataTable, type Column } from "@/components/common/data-table"
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog"
import { ExportButton } from "@/components/common/export-button"
import { PageLayout } from "@/components/common/page-layout"
import { ViewToggle, type ViewMode } from "@/components/common/view-toggle"
import { SkeletonList } from "@/components/skeletons/skeleton-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/hooks/use-auth"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { useBrands, useCreateBrand, useDeleteBrand, useUpdateBrand } from "@/lib/hooks/use-brands"
import { useHasModuleAccess, useHasPermission } from "@/lib/hooks/use-permissions"
import { PermissionGuard } from "@/components/common/permission-guard"
import { PERMISSIONS, MODULES } from "@/lib/utils/permissions"
import { useModuleAccessCheck } from "@/lib/hooks/use-permission-check"
import { type ExportColumn } from "@/lib/utils/export"
import { Brand } from "@/types"
import { Building2, MoreVertical, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

export default function BrandsPage() {
  const t = useTranslations("brands")
  const tCommon = useTranslations("common")
  const tModules = useTranslations("modulesPages.inventory")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const { user } = useAuth()
  const currentBusiness = useCurrentBusiness()
  const { selectedBranchId } = useBranchSelection()
  const { data: brandsData, isLoading } = useBrands()
  const brands = brandsData?.items || []
  const deleteBrandMutation = useDeleteBrand()
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null)
  const [search, setSearch] = useState("")
  
  // View mode with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("brands-view-mode") as ViewMode) || "cards"
    }
    return "cards"
  })

  // Save view mode preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("brands-view-mode", viewMode)
    }
  }, [viewMode])

  // Filter brands by search
  const filteredBrands = useMemo(() => {
    if (!search.trim()) return brands
    const searchLower = search.toLowerCase()
    return brands.filter((brand) =>
      brand.name.toLowerCase().includes(searchLower) ||
      (brand.description && brand.description.toLowerCase().includes(searchLower))
    )
  }, [brands, search])

  // Permission checks
  const { hasAccess, isLoading: isCheckingAccess } = useModuleAccessCheck(MODULES.INVENTORY)
  const canCreate = useHasPermission(PERMISSIONS.BRANDS_CREATE)
  const canUpdate = useHasPermission(PERMISSIONS.BRANDS_UPDATE)
  const canDelete = useHasPermission(PERMISSIONS.BRANDS_DELETE)

  // Check if user has access to inventory module
  useEffect(() => {
    if (!isCheckingAccess && !hasAccess) {
      router.push(`/${locale}/dashboard`)
    }
  }, [hasAccess, isCheckingAccess, locale, router])

  // Show loading while checking permissions
  if (isCheckingAccess) {
    return (
      <PageLayout title={t("title")} description={t("description")}>
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

  const handleCreate = () => {
    setSelectedBrand(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (brand: Brand) => {
    setSelectedBrand(brand)
    setIsDialogOpen(true)
  }

  const handleDelete = (brand: Brand) => {
    setBrandToDelete(brand)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (brandToDelete) {
      deleteBrandMutation.mutate(brandToDelete.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false)
          setBrandToDelete(null)
        },
      })
    }
  }

  const handleSubmitCreate = (data: any) => {
    // Handled by BrandDialog internally
    setIsDialogOpen(false)
    setSelectedBrand(null)
  }

  const handleSubmitUpdate = (id: string, data: any) => {
    // Handled by BrandDialog internally
    setIsDialogOpen(false)
    setSelectedBrand(null)
  }

  // Table columns configuration
  const tableColumns: Column<Brand>[] = useMemo(() => [
    {
      id: "name",
      header: t("name"),
      accessorKey: "name",
      sortable: true,
    },
    {
      id: "description",
      header: t("description"),
      cell: (row) => (
        <span className="text-muted-foreground">{row.description || "-"}</span>
      ),
      sortable: false,
    },
    {
      id: "createdAt",
      header: tCommon("createdAt"),
      cell: (row) => (
        <span className="text-muted-foreground">
          {row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}
        </span>
      ),
      sortable: true,
    },
    {
      id: "actions",
      header: tCommon("actions"),
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">{tCommon("openMenu")}</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
      ),
      enableHiding: false,
    },
  ], [t, tCommon])

  // Export columns configuration
  const exportColumns: ExportColumn<Brand>[] = useMemo(
    () => [
      { key: "name", header: "Brand Name", width: 30 },
      {
        key: "description",
        header: "Description",
        width: 40,
        format: (value) => value || "-",
      },
      {
        key: "createdAt",
        header: "Created At",
        width: 15,
        format: (value) => (value ? new Date(value).toLocaleString() : "-"),
      },
      {
        key: "updatedAt",
        header: "Updated At",
        width: 15,
        format: (value) => (value ? new Date(value).toLocaleString() : "-"),
      },
    ],
    []
  )

  return (
    <PageLayout title={t("title")} description={t("description")} maxWidth="full">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>{t("title")}</CardTitle>
                <CardDescription>{t("description")}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ViewToggle view={viewMode} onViewChange={setViewMode} />
              <ExportButton
                data={filteredBrands}
                columns={exportColumns}
                filename="brands"
                disabled={isLoading || filteredBrands.length === 0}
              />
              <PermissionGuard permission={PERMISSIONS.BRANDS_CREATE}>
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("createBrand")}
                </Button>
              </PermissionGuard>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder") || "Search brands..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          {isLoading ? (
            <SkeletonList count={5} />
          ) : filteredBrands.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {search ? t("noResults") || "No results found" : t("noBrands")}
              </h3>
              <p className="text-muted-foreground mb-4">
                {search
                  ? t("noResultsDescription") || "Try adjusting your search"
                  : t("noBrandsDescription")}
              </p>
              {!search && (
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("createBrand")}
                </Button>
              )}
            </div>
          ) : viewMode === "table" ? (
            <DataTable
              columns={tableColumns}
              data={filteredBrands}
              getRowId={(row) => row.id}
              enableRowSelection={false}
              emptyMessage={t("noBrands")}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredBrands.map((brand) => (
                <Card key={brand.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{brand.name}</CardTitle>
                        {brand.description && (
                          <CardDescription className="mt-1">{brand.description}</CardDescription>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(brand)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {tCommon("edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(brand)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {tCommon("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <BrandDialog
        brand={selectedBrand}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmitCreate={handleSubmitCreate}
        onSubmitUpdate={handleSubmitUpdate}
        isLoading={false}
      />

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDescription")}
        isLoading={deleteBrandMutation.isPending}
      />
    </PageLayout>
  )
}
