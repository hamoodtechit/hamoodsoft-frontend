"use client"

import { MediaDialog } from "@/components/common/media-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { cn } from "@/lib/utils"
import { Branch, Stock } from "@/types"
import { Image as ImageIcon, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { UseFormReturn, UseFieldArrayReturn } from "react-hook-form"
import { CreateProductInput, UpdateProductInput } from "@/lib/validations/products"

interface AvailableAttribute {
  id: string
  name: string
  values: string[]
}

interface ProductVariantsSectionProps {
  form: UseFormReturn<CreateProductInput | UpdateProductInput>
  fields: UseFieldArrayReturn<CreateProductInput | UpdateProductInput, "variants">["fields"]
  isLoading: boolean
  isEdit: boolean
  availableAttributes: AvailableAttribute[]
  existingStocks?: Stock[]
}

export function ProductVariantsSection({
  form,
  fields,
  isLoading,
  isEdit,
  availableAttributes,
  existingStocks,
}: ProductVariantsSectionProps) {
  const t = useTranslations("products")

  const [mediaDialogOpen, setMediaDialogOpen] = useState(false)
  const [mediaDialogVariantIndex, setMediaDialogVariantIndex] = useState<number | null>(null)
  const [selectingThumbnail, setSelectingThumbnail] = useState(false)

  // Get branches and the selected branch from the topbar
  const { branches: branchesRaw, selectedBranchId: defaultBranchId } = useBranchSelection()
  const branches = useMemo(() => {
    return Array.isArray(branchesRaw) ? (branchesRaw as Branch[]) : []
  }, [branchesRaw])

  // Build a set of variant IDs that have existing stock entries
  const variantIdsWithStocks = useMemo(() => {
    const ids = new Set<string>()
    if (existingStocks && existingStocks.length > 0) {
      existingStocks.forEach((s) => {
        if (s.variantId) ids.add(s.variantId)
      })
    }
    return ids
  }, [existingStocks])

  if (fields.length === 0) return null

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label>{t("variantsPreview")}</Label>
            <p className="text-xs text-muted-foreground">
              {t("variantsWillBeCreated")} ({fields.length} {fields.length === 1 ? "variant" : "variants"})
            </p>
          </div>
        </div>
        <div className="space-y-2 max-h-[600px] overflow-y-auto border rounded-lg p-3 bg-muted/30">
          {fields.map((field, index) => {
            // Check if this variant has existing stocks (cannot be removed)
            const variantId = form.getValues(`variants.${index}` as `variants.0`)?.id as string | undefined
            const hasStocks = variantId ? variantIdsWithStocks.has(variantId) : false

            return (
            <Card key={field.id} className={cn("border", hasStocks && "border-amber-300/50 bg-amber-50/30 dark:bg-amber-950/10")}>
              <CardContent className="p-3">
                {hasStocks && (
                  <div className="mb-2 flex items-center gap-1.5">
                    <Badge variant="outline" className="text-xs border-amber-400 text-amber-700 dark:text-amber-400">
                      {t("stock")} ✓
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      This variant has existing stock and cannot be removed
                    </span>
                  </div>
                )}
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name={`variants.${index}.variantName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">{t("variantName")} <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("variantName")}
                            disabled={isLoading}
                            className="h-8"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {(() => {
                      const variantData = form.getValues(`variants.${index}`)
                      const options = variantData?.options || {}
                      return Object.entries(options).map(([key, value], idx) => {
                        let displayName = key
                        if (key.startsWith("attr-")) {
                          const attrName = key.replace(/^attr-/, "").replace(/-/g, " ")
                          displayName = attrName
                            .split(" ")
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join(" ")
                        } else {
                          const attr = availableAttributes.find((a) => a.name === key || a.id === key)
                          if (attr) {
                            displayName = attr.name
                          }
                        }
                        return (
                          <Badge key={`${key}-${idx}-${value}`} variant="secondary" className="text-xs">
                            <span className="font-medium">{displayName}:</span>{" "}
                            <span className="ml-1">{String(value)}</span>
                          </Badge>
                        )
                      })
                    })()}
                  </div>
                  
                  {/* Stock & Pricing fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t">
                    {/* Branch Selection */}
                    <FormField
                      control={form.control}
                      name={`variants.${index}.branchId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">
                            {t("branch") || "Branch"}
                          </FormLabel>
                          <FormControl>
                            <select
                              className={cn(
                                "flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                "disabled:cursor-not-allowed disabled:opacity-50"
                              )}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value || undefined)}
                              disabled={isLoading}
                            >
                              <option value="">{t("selectBranch") || "Select branch..."}</option>
                              {branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.name}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Quantity */}
                    <FormField
                      control={form.control}
                      name={`variants.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">
                            {t("quantity") || "Quantity"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              inputMode="numeric"
                              placeholder="0"
                              disabled={isLoading}
                              className="h-8"
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const value = e.target.value
                                field.onChange(value === "" ? undefined : parseInt(value) || 0)
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Sell Price */}
                    <FormField
                      control={form.control}
                      name={`variants.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">
                            {t("sellPrice") || "Sell Price"} <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="0.00"
                              disabled={isLoading}
                              className="h-8"
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const value = e.target.value
                                field.onChange(value === "" ? undefined : parseFloat(value) || 0)
                              }}
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Cost Price */}
                    <FormField
                      control={form.control}
                      name={`variants.${index}.costPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">
                            {t("costPrice") || "Cost Price"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="0.00"
                              disabled={isLoading}
                              className="h-8"
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const value = e.target.value
                                field.onChange(value === "" ? undefined : parseFloat(value) || 0)
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* SKU (read-only row) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name={`variants.${index}.sku`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">
                            SKU <span className="text-muted-foreground">(read-only)</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="SKU-001"
                              disabled={isLoading || isEdit}
                              readOnly={isEdit}
                              className={cn("h-8", isEdit && "bg-muted")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Thumbnail Image */}
                  <FormField
                    control={form.control}
                    name={`variants.${index}.thumbnailUrl`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">{t("thumbnail") || "Thumbnail"}</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            {field.value ? (
                              <div className="relative inline-block">
                                <img
                                  src={field.value}
                                  alt="Thumbnail"
                                  className="h-16 w-16 rounded-md object-cover border"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute -top-1 -right-1 h-5 w-5"
                                  onClick={() => field.onChange("")}
                                  disabled={isLoading}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="h-16 w-16 rounded-md border border-dashed flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                setMediaDialogVariantIndex(index)
                                setSelectingThumbnail(true)
                                setMediaDialogOpen(true)
                              }}
                              disabled={isLoading}
                            >
                              <ImageIcon className="h-3 w-3 mr-1" />
                              {field.value ? t("changeThumbnail") || "Change" : t("selectThumbnail") || "Select"}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Gallery Images */}
                  <FormField
                    control={form.control}
                    name={`variants.${index}.images`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">{t("images") || "Gallery Images"}</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            {field.value && field.value.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {field.value.map((url, imgIndex) => (
                                  <div key={imgIndex} className="relative">
                                    <img
                                      src={url}
                                      alt={`Gallery ${imgIndex + 1}`}
                                      className="h-12 w-12 rounded-md object-cover border"
                                    />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      className="absolute -top-1 -right-1 h-4 w-4"
                                      onClick={() => {
                                        const currentImages = field.value || []
                                        const newImages = currentImages.filter((_, i) => i !== imgIndex)
                                        field.onChange(newImages)
                                      }}
                                      disabled={isLoading}
                                    >
                                      <X className="h-2 w-2" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                setMediaDialogVariantIndex(index)
                                setSelectingThumbnail(false)
                                setMediaDialogOpen(true)
                              }}
                              disabled={isLoading}
                            >
                              <ImageIcon className="h-3 w-3 mr-1" />
                              {t("addImages") || "Add Images"}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )})}
        </div>
      </div>

      {/* Media Dialog for variant-level images */}
      <MediaDialog
        open={mediaDialogOpen}
        onOpenChange={setMediaDialogOpen}
        type="image"
        multiple={!selectingThumbnail}
        onSelect={(media) => {
          if (mediaDialogVariantIndex === null) return

          if (selectingThumbnail) {
            const selectedMedia = Array.isArray(media) ? media[0] : media
            form.setValue(`variants.${mediaDialogVariantIndex}.thumbnailUrl`, selectedMedia.secureUrl || selectedMedia.url)
          } else {
            const selectedMedia = Array.isArray(media) ? media : [media]
            const currentImages = form.getValues(`variants.${mediaDialogVariantIndex}.images`) || []
            const newUrls = selectedMedia.map((m) => m.secureUrl || m.url)
            form.setValue(`variants.${mediaDialogVariantIndex}.images`, [...currentImages, ...newUrls])
          }
          setMediaDialogOpen(false)
          setMediaDialogVariantIndex(null)
        }}
      />
    </>
  )
}
