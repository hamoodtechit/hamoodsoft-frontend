"use client"

import { DataTable, type Column } from "@/components/common/data-table"
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog"
import { ExportButton } from "@/components/common/export-button"
import { PageLayout } from "@/components/common/page-layout"
import { UnitDialog } from "@/components/common/unit-dialog"
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
import { useDeleteUnit, useUnits } from "@/lib/hooks/use-units"
import { useHasModuleAccess, useHasPermission } from "@/lib/hooks/use-permissions"
import { PermissionGuard } from "@/components/common/permission-guard"
import { PERMISSIONS, MODULES } from "@/lib/utils/permissions"
import { useModuleAccessCheck } from "@/lib/hooks/use-permission-check"
import { type ExportColumn } from "@/lib/utils/export"
import { Unit } from "@/types"
import { MoreVertical, Pencil, Plus, Ruler, Search, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

export default function UnitsPage() {
  const t = useTranslations("units")
  const tCommon = useTranslations("common")
  const tModules = useTranslations("modulesPages.inventory")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const { user } = useAuth()
  const currentBusiness = useCurrentBusiness()
  const { selectedBranchId } = useBranchSelection()
  const { data: units = [], isLoading } = useUnits(selectedBranchId || undefined)
  const deleteUnitMutation = useDeleteUnit()
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null)
  const [search, setSearch] = useState("")
  
  // View mode with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("units-view-mode") as ViewMode) || "cards"
    }
    return "cards"
  })

  // Save view mode preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("units-view-mode", viewMode)
    }
  }, [viewMode])

  // Filter units by search
  const filteredUnits = useMemo(() => {
    if (!search.trim()) return units
    const searchLower = search.toLowerCase()
    return units.filter((unit) =>
      unit.name.toLowerCase().includes(searchLower) ||
      unit.suffix.toLowerCase().includes(searchLower)
    )
  }, [units, search])

  // Permission checks
  const { hasAccess, isLoading: isCheckingAccess } = useModuleAccessCheck(MODULES.INVENTORY)
  const canCreate = useHasPermission(PERMISSIONS.UNITS_CREATE)
  const canUpdate = useHasPermission(PERMISSIONS.UNITS_UPDATE)
  const canDelete = useHasPermission(PERMISSIONS.UNITS_DELETE)

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
            <p className="text-muted-foreground">
              {tModules("noAccessDescription")}
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  const handleCreate = () => {
    setSelectedUnit(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (unit: Unit) => {
    setSelectedUnit(unit)
    setIsDialogOpen(true)
  }

  const handleDelete = (unit: Unit) => {
    setUnitToDelete(unit)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (unitToDelete) {
      deleteUnitMutation.mutate(unitToDelete.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false)
          setUnitToDelete(null)
        },
      })
    }
  }

  // Table columns configuration
  const tableColumns: Column<Unit>[] = useMemo(() => [
    {
      id: "name",
      header: t("name"),
      accessorKey: "name",
      sortable: true,
    },
    {
      id: "suffix",
      header: t("suffix"),
      accessorKey: "suffix",
      sortable: true,
      cell: (row) => <span className="font-mono">{row.suffix}</span>,
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
  const exportColumns: ExportColumn<Unit>[] = useMemo(() => [
    { key: "name", header: "Unit Name", width: 25 },
    { key: "suffix", header: "Unit Suffix", width: 20 },
    {
      key: "createdAt",
      header: "Created At",
      width: 20,
      format: (value) => (value ? new Date(value).toLocaleString() : "-"),
    },
    {
      key: "updatedAt",
      header: "Updated At",
      width: 20,
      format: (value) => (value ? new Date(value).toLocaleString() : "-"),
    },
  ], [])

  return (
    <PageLayout
      title={t("title")}
      description={t("description")}
      maxWidth="full"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Ruler className="h-6 w-6" />
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
            <div className="flex items-center gap-2">
              <ViewToggle view={viewMode} onViewChange={setViewMode} />
              <ExportButton
                data={filteredUnits}
                columns={exportColumns}
                filename="units"
                disabled={isLoading || filteredUnits.length === 0}
              />
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createUnit")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder") || "Search units..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          {isLoading ? (
            <SkeletonList count={5} />
          ) : filteredUnits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Ruler className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {search ? t("noResults") || "No results found" : t("noUnits")}
              </h3>
              <p className="text-muted-foreground mb-4">
                {search
                  ? t("noResultsDescription") || "Try adjusting your search"
                  : t("noUnitsDescription")}
              </p>
              {!search && (
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("createUnit")}
                </Button>
              )}
            </div>
          ) : viewMode === "table" ? (
            <DataTable
              columns={tableColumns}
              data={filteredUnits}
              getRowId={(row) => row.id}
              enableRowSelection={false}
              emptyMessage={t("noUnits")}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredUnits.map((unit) => (
                <Card key={unit.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{unit.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {t("suffix")}: <span className="font-mono font-medium">{unit.suffix}</span>
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(unit)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {tCommon("edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(unit)}
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

      <UnitDialog
        unit={selectedUnit}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDescription", { name: unitToDelete?.name || "" })}
        isLoading={deleteUnitMutation.isPending}
      />
    </PageLayout>
  )
}
