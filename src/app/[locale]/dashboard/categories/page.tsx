"use client"

import { CategoryDialog } from "@/components/common/category-dialog"
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
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import {
    useCategories,
    useDeleteCategory,
} from "@/lib/hooks/use-categories"
import { type ExportColumn } from "@/lib/utils/export"
import { Category } from "@/types"
import { FolderTree, MoreVertical, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

export default function CategoriesPage() {
  const t = useTranslations("categories")
  const tCommon = useTranslations("common")
  const { selectedBranchId } = useBranchSelection()
  const { data: categories = [], isLoading } = useCategories(selectedBranchId || undefined)
  const deleteCategoryMutation = useDeleteCategory()
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [search, setSearch] = useState("")
  
  // View mode with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("categories-view-mode") as ViewMode) || "cards"
    }
    return "cards"
  })

  // Save view mode preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("categories-view-mode", viewMode)
    }
  }, [viewMode])

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories
    const searchLower = search.toLowerCase()
    return categories.filter((category) =>
      category.name.toLowerCase().includes(searchLower) ||
      (category.parent?.name && category.parent.name.toLowerCase().includes(searchLower))
    )
  }, [categories, search])

  const handleCreate = () => {
    setSelectedCategory(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setIsDialogOpen(true)
  }

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteCategoryMutation.mutate(categoryToDelete.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false)
          setCategoryToDelete(null)
        },
      })
    }
  }

  // Export columns configuration
  const exportColumns: ExportColumn<Category>[] = useMemo(() => [
    { key: "name", header: "Category Name", width: 30 },
    {
      key: "parent",
      header: "Parent Category",
      width: 30,
      format: (value, row) => {
        if (row.parent) return row.parent.name
        if (row.parentId) return row.parentId // Fallback to ID if parent not loaded
        return "None (Top Level)"
      },
    },
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

  // Build category tree structure
  const buildCategoryTree = (categories: Category[]): Category[] => {
    const categoryMap = new Map<string, Category & { children: Category[] }>()
    const rootCategories: Category[] = []

    // First pass: create map with children arrays
    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })

    // Second pass: build tree
    categories.forEach((cat) => {
      const categoryWithChildren = categoryMap.get(cat.id)!
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        const parent = categoryMap.get(cat.parentId)!
        parent.children.push(categoryWithChildren)
      } else {
        rootCategories.push(categoryWithChildren)
      }
    })

    return rootCategories
  }

  const renderCategoryTree = (categoryList: Category[], level = 0) => {
    return categoryList.map((category) => {
      const hasChildren = (category as any).children?.length > 0
      return (
        <div key={category.id} className="space-y-2">
          <div
            className={`flex items-center justify-between rounded-lg border p-4 hover:bg-accent ${
              level > 0 ? "ml-6 border-l-2" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <FolderTree className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">{category.name}</div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(category)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {tCommon("edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(category)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {tCommon("delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {hasChildren &&
            renderCategoryTree((category as any).children, level + 1)}
        </div>
      )
    })
  }

  const categoryTree = buildCategoryTree(filteredCategories)

  // Table columns configuration
  const tableColumns: Column<Category>[] = useMemo(() => [
    {
      id: "name",
      header: t("name"),
      accessorKey: "name",
      sortable: true,
    },
    {
      id: "parent",
      header: t("parentCategory") || "Parent Category",
      cell: (row) => row.parent?.name || "-",
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
                <FolderTree className="h-6 w-6" />
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
                data={filteredCategories}
                columns={exportColumns}
                filename="categories"
                disabled={isLoading || filteredCategories.length === 0}
              />
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createCategory")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder") || "Search categories..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          {isLoading ? (
            <SkeletonList count={5} />
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderTree className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {search ? t("noResults") || "No results found" : t("noCategories")}
              </h3>
              <p className="text-muted-foreground mb-4">
                {search
                  ? t("noResultsDescription") || "Try adjusting your search"
                  : t("noCategoriesDescription")}
              </p>
              {!search && (
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("createCategory")}
                </Button>
              )}
            </div>
          ) : viewMode === "table" ? (
            <DataTable
              columns={tableColumns}
              data={filteredCategories}
              getRowId={(row) => row.id}
              enableRowSelection={false}
              emptyMessage={t("noCategories")}
            />
          ) : (
            <div className="space-y-2">{renderCategoryTree(categoryTree)}</div>
          )}
        </CardContent>
      </Card>

      <CategoryDialog
        category={selectedCategory}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDescription", { name: categoryToDelete?.name || "" })}
        isLoading={deleteCategoryMutation.isPending}
      />
    </PageLayout>
  )
}
