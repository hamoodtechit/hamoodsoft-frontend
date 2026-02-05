"use client"

import { AttributeDialog } from "@/components/common/attribute-dialog"
import { DataTable, type Column } from "@/components/common/data-table"
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog"
import { ExportButton } from "@/components/common/export-button"
import { PageLayout } from "@/components/common/page-layout"
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
import { useAuth } from "@/lib/hooks/use-auth"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { useAttributes, useCreateAttribute, useDeleteAttribute, useUpdateAttribute } from "@/lib/hooks/use-attributes"
import { useHasModuleAccess, useHasPermission } from "@/lib/hooks/use-permissions"
import { PermissionGuard } from "@/components/common/permission-guard"
import { PERMISSIONS, MODULES } from "@/lib/utils/permissions"
import { useModuleAccessCheck } from "@/lib/hooks/use-permission-check"
import { type ExportColumn } from "@/lib/utils/export"
import { Attribute } from "@/types"
import { MoreVertical, Pencil, Plus, Search, Tag, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

export default function AttributesPage() {
  const t = useTranslations("attributes")
  const tCommon = useTranslations("common")
  const tModules = useTranslations("modulesPages.inventory")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const { user } = useAuth()
  const currentBusiness = useCurrentBusiness()
  const { selectedBranchId } = useBranchSelection()
  const { data: attributesData, isLoading } = useAttributes()
  const attributes = attributesData?.items || []
  const createAttributeMutation = useCreateAttribute()
  const updateAttributeMutation = useUpdateAttribute()
  const deleteAttributeMutation = useDeleteAttribute()
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [attributeToDelete, setAttributeToDelete] = useState<Attribute | null>(null)
  const [search, setSearch] = useState("")
  
  // View mode with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("attributes-view-mode") as ViewMode) || "cards"
    }
    return "cards"
  })

  // Save view mode preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("attributes-view-mode", viewMode)
    }
  }, [viewMode])

  // Filter attributes by search
  const filteredAttributes = useMemo(() => {
    if (!search.trim()) return attributes
    const searchLower = search.toLowerCase()
    return attributes.filter((attribute) =>
      attribute.name.toLowerCase().includes(searchLower) ||
      attribute.values.some((value) => value.toLowerCase().includes(searchLower))
    )
  }, [attributes, search])

  // Permission checks
  const { hasAccess, isLoading: isCheckingAccess } = useModuleAccessCheck(MODULES.INVENTORY)
  const canCreate = useHasPermission(PERMISSIONS.ATTRIBUTES_CREATE)
  const canUpdate = useHasPermission(PERMISSIONS.ATTRIBUTES_UPDATE)
  const canDelete = useHasPermission(PERMISSIONS.ATTRIBUTES_DELETE)

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
    setSelectedAttribute(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (attribute: Attribute) => {
    setSelectedAttribute(attribute)
    setIsDialogOpen(true)
  }

  const handleDelete = (attribute: Attribute) => {
    setAttributeToDelete(attribute)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (attributeToDelete) {
      deleteAttributeMutation.mutate(attributeToDelete.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false)
          setAttributeToDelete(null)
        },
      })
    }
  }

  const handleSubmitCreate = (data: any) => {
    createAttributeMutation.mutate(data, {
      onSuccess: () => {
        setIsDialogOpen(false)
        setSelectedAttribute(null)
      },
    })
  }

  const handleSubmitUpdate = (id: string, data: any) => {
    updateAttributeMutation.mutate(
      { id, data },
      {
        onSuccess: () => {
          setIsDialogOpen(false)
          setSelectedAttribute(null)
        },
      }
    )
  }

  // Table columns configuration
  const tableColumns: Column<Attribute>[] = useMemo(() => [
    {
      id: "name",
      header: t("name"),
      accessorKey: "name",
      sortable: true,
    },
    {
      id: "values",
      header: t("values"),
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.values.map((value, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {value}
            </Badge>
          ))}
        </div>
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
  const exportColumns: ExportColumn<Attribute>[] = useMemo(
    () => [
      { key: "name", header: "Attribute Name", width: 30 },
      {
        key: "values",
        header: "Values",
        width: 50,
        format: (value, row) => row.values.join(", "),
      },
      {
        key: "createdAt",
        header: "Created At",
        width: 20,
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
                <Tag className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>{t("title")}</CardTitle>
                <CardDescription>{t("description")}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ViewToggle view={viewMode} onViewChange={setViewMode} />
              <ExportButton
                data={filteredAttributes}
                columns={exportColumns}
                filename="attributes"
                disabled={isLoading || filteredAttributes.length === 0}
              />
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createAttribute")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder") || "Search attributes..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          {isLoading ? (
            <SkeletonList count={5} />
          ) : filteredAttributes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Tag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {search ? t("noResults") || "No results found" : t("noAttributes")}
              </h3>
              <p className="text-muted-foreground mb-4">
                {search
                  ? t("noResultsDescription") || "Try adjusting your search"
                  : t("noAttributesDescription")}
              </p>
              {!search && (
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("createAttribute")}
                </Button>
              )}
            </div>
          ) : viewMode === "table" ? (
            <DataTable
              columns={tableColumns}
              data={filteredAttributes}
              getRowId={(row) => row.id}
              enableRowSelection={false}
              emptyMessage={t("noAttributes")}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAttributes.map((attribute) => (
                <Card key={attribute.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{attribute.name}</CardTitle>
                        <CardDescription className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {attribute.values.map((value, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {value}
                              </Badge>
                            ))}
                          </div>
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(attribute)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {tCommon("edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(attribute)}
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

      <AttributeDialog
        attribute={selectedAttribute}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmitCreate={handleSubmitCreate}
        onSubmitUpdate={handleSubmitUpdate}
        isLoading={createAttributeMutation.isPending || updateAttributeMutation.isPending}
      />

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDescription")}
        isLoading={deleteAttributeMutation.isPending}
      />
    </PageLayout>
  )
}
