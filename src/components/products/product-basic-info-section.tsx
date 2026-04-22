"use client"

import { BrandDialog } from "@/components/common/brand-dialog"
import { UnitDialog } from "@/components/common/unit-dialog"
import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RichTextEditor } from "@/components/products/rich-text-editor"
import { useUnits } from "@/lib/hooks/use-units"
import { useBrands } from "@/lib/hooks/use-brands"
import { cn } from "@/lib/utils"
import { Brand, Unit } from "@/types"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { UseFormReturn } from "react-hook-form"
import { CreateProductInput, UpdateProductInput } from "@/lib/validations/products"

interface ProductBasicInfoSectionProps {
  form: UseFormReturn<CreateProductInput | UpdateProductInput>
  isLoading: boolean
  onBrandChange?: (brandId: string) => void
}

export function ProductBasicInfoSection({
  form,
  isLoading,
  onBrandChange,
}: ProductBasicInfoSectionProps) {
  const t = useTranslations("products")
  const { data: units = [] } = useUnits()
  const { data: brandsData } = useBrands()
  const brands = brandsData?.items || []

  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false)
  const [isBrandDialogOpen, setIsBrandDialogOpen] = useState(false)

  const unitOptions = units as Unit[]
  const brandOptions = brands as Brand[]

  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("name")} <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={t("namePlaceholder")}
                disabled={isLoading}
              />
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
            <FormLabel>{t("descriptionLabel")}</FormLabel>
            <FormControl>
              <RichTextEditor field={field} isLoading={isLoading} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("sellPrice") || "Sell Price"} <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={field.value !== undefined && field.value !== null ? field.value : ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                  placeholder={t("pricePlaceholder") || "0.00"}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="purchasePrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("costPrice") || "Cost Price"}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={field.value !== undefined && field.value !== null ? field.value : ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                  placeholder="0.00"
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="unitId"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t("unit")} <span className="text-destructive">*</span></FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <select
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      fieldState.error && "border-destructive focus-visible:ring-destructive"
                    )}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="" disabled>
                      {t("selectUnit")}
                    </option>
                    {unitOptions.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.suffix})
                      </option>
                    ))}
                  </select>
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsUnitDialogOpen(true)}
                  disabled={isLoading}
                  title={t("createUnit") || "Create Unit"}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="brandId"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("brand")} <span className="text-destructive">*</span></FormLabel>
            <div className="flex gap-2">
              <FormControl>
                <select
                  className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    fieldState.error && "border-destructive focus-visible:ring-destructive"
                  )}
                  value={field.value || ""}
                  onChange={(e) => {
                    const newBrandId = e.target.value
                    field.onChange(newBrandId)
                    onBrandChange?.(newBrandId)
                  }}
                  disabled={isLoading}
                >
                  <option value="">{t("selectBrand")}</option>
                  {brandOptions.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </FormControl>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setIsBrandDialogOpen(true)}
                disabled={isLoading}
                title={t("createBrand") || "Create Brand"}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Unit Creation Dialog */}
      <UnitDialog
        unit={null}
        open={isUnitDialogOpen}
        onOpenChange={setIsUnitDialogOpen}
      />

      {/* Brand Creation Dialog */}
      <BrandDialog
        brand={null}
        open={isBrandDialogOpen}
        onOpenChange={setIsBrandDialogOpen}
        onSubmitCreate={(_data, createdBrand) => {
          // BrandDialog handles the mutation internally.
          // Auto-select the newly created brand in the form.
          if (createdBrand?.id) {
            form.setValue("brandId", createdBrand.id)
            onBrandChange?.(createdBrand.id)
          }
          setIsBrandDialogOpen(false)
        }}
        onSubmitUpdate={() => {}}
        isLoading={false}
      />
    </>
  )
}
