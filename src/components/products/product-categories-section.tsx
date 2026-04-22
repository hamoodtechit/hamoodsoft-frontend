"use client"

import { CategoryDialog } from "@/components/common/category-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCategories } from "@/lib/hooks/use-categories"
import { cn } from "@/lib/utils"
import { Category } from "@/types"
import { ChevronDown, Plus, Search, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { UseFormReturn } from "react-hook-form"
import { CreateProductInput, UpdateProductInput } from "@/lib/validations/products"

interface ProductCategoriesSectionProps {
  form: UseFormReturn<CreateProductInput | UpdateProductInput>
  isLoading: boolean
}

export function ProductCategoriesSection({
  form,
  isLoading,
}: ProductCategoriesSectionProps) {
  const t = useTranslations("products")
  const { data: categories = [] } = useCategories()

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [categorySearchQuery, setCategorySearchQuery] = useState("")
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)

  // Flatten categories to include all (parent + children) for selection
  const flattenCategoriesForSelection = useMemo(() => {
    const flattened: Array<Category & { parentName?: string; level: number }> = []
    
    const traverse = (cats: Category[], level = 0, parentName?: string) => {
      cats.forEach((cat) => {
        flattened.push({
          ...cat,
          children: undefined,
          parentName,
          level,
        })
        
        // Recursively traverse children if they exist
        const catWithChildren = cat as Category & { children?: Category[] }
        if (catWithChildren.children && Array.isArray(catWithChildren.children) && catWithChildren.children.length > 0) {
          traverse(catWithChildren.children, level + 1, cat.name)
        }
      })
    }
    
    traverse(categories)
    return flattened
  }, [categories])

  // Create a map of category ID to all its children IDs (recursive)
  const categoryChildrenMap = useMemo(() => {
    const map = new Map<string, string[]>()
    
    const getChildrenIds = (cat: Category): string[] => {
      const childrenIds: string[] = []
      const catWithChildren = cat as Category & { children?: Category[] }
      if (catWithChildren.children && Array.isArray(catWithChildren.children)) {
        catWithChildren.children.forEach((child: Category) => {
          childrenIds.push(child.id)
          childrenIds.push(...getChildrenIds(child))
        })
      }
      return childrenIds
    }
    
    flattenCategoriesForSelection.forEach((cat) => {
      map.set(cat.id, getChildrenIds(cat))
    })
    
    return map
  }, [flattenCategoriesForSelection])

  return (
    <>
      <FormField
        control={form.control}
        name="categoryIds"
        render={({ field }) => {
          const selected = Array.isArray(field.value) ? field.value : []

          // Filter categories based on search
          const filteredCategories = flattenCategoriesForSelection.filter((cat) =>
            cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
          )

          // Get selected category names for display
          const selectedCategoryNames = flattenCategoriesForSelection
            .filter((cat) => selected.includes(cat.id))
            .map((cat) => cat.name)

          // Handle category selection with auto-select children
          const handleCategoryToggle = (categoryId: string, checked: boolean) => {
            let newSelected: string[]
            
            if (checked) {
              // Add category and all its children
              const childrenIds = categoryChildrenMap.get(categoryId) || []
              newSelected = [...new Set([...selected, categoryId, ...childrenIds])]
            } else {
              // Remove category and all its children
              const childrenIds = categoryChildrenMap.get(categoryId) || []
              const idsToRemove = new Set([categoryId, ...childrenIds])
              newSelected = selected.filter((id) => !idsToRemove.has(id))
            }
            
            field.onChange(newSelected)
          }

          return (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>{t("categories")}</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCategoryDialogOpen(true)}
                  disabled={isLoading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("createCategory") || "Create Category"}
                </Button>
              </div>
              <FormControl>
                <div>
                  <DropdownMenu open={isCategoryDropdownOpen} onOpenChange={setIsCategoryDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between"
                        disabled={isLoading}
                      >
                        <span className="truncate">
                          {selected.length === 0
                            ? t("selectCategories") || "Select categories..."
                            : `${selected.length} ${selected.length === 1 ? "category" : "categories"} selected`}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[400px] p-0" align="start">
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Input
                          placeholder={t("searchCategories") || "Search categories..."}
                          value={categorySearchQuery}
                          onChange={(e) => setCategorySearchQuery(e.target.value)}
                          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <ScrollArea className="h-[300px]">
                        <div className="p-2">
                          {filteredCategories.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                              {t("noCategoriesFound") || "No categories found"}
                            </p>
                          ) : (
                            filteredCategories.map((cat) => {
                              const checked = selected.includes(cat.id)
                              const childrenIds = categoryChildrenMap.get(cat.id) || []
                              const allChildrenSelected = childrenIds.length > 0 && childrenIds.every((id) => selected.includes(id))
                              
                              return (
                                <label
                                  key={cat.id}
                                  className={cn(
                                    "flex items-center gap-2 rounded-md p-2 hover:bg-accent",
                                    checked && "bg-accent"
                                  )}
                                >
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(val) => handleCategoryToggle(cat.id, val === true)}
                                    disabled={isLoading}
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">{cat.name}</span>
                                      {cat.parentName && (
                                        <span className="text-xs text-muted-foreground">
                                          ({cat.parentName})
                                        </span>
                                      )}
                                      {childrenIds.length > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                          {childrenIds.length} {childrenIds.length === 1 ? "sub" : "subs"}
                                        </Badge>
                                      )}
                                    </div>
                                    {checked && childrenIds.length > 0 && !allChildrenSelected && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {childrenIds.filter((id) => selected.includes(id)).length} of {childrenIds.length} subcategories selected
                                      </p>
                                    )}
                                  </div>
                                </label>
                              )
                            })
                          )}
                        </div>
                      </ScrollArea>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {/* Display selected categories as badges */}
                  {selected.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedCategoryNames.map((name, idx) => {
                        const categoryId = flattenCategoriesForSelection.find((c) => c.name === name)?.id
                        return (
                          <Badge key={categoryId || idx} variant="secondary" className="gap-1">
                            {name}
                            <button
                              type="button"
                              onClick={() => {
                                if (categoryId) {
                                  handleCategoryToggle(categoryId, false)
                                }
                              }}
                              className="ml-1 rounded-full hover:bg-secondary-foreground/20"
                              disabled={isLoading}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )
        }}
      />

      {/* Category Creation Dialog */}
      <CategoryDialog
        category={null}
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
      />
    </>
  )
}
