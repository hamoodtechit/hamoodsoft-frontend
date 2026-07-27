"use client"

import { usePOS } from "./pos-provider"
import { CartItemRow } from "./cart-item-row"
import { CheckoutDrawer } from "./checkout-drawer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Volume2, VolumeX } from "lucide-react"

export function CartContentView() {
  const {
    cart, cartTotals, taxRate,
    soundEnabled, setSoundEnabled,
  } = usePOS()

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden border rounded-lg shadow-sm">
      {/* Header - Compact */}
      <div className="p-3 border-b bg-secondary/10 flex justify-between items-center shrink-0">
        <h2 className="font-semibold flex items-center gap-2 text-base">
          <ShoppingCart className="w-4 h-4 text-primary" />
          Cart Items
        </h2>
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setSoundEnabled((v) => !v)}
            title={soundEnabled ? "Sound: On" : "Sound: Off"}
          >
            {soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
          </Button>
          <Badge variant="secondary" className="px-2 py-0.5 text-xs">{cart.length} items</Badge>
        </div>
      </div>

      {/* Scrollable Items List */}
      <div className="flex-1 overflow-y-auto p-2 min-h-0 custom-scrollbar">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-50">
            <div className="p-3 bg-secondary rounded-full">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <p className="text-sm">No items added yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map((item, index) => (
              <CartItemRow
                key={`${item.productId}-${item.sku}-${index}`}
                item={item}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="p-3 bg-secondary/5 border-t shrink-0 flex flex-col gap-3">
        {/* Summary Totals */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium text-muted-foreground">
            <span>Subtotal ({cart.length} items)</span>
            <span>{cartTotals.itemsSubtotal.toFixed(2)}</span>
          </div>
          {cartTotals.saleDiscount > 0 && (
            <div className="flex justify-between text-xs font-medium text-destructive">
              <span>Discount</span>
              <span>-{cartTotals.saleDiscount.toFixed(2)}</span>
            </div>
          )}
          {cartTotals.tax > 0 && (
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>Tax (VAT {taxRate}%)</span>
              <span>{cartTotals.tax.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-1 border-t mt-1">
            <span className="text-sm font-bold uppercase">Total to Pay</span>
            <span className="text-2xl font-black text-primary">{cartTotals.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Checkout Trigger */}
        <CheckoutDrawer />
      </div>
    </div>
  )
}

export function CartPanel() {
  return (
    <div className="hidden lg:flex lg:col-span-4 flex-col space-y-4 min-h-0 relative h-full">
      <CartContentView />
    </div>
  )
}
