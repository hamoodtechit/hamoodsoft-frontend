"use client"

import { usePOS, type CartItem } from "./pos-provider"
import { Button } from "@/components/ui/button"
import { NumericInput } from "@/components/ui/numeric-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Minus, Plus, Trash2 } from "lucide-react"

interface CartItemRowProps {
  item: CartItem
  index: number
}

export function CartItemRow({ item, index }: CartItemRowProps) {
  const {
    products, updateQuantity, setQuantity,
    removeFromCart, calculateItemTotal, cart, setCart,
  } = usePOS()

  const product = products.find((p) => p.id === item.productId)
  const variant = product?.productVariants?.find((v) => v.id === item.variantId) ||
                  product?.variants?.find((v) => v.id === item.variantId)
  const isFuel = item.productId?.startsWith("fuel-")

  return (
    <div className="bg-card border rounded-md shadow-sm hover:border-primary/20 transition-colors">
      <div className="p-2 space-y-1">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate leading-tight">
              {product?.name || item.itemName.split(" - ")[0]}
              {variant?.variantName && <span className="text-[11px] font-bold text-primary ml-1 uppercase">({variant.variantName})</span>}
              {isFuel && <span className="text-[11px] font-bold text-primary ml-1 uppercase">(Fuel)</span>}
            </p>
            <p className="text-[11px] text-muted-foreground font-medium">{item.price.toFixed(2)}</p>
          </div>
          <div className="text-right shrink-0">
            {(item.discountAmount > 0) && (
              <span className="text-[10px] text-muted-foreground line-through block leading-none">
                {(item.price * item.quantity).toFixed(2)}
              </span>
            )}
            <span className="font-black text-sm text-primary leading-tight">{item.totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t pt-1.5 mt-0.5">
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 bg-secondary/30 rounded-md p-0.5 border">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-sm hover:bg-background"
                onClick={() => updateQuantity(index, -1)}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <NumericInput
                value={item.quantity}
                onValueChange={(val) => setQuantity(index, val)}
                className="h-6 w-10 text-center text-[11px] p-0 font-black bg-background border-none focus-visible:ring-1 focus-visible:ring-primary"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-sm hover:bg-background"
                onClick={() => updateQuantity(index, 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-sm text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => removeFromCart(index)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-1 bg-secondary/20 rounded-md p-0.5 border">
            <Select
              value={item.discountType}
              onValueChange={(val: "NONE" | "PERCENTAGE" | "FIXED") => {
                const updated = [...cart]
                updated[index].discountType = val
                if (val === "NONE") updated[index].discountAmount = 0
                updated[index].totalPrice = calculateItemTotal(updated[index])
                setCart(updated)
              }}
            >
              <SelectTrigger className="h-6 text-[10px] w-[50px] bg-background border-none px-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE" className="text-[10px]">No</SelectItem>
                <SelectItem value="PERCENTAGE" className="text-[10px]">%</SelectItem>
                <SelectItem value="FIXED" className="text-[10px]">Flat</SelectItem>
              </SelectContent>
            </Select>
            <div className="w-px h-4 bg-border mx-1" />
            <NumericInput
              placeholder="Amt"
              className="h-6 text-[10px] w-14 bg-background border-none px-1"
              value={item.discountAmount}
              disabled={item.discountType === "NONE"}
              onValueChange={(val) => {
                const updated = [...cart]
                updated[index].discountAmount = val
                updated[index].totalPrice = calculateItemTotal(updated[index])
                setCart(updated)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
