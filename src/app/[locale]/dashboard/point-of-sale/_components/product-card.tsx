"use client"

import Image from "next/image"
import { usePOS } from "./pos-provider"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getRandomGradient } from "@/lib/utils/aesthetics"
import { Check, Package } from "lucide-react"
import type { Product } from "@/types"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const {
    getProductVariants, handleProductClick,
    cartProductIdSet, lastSelectedProductId, productViewMode,
  } = usePOS()

  const variants = getProductVariants(product)
  const hasMultipleVariants = variants.length > 1
  const firstVariant = variants[0]?.variant
  const stock = variants[0]?.stock
  const managesStock = product.manageStocks !== false
  const totalStockQuantity = variants.reduce((sum, v) => sum + (v.stock?.quantity || 0), 0)

  const isOutOfStock = managesStock && (
    hasMultipleVariants
      ? totalStockQuantity <= 0
      : !stock || stock.quantity <= 0
  )

  const productImage = firstVariant?.thumbnailUrl || product.thumbnailUrl || null
  const displayPrice = hasMultipleVariants ? product.price : (stock?.salePrice ?? firstVariant?.price ?? product.price ?? 0)
  const inCart = cartProductIdSet.has(product.id)
  const isSelected = lastSelectedProductId === product.id

  if (productViewMode === "list") {
    return (
      <button
        onClick={() => !isOutOfStock && handleProductClick(product)}
        disabled={isOutOfStock}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-3.5 py-2 border rounded-xl transition-all group",
          "bg-gradient-to-br", getRandomGradient(product.id, 'subtle'),
          "hover:border-primary/50 hover:shadow-md",
          isOutOfStock && "opacity-60",
          inCart && "border-primary/40 shadow-sm"
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={cn(
            "w-9 h-9 rounded-lg flex-shrink-0 overflow-hidden border bg-gradient-to-br flex items-center justify-center",
            getRandomGradient(product.id, 'vibrant')
          )}>
            {productImage ? (
              <Image
                src={productImage}
                alt={product.name}
                width={36}
                height={36}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <Package className="h-4 w-4 text-foreground/40" />
            )}
          </div>
          <div className="min-w-0 flex-1 text-left flex items-center gap-2">
            <span className="font-bold text-sm truncate text-foreground" title={product.name}>
              {product.name}
            </span>
            {product.unit?.suffix && (
              <span className="text-xs font-semibold text-muted-foreground bg-secondary/80 px-1.5 py-0.5 rounded flex-shrink-0">
                {product.unit.suffix}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-right flex-shrink-0 pl-2">
          <div className="font-black text-base text-primary leading-tight whitespace-nowrap">
            {displayPrice.toFixed(2)} <span className="text-xs font-medium text-muted-foreground">/ {product.unit?.suffix || 'unit'}</span>
          </div>
          {managesStock && (
            <Badge variant={isOutOfStock ? "destructive" : "outline"} className="text-xs font-medium px-2 py-0.5 whitespace-nowrap">
              {isOutOfStock ? "OOS" : `${hasMultipleVariants ? totalStockQuantity : (stock?.quantity || 0)} qty`}
            </Badge>
          )}
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={() => !isOutOfStock && handleProductClick(product)}
      disabled={isOutOfStock}
      className={cn(
        "group relative border-2 rounded-xl overflow-hidden",
        "bg-gradient-to-br", getRandomGradient(product.id, 'subtle'),
        "transition-all duration-200 ease-in-out",
        "hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50",
        "active:scale-[0.98]",
        "flex flex-col h-full",
        isOutOfStock && "opacity-60 cursor-not-allowed hover:shadow-none",
        inCart && "border-primary/40 shadow-md shadow-primary/5",
        isSelected && "ring-2 ring-primary ring-offset-2 shadow-lg"
      )}
    >
      {/* In Cart Indicator */}
      {inCart && (
        <div className="absolute right-2 top-2 z-10 rounded-full bg-primary text-primary-foreground p-1.5 shadow-md">
          <Check className="h-3.5 w-3.5" />
        </div>
      )}

      {/* Product Image */}
      <div className={cn(
        "relative w-full aspect-square overflow-hidden bg-gradient-to-br",
        getRandomGradient(product.id, 'vibrant')
      )}>
        {productImage ? (
          <Image
            src={productImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-10 w-10 text-foreground/20" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="px-2.5 py-2 flex-1 flex flex-col justify-between gap-1">
        <div>
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <h3 className="font-bold text-sm leading-tight truncate text-foreground text-left" title={product.name}>
              {product.name}
            </h3>
            {product.unit?.suffix && (
              <span className="text-[11px] font-semibold text-muted-foreground bg-secondary/80 px-1.5 py-0.5 rounded shrink-0">
                {product.unit.suffix}
              </span>
            )}
          </div>
          <div className="text-base font-black text-primary text-left truncate">
            {displayPrice.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">/ {product.unit?.suffix || 'unit'}</span>
          </div>
        </div>
        {managesStock && (
          <Badge
            variant={isOutOfStock ? "destructive" : "secondary"}
            className="text-xs font-medium self-start px-1.5 py-0 mt-0.5 truncate max-w-full"
          >
            {isOutOfStock ? "Out of Stock" : `${hasMultipleVariants ? totalStockQuantity : (stock?.quantity || 0)} qty`}
          </Badge>
        )}
      </div>
    </button>
  )
}
