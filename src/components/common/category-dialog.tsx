"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCategories, useCreateCategory, useUpdateCategory } from "@/lib/hooks/use-categories"
import { cn } from "@/lib/utils"
import {
  createCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  updateCategorySchema,
} from "@/lib/validations/categories"
import { Category } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { FolderTree, Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

interface CategoryDialogProps {
  category: Category | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CategoryDialog({
  category,
  open,
  onOpenChange,
}: CategoryDialogProps) {
  const { data: categories = [] } = useCategories()
  const createCategoryMutation = useCreateCategory()
  const updateCategoryMutation = useUpdateCategory()

  const isEdit = !!category
  const form = useForm<CreateCategoryInput | UpdateCategoryInput>({
    resolver: zodResolver(isEdit ? updateCategorySchema : createCategorySchema),
    defaultValues: {
      name: "",
      parentId: null,
    },
  })

  // Update form when category changes
  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name || "",
        parentId: category.parentId || null,
      })
    } else {
      form.reset({
        name: "",
        parentId: null,
      })
    }
  }, [category, form])

  // Filter out current category and its children from parent options
  const parentOptions = categories.filter((cat) => {
    if (!category) return true
    if (cat.id === category.id) return false
    // Filter out children recursively (simplified - you might want to implement full tree traversal)
    return true
  })

  const onSubmit = (data: CreateCategoryInput | UpdateCategoryInput) => {
    // Remove parentId if it's null (don't send null to API)
    const cleanedData = { ...data }
    if (cleanedData.parentId === null || cleanedData.parentId === undefined) {
      delete cleanedData.parentId
    }

    if (isEdit && category) {
      updateCategoryMutation.mutate(
        {
          id: category.id,
          data: cleanedData as UpdateCategoryInput,
        },
        {
          onSuccess: () => {
            onOpenChange(false)
            form.reset()
          },
        }
      )
    } else {
      createCategoryMutation.mutate(cleanedData as CreateCategoryInput, {
        onSuccess: () => {
          onOpenChange(false)
          form.reset()
        },
      })
    }
  }

  const isLoading = createCategoryMutation.isPending || updateCategoryMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <FolderTree className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>
                {isEdit ? "Edit Category" : "Create Category"}
              </DialogTitle>
              <DialogDescription>
                {isEdit
                  ? "Update category details"
                  : "Create a new category or subcategory"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Category Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter category name"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Parent Category (Optional) */}
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? null : value)
                    }
                    value={field.value || "none"}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None (Top Level)</SelectItem>
                      {parentOptions.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEdit ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  isEdit ? "Update Category" : "Create Category"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
