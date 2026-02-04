"use client"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useIncomeExpenseCategories } from "@/lib/hooks/use-income-expense-categories"
import { useCreateIncomeExpenseCategory } from "@/lib/hooks/use-income-expense-categories"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { IncomeExpenseCategoryDialog } from "./income-expense-category-dialog"
import { cn } from "@/lib/utils"

interface CategorySelectProps {
  value?: string
  onValueChange: (value: string | undefined) => void
  type: "INCOME" | "EXPENSE"
  disabled?: boolean
  placeholder?: string
}

export function CategorySelect({
  value,
  onValueChange,
  type,
  disabled,
  placeholder,
}: CategorySelectProps) {
  const t = useTranslations("transactions")
  const tCommon = useTranslations("common")
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const { data: categoriesData, refetch } = useIncomeExpenseCategories({
    limit: 1000,
    type,
    isActive: true,
  })
  const categories = categoriesData?.items ?? []
  const createMutation = useCreateIncomeExpenseCategory()

  const selectedCategory = categories.find((cat) => cat.id === value)

  // Filter categories based on search query
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateCategory = async (name: string, description?: string) => {
    try {
      const newCategory = await createMutation.mutateAsync({
        name,
        description: description || "",
        type,
        isActive: true,
      })
      await refetch()
      onValueChange(newCategory.id)
      setOpen(false)
      setSearchQuery("")
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const handleQuickCreate = async () => {
    if (searchQuery.trim()) {
      await handleCreateCategory(searchQuery.trim(), "")
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between"
              disabled={disabled}
            >
              {selectedCategory ? selectedCategory.name : placeholder || t("categoryPlaceholder")}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder={t("searchCategory") || "Search category..."}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                <div className="py-2 text-center text-sm">
                  <p className="mb-2">{t("noCategoryFound") || "No category found."}</p>
                  {searchQuery.trim() && (
                    <div className="space-y-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={handleQuickCreate}
                        disabled={createMutation.isPending}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {createMutation.isPending
                          ? tCommon("creating")
                          : t("createCategoryInline") || `Create "${searchQuery}"`}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="w-full"
                        onClick={() => {
                          setIsCreateDialogOpen(true)
                          setOpen(false)
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {t("createCategoryDialog") || "Create with details"}
                      </Button>
                    </div>
                  )}
                </div>
              </CommandEmpty>
              <CommandGroup>
                {filteredCategories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.id}
                    onSelect={() => {
                      onValueChange(category.id === value ? undefined : category.id)
                      setOpen(false)
                      setSearchQuery("")
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === category.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {category.name}
                  </CommandItem>
                ))}
                {searchQuery.trim() && filteredCategories.length > 0 && (
                  <>
                    <CommandItem
                      onSelect={handleQuickCreate}
                      className="border-t"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {createMutation.isPending
                        ? tCommon("creating")
                        : t("createCategoryInline") || `Create "${searchQuery}"`}
                    </CommandItem>
                    <CommandItem
                      onSelect={() => {
                        setIsCreateDialogOpen(true)
                        setOpen(false)
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t("createCategoryDialog") || "Create with details"}
                    </CommandItem>
                  </>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => {
          setIsCreateDialogOpen(true)
          setOpen(false)
        }}
        disabled={disabled}
        className="shrink-0"
        title={t("createCategory") || "Create Category"}
      >
        <Plus className="h-4 w-4" />
      </Button>
      </div>

      <IncomeExpenseCategoryDialog
        category={null}
        open={isCreateDialogOpen}
        onOpenChange={async (open) => {
          setIsCreateDialogOpen(open)
          if (!open) {
            await refetch() // Refresh categories when dialog closes
            // Don't reopen popover automatically - let user decide
          }
        }}
        defaultType={type}
        defaultName={searchQuery.trim() || undefined}
      />
    </>
  )
}
