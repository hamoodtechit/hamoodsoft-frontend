"use client"

import Image from "next/image"
import { usePOS } from "./pos-provider"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Package } from "lucide-react"

export function VariantPickerDialog() {
  const {
    isSkuDialogOpen, setIsSkuDialogOpen,
    selectedProductForSku, setSelectedProductForSku,
    getProductVariants, addToCartWithSku,
  } = usePOS()

  return (
    <Dialog open={isSkuDialogOpen} onOpenChange={setIsSkuDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Select Variant</DialogTitle>
          <DialogDescription className="text-base">
            {selectedProductForSku && `Choose a variant for "${selectedProductForSku.name}"`}
          </DialogDescription>
        </DialogHeader>
        {selectedProductForSku && (
          <ScrollArea className="max-h-[500px] pr-4">
            <div className="space-y-3">
              {getProductVariants(selectedProductForSku).map((variantData, index) => {
                const variant = variantData.variant
                const stock = variantData.stock
                const availableQty = stock?.quantity || 0
                const managesStock = selectedProductForSku.manageStocks !== false
                const isOutOfStock = managesStock && (stock === undefined || stock.quantity <= 0)

                const variantImage = variant?.thumbnailUrl ||
                  (variant?.images && variant.images[0]) ||
                  selectedProductForSku.thumbnailUrl ||
                  (selectedProductForSku.images && selectedProductForSku.images[0]) ||
                  null

                const variantPriceValue = variant?.price !== null && variant?.price !== undefined ? variant.price : null
                const variantPrice = variantPriceValue ?? stock?.salePrice ?? selectedProductForSku.price ?? 0

                const optionsText = variant?.options
                  ? Object.entries(variant.options)
                      .map(([key, value]) => {
                        const cleanKey = key.replace(/^attr-/, '')
                        return `${cleanKey}: ${value}`
                      })
                      .join(', ')
                  : ''

                return (
                  <button
                    key={variantData.sku || index}
                    onClick={() => {
                      if (!isOutOfStock) {
                        addToCartWithSku(
                          selectedProductForSku,
                          variantData.sku,
                          variant,
                          stock
                        )
                        setIsSkuDialogOpen(false)
                        setSelectedProductForSku(null)
                      }
                    }}
                    disabled={isOutOfStock}
                    className={cn(
                      "group w-full p-4 border-2 rounded-xl text-left",
                      "transition-all duration-200",
                      "hover:border-primary/50 hover:shadow-md hover:shadow-primary/10",
                      "active:scale-[0.98]",
                      "flex items-center gap-4 bg-card",
                      isOutOfStock && managesStock && "opacity-50 cursor-not-allowed hover:shadow-none"
                    )}
                  >
                    {/* Variant Image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-muted to-muted/50 flex-shrink-0 border relative">
                      {variantImage ? (
                        <Image
                          src={variantImage}
                          alt={variant?.variantName || selectedProductForSku.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    {/* Variant Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                        {variant?.variantName || (variantData.sku !== selectedProductForSku.id ? "Main Stock / Batch" : selectedProductForSku.name)}
                      </div>
                      {optionsText && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {optionsText.split(', ').map((option, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {option}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {managesStock && (
                          <>
                            {isOutOfStock ? (
                              <Badge variant="destructive" className="text-xs px-2 py-0.5">
                                Out of stock
                              </Badge>
                            ) : (
                              <Badge
                                variant={availableQty > 10 ? "default" : "secondary"}
                                className="text-xs px-2 py-0.5"
                              >
                                {availableQty} available
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-bold text-primary">
                        {variantPrice.toFixed(2)}
                      </div>
                      {selectedProductForSku.unit?.suffix && (
                        <div className="text-xs text-muted-foreground">
                          / {selectedProductForSku.unit.suffix}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
