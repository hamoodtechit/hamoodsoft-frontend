"use client"

import { useEffect, useState } from "react"

const PINNED_PRODUCTS_KEY = "pos_pinned_products"
const FUEL_TYPE_ORDER_KEY = "pos_fuel_type_order"

export function usePOSLayout() {
  const [pinnedProductIds, setPinnedProductIds] = useState<string[]>([])
  const [fuelTypeOrder, setFuelTypeOrder] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load initial data from localStorage
    try {
      const storedPinnedProducts = localStorage.getItem(PINNED_PRODUCTS_KEY)
      if (storedPinnedProducts) {
        setPinnedProductIds(JSON.parse(storedPinnedProducts))
      }

      const storedFuelOrder = localStorage.getItem(FUEL_TYPE_ORDER_KEY)
      if (storedFuelOrder) {
        setFuelTypeOrder(JSON.parse(storedFuelOrder))
      }
    } catch (e) {
      console.error("Failed to load POS layout preferences from local storage", e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  const togglePinnedProduct = (productId: string) => {
    setPinnedProductIds((prev) => {
      const newArray = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [productId, ...prev]
      
      localStorage.setItem(PINNED_PRODUCTS_KEY, JSON.stringify(newArray))
      return newArray
    })
  }

  const reorderPinnedProducts = (newOrder: string[]) => {
    setPinnedProductIds(newOrder)
    localStorage.setItem(PINNED_PRODUCTS_KEY, JSON.stringify(newOrder))
  }

  const updateFuelTypeOrder = (newOrder: string[]) => {
    setFuelTypeOrder(newOrder)
    localStorage.setItem(FUEL_TYPE_ORDER_KEY, JSON.stringify(newOrder))
  }

  return {
    isLoaded,
    pinnedProductIds,
    togglePinnedProduct,
    reorderPinnedProducts,
    fuelTypeOrder,
    updateFuelTypeOrder,
  }
}
