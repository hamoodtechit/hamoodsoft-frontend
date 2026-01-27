"use client"

import { MediaDialog } from "@/components/common/media-dialog"
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
import { useAttributes } from "@/lib/hooks/use-attributes"
import { useUnits } from "@/lib/hooks/use-units"
import { cn } from "@/lib/utils"
import {
  createProductVariantSchema,
  productVariantOptionsSchema,
  updateProductVariantSchema,
  type CreateProductVariantInput,
  type UpdateProductVariantInput,
} from "@/lib/validations/product-variants"
import { Attribute, ProductVariant, Unit } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { Image as ImageIcon, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"

interface ProductVariantDialogProps {
  productId: string
  variant: ProductVariant | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitCreate: (data: CreateProductVariantInput) => void
  onSubmitUpdate: (id: string, data: UpdateProductVariantInput) => void
  isLoading: boolean
}

export function ProductVariantDialog({
  productId,
  variant,
  open,
  onOpenChange,
  onSubmitCreate,
  onSubmitUpdate,
  isLoading,
}: ProductVariantDialogProps) {
  const t = useTranslations("productVariants")
  const tCommon = useTranslations("common")
  const { data: units = [] } = useUnits()
  const { data: attributesData } = useAttributes()
  const attributes = attributesData?.items ?? []

  const isEdit = !!variant
  const schema = isEdit ? updateProductVariantSchema : createProductVariantSchema

  const toText = (obj?: Record<string, string>) =>
    obj && typeof obj === "object"
      ? Object.entries(obj)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n")
      : ""

  const parseOptions = (val: string): Record<string, string> => {
    // Try JSON first
    try {
      const parsed = JSON.parse(val)
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, string>
      }
    } catch {
      // fall through
    }
    // Fallback key:value per line
    const lines = val.split("\n")
    const obj: Record<string, string> = {}
    lines.forEach((line) => {
      const idx = line.indexOf(":")
      if (idx > -1) {
        const key = line.slice(0, idx).trim()
        const value = line.slice(idx + 1).trim()
        if (key) obj[key] = value
      }
    })
    return obj
  }

  const defaultValues = useMemo(() => {
    if (!variant) {
      return {
        sku: "",
        price: 0,
        unitId: "",
        variantName: "",
        options: {} as Record<string, string>,
        thumbnailUrl: "",
        images: [] as string[],
      }
    }
    return {
      sku: variant.sku || "",
      price: typeof variant.price === "number" ? variant.price : 0,
      unitId: variant.unitId || "",
      variantName: variant.variantName || "",
      options: variant.options || {},
      thumbnailUrl: variant.thumbnailUrl || "",
      images: variant.images || [],
    }
  }, [variant])

  const form = useForm<CreateProductVariantInput | UpdateProductVariantInput>({
    resolver: zodResolver(schema as any),
    defaultValues,
  })

  const [optionsText, setOptionsText] = useState<string>(toText(defaultValues.options))
  const [attributeSelections, setAttributeSelections] = useState<Record<string, string>>({})
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false)
  const [selectingThumbnail, setSelectingThumbnail] = useState(false)

  useEffect(() => {
    form.reset(defaultValues)
    setOptionsText(toText(defaultValues.options))
    setAttributeSelections(defaultValues.options || {})
    setMediaDialogOpen(false)
    setSelectingThumbnail(false)
  }, [defaultValues, form])

  const onSubmit = (data: CreateProductVariantInput | UpdateProductVariantInput) => {
    const parsedOptions = showAdvanced ? parseOptions(optionsText) : attributeSelections
    const validation = productVariantOptionsSchema.safeParse(parsedOptions)
    if (!validation.success) {
      form.setError("options" as any, {
        type: "manual",
        message: tCommon("invalidOptionsKey") ?? "Invalid option keys; must be UUIDs",
      })
      return
    }
    // Clear previous option errors if any
    form.clearErrors("options" as any)

    data = { ...data, options: parsedOptions }

    if (isEdit && variant) {
      onSubmitUpdate(variant.id, data as UpdateProductVariantInput)
      return
    }
    onSubmitCreate(data as CreateProductVariantInput)
  }

  const unitOptions = units as Unit[]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editVariant") : t("createVariant")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("editVariantDescription") : t("createVariantDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("sku")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("skuPlaceholder")} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("price")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={typeof field.value === "number" ? field.value : 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        placeholder={t("pricePlaceholder")}
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("unit")}</FormLabel>
                    <FormControl>
                      <select
                        className={cn(
                          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          "disabled:cursor-not-allowed disabled:opacity-50"
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="variantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("variantName")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("variantNamePlaceholder")} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Thumbnail Image */}
            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("thumbnail") || "Thumbnail Image"}</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {field.value ? (
                        <div className="relative inline-block">
                          <img
                            src={field.value}
                            alt="Thumbnail"
                            className="h-24 w-24 rounded-md object-cover border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => field.onChange("")}
                            disabled={isLoading}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="h-24 w-24 rounded-md border border-dashed flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectingThumbnail(true)
                          setMediaDialogOpen(true)
                        }}
                        disabled={isLoading}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        {field.value ? t("changeThumbnail") || "Change Thumbnail" : t("selectThumbnail") || "Select Thumbnail"}
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
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("images") || "Gallery Images"}</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {field.value && field.value.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {field.value.map((url, index) => (
                            <div key={index} className="relative">
                              <img
                                src={url}
                                alt={`Gallery ${index + 1}`}
                                className="h-20 w-20 rounded-md object-cover border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6"
                                onClick={() => {
                                  const currentImages = field.value || []
                                  const newImages = currentImages.filter((_, i) => i !== index)
                                  field.onChange(newImages)
                                }}
                                disabled={isLoading}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectingThumbnail(false)
                          setMediaDialogOpen(true)
                        }}
                        disabled={isLoading}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        {t("addImages") || "Add Images"}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="options"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("options")}</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      {/* Friendly attribute selectors */}
                      {attributes.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {(attributes as Attribute[]).map((attr) => (
                            <div key={attr.id} className="space-y-1">
                              <label className="text-sm font-medium">{attr.name}</label>
                              <select
                                className={cn(
                                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                  "disabled:cursor-not-allowed disabled:opacity-50"
                                )}
                                value={attributeSelections[attr.id] || ""}
                                onChange={(e) => {
                                  const next = { ...attributeSelections, [attr.id]: e.target.value }
                                  setAttributeSelections(next)
                                  field.onChange(next)
                                }}
                                disabled={isLoading}
                              >
                                <option value="" disabled>
                                  {t("selectValue")}
                                </option>
                                {(attr.values || []).map((v) => (
                                  <option key={v} value={v}>
                                    {v}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">{t("noAttributesHint")}</p>
                      )}

                      {/* Advanced raw options */}
                      <button
                        type="button"
                        className="text-xs text-muted-foreground underline underline-offset-4"
                        onClick={() => setShowAdvanced((v) => !v)}
                      >
                        {showAdvanced ? t("hideAdvanced") : t("showAdvanced")}
                      </button>

                      {showAdvanced && (
                        <textarea
                          className={cn(
                            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            "disabled:cursor-not-allowed disabled:opacity-50"
                          )}
                          value={optionsText}
                          onChange={(e) => setOptionsText(e.target.value)}
                          onBlur={() => {
                            const parsed = parseOptions(optionsText)
                            field.onChange(parsed)
                          }}
                          disabled={isLoading}
                          placeholder={t("optionsPlaceholder")}
                        />
                      )}
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {t("optionsHelp")}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    {tCommon("loading")}
                  </span>
                ) : isEdit ? (
                  tCommon("save")
                ) : (
                  tCommon("submit")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {/* Media Dialog */}
        <MediaDialog
          open={mediaDialogOpen}
          onOpenChange={setMediaDialogOpen}
          type="image"
          multiple={!selectingThumbnail}
          onSelect={(media) => {
            if (selectingThumbnail) {
              // Single selection for thumbnail
              const selectedMedia = Array.isArray(media) ? media[0] : media
              form.setValue("thumbnailUrl", selectedMedia.secureUrl || selectedMedia.url)
            } else {
              // Multiple selection for gallery
              const selectedMedia = Array.isArray(media) ? media : [media]
              const currentImages = form.getValues("images") || []
              const newUrls = selectedMedia.map((m) => m.secureUrl || m.url)
              form.setValue("images", [...currentImages, ...newUrls])
            }
            setMediaDialogOpen(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

