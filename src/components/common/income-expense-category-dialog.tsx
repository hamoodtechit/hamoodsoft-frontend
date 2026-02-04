"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useCreateIncomeExpenseCategory,
  useUpdateIncomeExpenseCategory,
} from "@/lib/hooks/use-income-expense-categories"
import {
  createIncomeExpenseCategorySchema,
  updateIncomeExpenseCategorySchema,
  type CreateIncomeExpenseCategoryInput,
  type UpdateIncomeExpenseCategoryInput,
} from "@/lib/validations/income-expense-categories"
import { IncomeExpenseCategory } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"

interface IncomeExpenseCategoryDialogProps {
  category: IncomeExpenseCategory | null
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType?: "INCOME" | "EXPENSE"
  defaultName?: string
}

export function IncomeExpenseCategoryDialog({
  category,
  open,
  onOpenChange,
  defaultType,
  defaultName,
}: IncomeExpenseCategoryDialogProps) {
  const t = useTranslations("incomeExpenseCategories")
  const tCommon = useTranslations("common")
  const createMutation = useCreateIncomeExpenseCategory()
  const updateMutation = useUpdateIncomeExpenseCategory()

  const isEdit = !!category
  const isLoading = createMutation.isPending || updateMutation.isPending

  const defaultValues = useMemo(() => {
    if (category) {
      return {
        name: category.name,
        description: category.description || "",
        isActive: category.isActive,
      } as UpdateIncomeExpenseCategoryInput
    }
    return {
      name: defaultName || "",
      description: "",
      type: defaultType || "INCOME",
      isActive: true,
    } as CreateIncomeExpenseCategoryInput
  }, [category, defaultType, defaultName])

  const form = useForm<CreateIncomeExpenseCategoryInput | UpdateIncomeExpenseCategoryInput>({
    resolver: zodResolver(isEdit ? updateIncomeExpenseCategorySchema : createIncomeExpenseCategorySchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
    }
  }, [open, defaultValues, form])

  const onSubmit = async (data: CreateIncomeExpenseCategoryInput | UpdateIncomeExpenseCategoryInput) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: category.id,
          data: data as UpdateIncomeExpenseCategoryInput,
        })
      } else {
        await createMutation.mutateAsync(data as CreateIncomeExpenseCategoryInput)
      }
      onOpenChange(false)
      form.reset()
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editCategory") : t("createCategory")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("editCategoryDescription") : t("createCategoryDescription")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!isEdit && defaultType && (
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input type="hidden" {...field} value={defaultType} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {!isEdit && !defaultType && (
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("type")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("typePlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="INCOME">{t("typeIncome")}</SelectItem>
                        <SelectItem value="EXPENSE">{t("typeExpense")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("namePlaceholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description") || "Description"} ({tCommon("optional")})</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("descriptionPlaceholder") || "Enter category description"}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEdit && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t("isActive")}</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? isEdit
                    ? tCommon("updating")
                    : tCommon("creating")
                  : isEdit
                    ? tCommon("update")
                    : tCommon("create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
