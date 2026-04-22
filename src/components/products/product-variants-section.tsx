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
import { cn } from "@/lib/utils"
import { Image as ImageIcon, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
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
}

export function ProductVariantsSection({
  form,
  fields,
  isLoading,
  isEdit,
  availableAttributes,
}: ProductVariantsSectionProps) {
  const t = useTranslations("products")

  const [mediaDialogOpen, setMediaDialogOpen] = useState(false)
  const [mediaDialogVariantIndex, setMediaDialogVariantIndex] = useState<number | null>(null)
  const [selectingThumbnail, setSelectingThumbnail] = useState(false)

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
        <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3 bg-muted/30">
          {fields.map((field, index) => (
            <Card key={field.id} className="border">
              <CardContent className="p-3">
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
                      // Convert "attr-{name}" keys to readable attribute names for display
                      return Object.entries(options).map(([key, value], idx) => {
                        // Extract attribute name from "attr-color" -> "Color"
                        let displayName = key
                        if (key.startsWith("attr-")) {
                          const attrName = key.replace(/^attr-/, "").replace(/-/g, " ")
                          displayName = attrName
                            .split(" ")
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join(" ")
                        } else {
                          // Try to find attribute by name or ID
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
                  
                  {/* SKU and Price fields for stock management */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t">
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
                    
                    <FormField
                      control={form.control}
                      name={`variants.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">
                            Price <span className="text-destructive">*</span>
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
          ))}
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
            // Single selection for variant thumbnail
            const selectedMedia = Array.isArray(media) ? media[0] : media
            form.setValue(`variants.${mediaDialogVariantIndex}.thumbnailUrl`, selectedMedia.secureUrl || selectedMedia.url)
          } else {
            // Multiple selection for variant gallery
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
