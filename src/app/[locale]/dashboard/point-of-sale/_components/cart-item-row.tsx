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
    products, updateQuantity, setQuantity, setFuelByAmount, businessConfig,
    removeFromCart, calculateItemTotal, cart, setCart,
  } = usePOS()

  const product = products.find((p) => p.id === item.productId)
  const variant = product?.productVariants?.find((v) => v.id === item.variantId) ||
                  product?.variants?.find((v) => v.id === item.variantId)
  const isFuel = item.productId?.startsWith("fuel-") || Boolean(item.dispenserId)

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
            <p className="text-[11px] text-muted-foreground font-medium">{item.price.toFixed(2)} ৳/L</p>
          </div>
          <div className="text-right shrink-0">
            {(item.discountAmount > 0) && (
              <span className="text-[10px] text-muted-foreground line-through block leading-none">
                {((item.sellByAmount !== undefined ? item.sellByAmount : (item.price * item.quantity))).toFixed(2)}
              </span>
            )}
            <span className="font-black text-sm text-primary leading-tight">{item.totalPrice.toFixed(2)} ৳</span>
          </div>
        </div>

        {isFuel ? (
          <div className="space-y-1.5 border-t pt-1.5 mt-0.5">
            {/* Dual Inputs: Liters vs Amount Taka */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex items-center gap-0.5 bg-secondary/30 rounded-md p-0.5 border" title="Quantity (Liters)">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-5 rounded-sm hover:bg-background shrink-0"
                  onClick={() => updateQuantity(index, -0.5)}
                >
                  <Minus className="h-2.5 w-2.5" />
                </Button>
                <NumericInput
                  value={Number(item.quantity.toFixed(3))}
                  onValueChange={(val) => setQuantity(index, val)}
                  className="h-6 w-full text-center text-[11px] p-0 font-black bg-background border-none focus-visible:ring-1 focus-visible:ring-primary"
                  placeholder="Liters"
                />
                <span className="text-[10px] font-bold text-muted-foreground px-1">L</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-5 rounded-sm hover:bg-background shrink-0"
                  onClick={() => updateQuantity(index, 0.5)}
                >
                  <Plus className="h-2.5 w-2.5" />
                </Button>
              </div>

              <div className="flex items-center gap-1 bg-secondary/30 rounded-md p-0.5 border" title="Sell by Amount (Taka)">
                <span className="text-[10px] font-bold text-muted-foreground pl-1.5">৳</span>
                <NumericInput
                  value={item.sellByAmount !== undefined ? item.sellByAmount : Number((item.price * item.quantity).toFixed(2))}
                  onValueChange={(val) => setFuelByAmount(index, val)}
                  className="h-6 w-full text-center text-[11px] p-0 font-black bg-background border-none focus-visible:ring-1 focus-visible:ring-primary"
                  placeholder="Amount"
                />
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center flex-wrap gap-1">
              {[100, 200, 300, 500, 1000, 2000].map((amt) => (
                <Button
                  key={amt}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-5 px-1.5 text-[9px] font-bold bg-muted/40 hover:bg-primary hover:text-primary-foreground border-border/60"
                  onClick={() => setFuelByAmount(index, amt)}
                >
                  {amt}৳
                </Button>
              ))}
            </div>

            {/* Point Reduction Display */}
            {businessConfig?.showPointReducing && businessConfig?.pointReducingAmountPerLiter > 0 && item.quantity > 0 && (
              <div className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium px-2 py-1 rounded border border-amber-500/20 flex items-center justify-between">
                <span>Deduction: -{(item.quantity * businessConfig.pointReducingAmountPerLiter / 1000).toFixed(3)} L</span>
                <span className="font-bold">Delivery: {(item.quantity * (1000 - businessConfig.pointReducingAmountPerLiter) / 1000).toFixed(3)} L</span>
              </div>
            )}

            {/* Bottom Row: Trash and Discount */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => removeFromCart(index)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>

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
        ) : (
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
        )}
      </div>
    </div>
  )
}
