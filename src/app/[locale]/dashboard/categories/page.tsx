"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CategoryDialog } from "@/components/common/category-dialog"
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageLayout } from "@/components/common/page-layout"
import { SkeletonList } from "@/components/skeletons/skeleton-list"
import {
  useCategories,
  useDeleteCategory,
} from "@/lib/hooks/use-categories"
import { Category } from "@/types"
import { FolderTree, MoreVertical, Plus, Trash2, Pencil } from "lucide-react"
import { useState } from "react"

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories()
  const deleteCategoryMutation = useDeleteCategory()
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

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
                {category.parentId && (
                  <div className="text-sm text-muted-foreground">
                    Subcategory
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
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(category)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
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

  const categoryTree = buildCategoryTree(categories)

  return (
    <PageLayout
      title="Product Categories"
      description="Manage your product categories and subcategories"
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
                <CardTitle>Categories</CardTitle>
                <CardDescription>
                  Organize your products with categories and subcategories
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonList count={5} />
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderTree className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first category
              </p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Category
              </Button>
            </div>
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
        title="Delete Category"
        description="This action cannot be undone. This will permanently delete the category."
        itemName={categoryToDelete?.name}
        isLoading={deleteCategoryMutation.isPending}
      />
    </PageLayout>
  )
}
