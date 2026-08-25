"use client"

import { DataTable, type Column } from "@/components/common/data-table"
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog"
import { IncomeExpenseCategoryDialog } from "@/components/common/income-expense-category-dialog"
import { Pagination } from "@/components/common/pagination"
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
  useIncomeExpenseCategories,
  useDeleteIncomeExpenseCategory,
} from "@/lib/hooks/use-income-expense-categories"
import { useModuleAccessCheck } from "@/lib/hooks/use-permission-check"
import { useHasPermission } from "@/lib/hooks/use-permissions"
import { PERMISSIONS, MODULES } from "@/lib/utils/permissions"
import { IncomeExpenseCategory } from "@/types"
import { ArrowUpRight, MoreVertical, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

export default function ExpenseCategoriesPage() {
  const t = useTranslations("incomeExpenseCategories")
  const tCommon = useTranslations("common")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<IncomeExpenseCategory | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<IncomeExpenseCategory | null>(null)

  const deleteMutation = useDeleteIncomeExpenseCategory()

  const queryParams = useMemo(() => {
    const p: any = { page, limit, type: "EXPENSE" }
    if (search.trim()) p.search = search.trim()
    return p
  }, [page, limit, search])

  const { data: categoriesData, isLoading } = useIncomeExpenseCategories(queryParams)
  const categories = categoriesData?.items || []
  const meta = categoriesData?.meta

  const totalPages =
    meta?.totalPages ??
    Math.max(1, Math.ceil((meta?.total || 0) / (meta?.limit ?? limit)))

  // Permission checks
  const { hasAccess, isLoading: isCheckingAccess } = useModuleAccessCheck(MODULES.ACCOUNTING)
  const canManage = useHasPermission(PERMISSIONS.TRANSACTIONS_CREATE) || true

  useEffect(() => {
    if (!isCheckingAccess && !hasAccess) {
      router.push(`/${locale}/dashboard`)
    }
  }, [hasAccess, isCheckingAccess, locale, router])

  const handleEdit = (cat: IncomeExpenseCategory) => {
    setSelectedCategory(cat)
    setIsDialogOpen(true)
  }

  const handleDelete = (cat: IncomeExpenseCategory) => {
    setCategoryToDelete(cat)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!categoryToDelete) return
    try {
      await deleteMutation.mutateAsync(categoryToDelete.id)
      setIsDeleteDialogOpen(false)
      setCategoryToDelete(null)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const columns: Column<IncomeExpenseCategory>[] = [
    {
      id: "name",
      header: "Category Name",
      accessorKey: "name",
      cell: (row) => (
        <div className="flex items-center gap-2 font-medium">
          <ArrowUpRight className="h-4 w-4 text-rose-500 shrink-0" />
          <span>{row.name}</span>
        </div>
      ),
    },
    {
      id: "description",
      header: "Description",
      accessorKey: "description",
      cell: (row) => (
        <span className="text-muted-foreground text-sm">
          {row.description || "-"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "isActive",
      cell: (row) => (
        <Badge variant={row.isActive ? "default" : "secondary"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(row)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(row)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Expense Categories</CardTitle>
              <CardDescription>
                Define categories for classifying and tracking business expenses
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setSelectedCategory(null)
                setIsDialogOpen(true)
              }}
              className="gap-2 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add Expense Category
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expense categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <SkeletonList count={5} />
          ) : (
            <DataTable
              columns={columns}
              data={categories}
              emptyMessage="No expense categories found. Create one to get started."
            />
          )}

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
        </CardContent>
      </Card>

      <IncomeExpenseCategoryDialog
        category={selectedCategory}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        defaultType="EXPENSE"
      />

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Expense Category"
        description={`Are you sure you want to delete "${categoryToDelete?.name}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
