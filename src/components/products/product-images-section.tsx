"use client"

import { MediaDialog } from "@/components/common/media-dialog"
import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Image as ImageIcon, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { UseFormReturn } from "react-hook-form"
import { CreateProductInput, UpdateProductInput } from "@/lib/validations/products"

interface ProductImagesSectionProps {
  form: UseFormReturn<CreateProductInput | UpdateProductInput>
  isLoading: boolean
}

export function ProductImagesSection({
  form,
  isLoading,
}: ProductImagesSectionProps) {
  const t = useTranslations("products")

  const [mediaDialogOpen, setMediaDialogOpen] = useState(false)
  const [selectingThumbnail, setSelectingThumbnail] = useState(false)

  return (
    <div className="space-y-3">
      <FormField
        control={form.control}
        name="thumbnailUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("thumbnail") || "Product Thumbnail"}</FormLabel>
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
                      className="absolute -top-1 -right-1 h-5 w-5"
                      onClick={() => field.onChange(null)}
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-24 w-24 rounded-md border border-dashed flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    setSelectingThumbnail(true)
                    setMediaDialogOpen(true)
                  }}
                  disabled={isLoading}
                >
                  <ImageIcon className="h-3 w-3 mr-1" />
                  {field.value ? (t("changeThumbnail") || "Change") : (t("selectThumbnail") || "Select")}
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="images"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("images") || "Product Images"}</FormLabel>
            <FormControl>
              <div className="space-y-2">
                {field.value && field.value.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {field.value.map((url, imgIndex) => (
                      <div key={imgIndex} className="relative">
                        <img
                          src={url}
                          alt={`Gallery ${imgIndex + 1}`}
                          className="h-16 w-16 rounded-md object-cover border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-1 -right-1 h-4 w-4"
                          onClick={() => {
                            const currentImages = field.value || []
                            const newImages = currentImages.filter((_, i) => i !== imgIndex)
                            field.onChange(newImages.length > 0 ? newImages : undefined)
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
                  className="h-8 text-xs"
                  onClick={() => {
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

      {/* Media Dialog for product-level images */}
      <MediaDialog
        open={mediaDialogOpen}
        onOpenChange={setMediaDialogOpen}
        type="image"
        multiple={!selectingThumbnail}
        onSelect={(media) => {
          if (selectingThumbnail) {
            // Single selection for product thumbnail
            const selectedMedia = Array.isArray(media) ? media[0] : media
            form.setValue("thumbnailUrl", selectedMedia.secureUrl || selectedMedia.url)
          } else {
            // Multiple selection for product gallery
            const selectedMedia = Array.isArray(media) ? media : [media]
            const currentImages = form.getValues("images") || []
            const newUrls = selectedMedia.map((m) => m.secureUrl || m.url)
            form.setValue("images", [...currentImages, ...newUrls])
          }
          setMediaDialogOpen(false)
        }}
      />
    </div>
  )
}
