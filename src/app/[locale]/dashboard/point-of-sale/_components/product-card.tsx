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
          "w-full flex items-center gap-4 p-3 border rounded-xl transition-all",
          "bg-gradient-to-br", getRandomGradient(product.id, 'subtle'),
          "hover:border-primary/50 hover:shadow-md",
          isOutOfStock && "opacity-60",
          inCart && "border-primary/40 shadow-sm"
        )}
      >
        <div className={cn(
          "w-12 h-12 rounded flex-shrink-0 overflow-hidden border bg-gradient-to-br",
          getRandomGradient(product.id, 'vibrant')
        )}>
          {productImage ? (
            <Image
              src={productImage}
              alt={product.name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <Package className="h-6 w-6 m-auto text-foreground/20" />
          )}
        </div>
        <div className="flex-1 text-left">
          <div className="font-bold text-sm truncate">{product.name}</div>
        </div>
        <div className="text-right">
          <div className="font-black text-primary">{displayPrice.toFixed(2)}</div>
          <div className="text-[10px] text-muted-foreground">{product.unit?.suffix}</div>
        </div>
        {managesStock && (
          <Badge variant={isOutOfStock ? "destructive" : "outline"} className="ml-2 text-[10px]">
            {isOutOfStock ? "OOS" : `In: ${hasMultipleVariants ? totalStockQuantity : (stock?.quantity || 0)}`}
          </Badge>
        )}
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
            <Package className="h-12 w-12 text-foreground/20" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1.5 text-left">
            {product.name}
          </h3>
          <div className="text-lg font-bold text-primary text-left">
            {displayPrice.toFixed(2)}
          </div>
        </div>
        {managesStock && (
          <Badge
            variant={isOutOfStock ? "destructive" : "secondary"}
            className="text-[10px] self-start"
          >
            {isOutOfStock ? "Out of Stock" : `${hasMultipleVariants ? totalStockQuantity : (stock?.quantity || 0)} available`}
          </Badge>
        )}
      </div>
    </button>
  )
}
