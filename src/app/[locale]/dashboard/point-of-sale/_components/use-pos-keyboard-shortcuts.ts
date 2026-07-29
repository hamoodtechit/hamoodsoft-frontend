"use client"

import { useEffect } from "react"
import { usePOS } from "./pos-provider"

/**
 * Hook that registers keyboard shortcuts for the POS interface.
 * Must be called inside POSProvider.
 */
export function usePOSKeyboardShortcuts() {
  const {
    cart, selectedContactId, isProcessing, saleType,
    handleCheckout, handleSaveDraft, clearCart,
    searchInputRef, barcodeInputRef,
    setProductViewMode, setShowShortcutsHelp,
    isCheckoutOpen, setIsCheckoutOpen,
  } = usePOS()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable

      // F1: Focus Search
      if (e.key === "F1") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }

      // F2: Checkout (if cart has items)
      if (e.key === "F2") {
        e.preventDefault()
        if (cart.length > 0 && selectedContactId && !isProcessing) {
          if (saleType === "DRAFT") handleSaveDraft()
          else handleCheckout()
        } else if (cart.length > 0) {
          // toast would be imported from sonner but we avoid extra imports in hooks
          // The checkout function itself already validates
        }
      }

      // F3: Toggle View Mode
      if (e.key === "F3") {
        e.preventDefault()
        setProductViewMode(prev => prev === "grid" ? "list" : "grid")
      }

      // F4: Clear Cart
      if (e.key === "F4") {
        e.preventDefault()
        if (cart.length > 0) {
          if (window.confirm("Are you sure you want to clear the cart?")) {
            clearCart()
          }
        }
      }

      // /: Focus Barcode (if not already in an input)
      if (e.key === "/" && !isInput) {
        e.preventDefault()
        barcodeInputRef.current?.focus()
      }

      // ?: Show Help
      if (e.key === "?" && !isInput) {
        e.preventDefault()
        setShowShortcutsHelp(true)
      }

      // 1-9: Instant Add Item
      if (e.key >= "1" && e.key <= "9" && !isInput) {
        e.preventDefault()
        const el = document.querySelector(`[data-shortcut="${e.key}"]`) as HTMLElement
        if (el) {
          el.click()
        }
      }
      // Enter: Review Payment (if cart has items and not in an input)
      if (e.key === "Enter" && !isInput) {
        if (!isCheckoutOpen && cart.length > 0) {
          e.preventDefault()
          setIsCheckoutOpen(true)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [cart, selectedContactId, isProcessing, saleType, handleCheckout, handleSaveDraft, clearCart, searchInputRef, barcodeInputRef, setProductViewMode, setShowShortcutsHelp, isCheckoutOpen, setIsCheckoutOpen])
}
