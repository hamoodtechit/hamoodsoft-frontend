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
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { useHasModuleAccess, useHasPermission } from "@/lib/hooks/use-permissions"
import { PermissionGuard } from "@/components/common/permission-guard"
import { PERMISSIONS, MODULES } from "@/lib/utils/permissions"
import { useModuleAccessCheck } from "@/lib/hooks/use-permission-check"
import { useParams, useRouter } from "next/navigation"
import { type ExportColumn } from "@/lib/utils/export"
import { Category } from "@/types"
import { FolderTree, MoreVertical, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

export default function CategoriesPage() {
  const t = useTranslations("categories")
  const tCommon = useTranslations("common")
  const tModules = useTranslations("modulesPages.inventory")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const { selectedBranchId } = useBranchSelection()
  const currentBusiness = useCurrentBusiness()
  const { data: categories = [], isLoading } = useCategories(selectedBranchId || undefined)
  const deleteCategoryMutation = useDeleteCategory()
  
  // Permission checks
  const { hasAccess, isLoading: isCheckingAccess } = useModuleAccessCheck(MODULES.INVENTORY)
  const canCreate = useHasPermission(PERMISSIONS.CATEGORIES_CREATE)
  const canUpdate = useHasPermission(PERMISSIONS.CATEGORIES_UPDATE)
  const canDelete = useHasPermission(PERMISSIONS.CATEGORIES_DELETE)
  
  // Secure by module access (inventory)
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

  // Debug: Log categories data
  useEffect(() => {
    console.log("🌳 Categories Page - Raw Categories Data:", {
      categories,
      categoriesCount: categories.length,
      categoriesWithParentId: categories.filter(c => c.parentId),
      categoriesWithoutParentId: categories.filter(c => !c.parentId),
      sampleCategory: categories[0],
      allParentIds: categories.map(c => ({ id: c.id, name: c.name, parentId: c.parentId })),
    })
  }, [categories])
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

  // Flatten nested categories to get all categories (including nested children)
  const allCategoriesFlat = useMemo(() => {
    const flattened: Category[] = []
    
    const traverse = (cats: Category[]) => {
      cats.forEach((cat) => {
        // Add the category itself (without children for flat display)
        flattened.push({
          ...cat,
          children: undefined,
        })
        
        // Recursively traverse children if they exist
        if ((cat as any).children && Array.isArray((cat as any).children) && (cat as any).children.length > 0) {
          traverse((cat as any).children)
        }
      })
    }
    
    traverse(categories)
    console.log("📊 All Categories Flat (for table view):", {
      allCategoriesFlat: flattened,
      count: flattened.length,
      withParentId: flattened.filter(c => c.parentId),
      withoutParentId: flattened.filter(c => !c.parentId),
    })
    return flattened
  }, [categories])

  // Filter categories by search (for table view - uses flattened list)
  const filteredCategoriesForTable = useMemo(() => {
    if (!search.trim()) return allCategoriesFlat
    const searchLower = search.toLowerCase()
    return allCategoriesFlat.filter((category) =>
      category.name.toLowerCase().includes(searchLower) ||
      (category.parent?.name && category.parent.name.toLowerCase().includes(searchLower))
    )
  }, [allCategoriesFlat, search])

  // Filter categories by search (for tree/card view - uses nested structure)
  const filteredCategoriesForTree = useMemo(() => {
    if (!search.trim()) return categories
    const searchLower = search.toLowerCase()
    
    // Filter nested structure recursively
    const filterNested = (cats: Category[]): Category[] => {
      return cats.flatMap((cat) => {
        const matchesSearch =
          cat.name.toLowerCase().includes(searchLower) ||
          (cat.parent?.name && cat.parent.name.toLowerCase().includes(searchLower))

        const filteredChildren =
          (cat as any).children && Array.isArray((cat as any).children)
            ? filterNested((cat as any).children)
            : []

        // Include category if it matches or has matching children
        if (matchesSearch || filteredChildren.length > 0) {
          return [
            {
              ...cat,
              children: filteredChildren,
            } as Category,
          ]
        }

        return []
      })
    }
    
    return filterNested(categories)
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

  // Flatten nested category structure to get all categories
  const flattenCategories = (categories: Category[]): Category[] => {
    const flattened: Category[] = []
    
    const traverse = (cats: Category[]) => {
      cats.forEach((cat) => {
        // Add the category itself
        flattened.push({
          ...cat,
          children: undefined, // Remove children for flat structure
        })
        
        // Recursively traverse children if they exist
        if ((cat as any).children && Array.isArray((cat as any).children) && (cat as any).children.length > 0) {
          traverse((cat as any).children)
        }
      })
    }
    
    traverse(categories)
    return flattened
  }

  // Recursively process nested category structure
  const processNestedCategories = (categories: Category[]): (Category & { children: Category[] })[] => {
    return categories.map((cat) => {
      const processed: Category & { children: Category[] } = {
        ...cat,
        children: [],
      }
      
      // If this category has nested children, process them recursively
      if ((cat as any).children && Array.isArray((cat as any).children) && (cat as any).children.length > 0) {
        processed.children = processNestedCategories((cat as any).children)
      }
      
      return processed
    })
  }

  // Build category tree structure
  const buildCategoryTree = (categories: Category[]): Category[] => {
    console.log("🌲 Building Category Tree - Input:", {
      categories,
      categoriesCount: categories.length,
      hasNestedChildren: categories.some(c => (c as any).children?.length > 0),
      firstCategory: categories[0],
      firstCategoryChildren: (categories[0] as any)?.children,
    })

    // Check if categories are already nested (API returned nested structure)
    const hasNestedStructure = categories.some(c => (c as any).children?.length > 0)
    
    // If API already returned nested structure, process it recursively
    if (hasNestedStructure) {
      console.log("🌲 API returned nested structure, processing recursively")
      const tree = processNestedCategories(categories)
      console.log("🌲 Category Tree (from nested API):", {
        tree,
        treeCount: tree.length,
        treeStructure: tree.map(c => ({
          name: c.name,
          id: c.id,
          childrenCount: c.children?.length || 0,
          children: c.children?.map((ch: any) => ({ name: ch.name, id: ch.id })) || [],
        })),
      })
      return tree
    }

    // Otherwise, flatten and rebuild from flat structure
    const flatCategories = flattenCategories(categories)
    console.log("🌲 Flattened categories:", {
      flatCategories,
      flatCount: flatCategories.length,
    })

    const categoryMap = new Map<string, Category & { children: Category[] }>()
    const rootCategories: Category[] = []

    // First pass: create map with children arrays
    flatCategories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })

    console.log("🌲 Category Map Created:", {
      mapSize: categoryMap.size,
      mapKeys: Array.from(categoryMap.keys()),
    })

    // Second pass: build tree
    flatCategories.forEach((cat) => {
      const categoryWithChildren = categoryMap.get(cat.id)!
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        const parent = categoryMap.get(cat.parentId)!
        console.log(`🌲 Adding child "${cat.name}" (${cat.id}) to parent "${parent.name}" (${cat.parentId})`)
        parent.children.push(categoryWithChildren)
      } else {
        console.log(`🌲 Adding root category "${cat.name}" (${cat.id}) - parentId: ${cat.parentId}`)
        rootCategories.push(categoryWithChildren)
      }
    })

    console.log("🌲 Category Tree Built:", {
      rootCategories,
      rootCount: rootCategories.length,
      rootCategoriesWithChildren: rootCategories.filter(c => (c as any).children?.length > 0),
      treeStructure: rootCategories.map(c => ({
        name: c.name,
        id: c.id,
        childrenCount: (c as any).children?.length || 0,
        children: (c as any).children?.map((ch: any) => ({ name: ch.name, id: ch.id })) || [],
      })),
    })

    return rootCategories
  }

  const renderCategoryTree = (categoryList: Category[], level = 0) => {
    console.log(`🎨 Rendering Category Tree - Level ${level}:`, {
      categoryList,
      categoryListCount: categoryList.length,
      categoriesWithChildren: categoryList.filter(c => (c as any).children?.length > 0),
    })

    return categoryList.map((category) => {
      const hasChildren = (category as any).children?.length > 0
      console.log(`🎨 Rendering category "${category.name}" (${category.id}):`, {
        hasChildren,
        children: (category as any).children,
        childrenCount: (category as any).children?.length || 0,
        level,
      })

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
                {hasChildren && (
                  <div className="text-xs text-muted-foreground">
                    {(category as any).children.length} subcategor{(category as any).children.length === 1 ? "y" : "ies"}
                  </div>
                )}
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

  const categoryTree = buildCategoryTree(filteredCategoriesForTree)

  // Debug: Log filtered categories and tree
  useEffect(() => {
    console.log("🔍 Filtered Categories for Table:", {
      filteredCategoriesForTable,
      filteredCount: filteredCategoriesForTable.length,
      searchTerm: search,
    })
    console.log("🌳 Category Tree Result:", {
      categoryTree,
      treeCount: categoryTree.length,
    })
  }, [filteredCategoriesForTable, categoryTree, search])

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
                data={filteredCategoriesForTable}
                columns={exportColumns}
                filename="categories"
                disabled={isLoading || filteredCategoriesForTable.length === 0}
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
          ) : (viewMode === "table" ? filteredCategoriesForTable : filteredCategoriesForTree).length === 0 ? (
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
              data={filteredCategoriesForTable}
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
