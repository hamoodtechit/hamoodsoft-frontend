"use client"

import { useMemo } from "react"
import { usePOS } from "./pos-provider"
import { ProductCard } from "./product-card"
import { DispenserCard } from "./dispenser-card"
import { SystemLoader } from "@/components/common/system-loader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Container, Droplets, Fuel, Package, Plus } from "lucide-react"
import { useParams, useRouter } from "next/navigation"

export function ProductGrid() {
  const {
    posMode, productViewMode, searchQuery,
    isLoadingProducts, isLoadingDispensers,
    products, dispensers, filteredProducts,
    hasMoreProducts, isFetchingMoreProducts, fetchNextProducts,
    hasMoreDispensers, isFetchingMoreDispensers, fetchNextDispensers,
  } = usePOS()

  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const filteredDispensers = useMemo(() => {
    return dispensers.filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [dispensers, searchQuery])

  const groupedDispensers = useMemo(() => {
    const groups: Record<string, { fuelTypeName: string; price: number; color?: string; items: typeof dispensers }> = {}
    filteredDispensers.forEach((disp) => {
      const fuelType = disp.tanker?.fuelType
      const key = fuelType?.id || "other"
      const name = fuelType?.name || "Other Fuels"
      const price = fuelType?.price || 0
      const color = fuelType?.color
      if (!groups[key]) {
        groups[key] = { fuelTypeName: name, price, color, items: [] }
      }
      groups[key].items.push(disp)
    })
    return Object.values(groups)
  }, [filteredDispensers])

  return (
    <Card className="flex-1 flex flex-col overflow-hidden border-border/80 shadow-xs">
      <CardHeader className="flex-shrink-0 py-3 px-4 border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            {posMode === "standard" ? (
              <>
                <Package className="h-4 w-4 text-primary" />
                <span>Products</span>
              </>
            ) : (
              <>
                <Fuel className="h-4 w-4 text-primary" />
                <span>Fuel Dispensers</span>
              </>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {posMode === "standard" && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium shadow-2xs"
                onClick={() => router.push(`/${locale}/dashboard/products/new?returnTo=pos`)}
              >
                <Plus className="h-3.5 w-3.5 mr-1 text-primary" />
                New Product
              </Button>
            )}
            <Badge variant="secondary" className="text-xs font-medium px-2 h-6 bg-secondary/80">
              {posMode === "standard" ? products.length : dispensers.length} items
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-3 sm:p-4">
        <ScrollArea className="h-full pr-2">
          {isLoadingProducts || isLoadingDispensers ? (
            <div className="py-20">
              <SystemLoader text={`Loading ${posMode === "standard" ? "products" : "dispensers"}...`} />
            </div>
          ) : posMode === "standard" && products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-medium">
              {searchQuery ? "No products found matching your search" : "No products available"}
            </div>
          ) : posMode === "petrol" && (dispensers.length === 0) ? (
            <div className="text-center py-12 text-muted-foreground font-medium">
              {searchQuery ? "No dispensers found matching your search" : "No dispensers available"}
            </div>
          ) : posMode === "standard" ? (
            /* Standard Products View */
            <div className={cn(
              "py-1",
              productViewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4"
                : "space-y-2 sm:space-y-2.5"
            )}>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}

              {/* Load More Button - Products */}
              {hasMoreProducts && (
                <div className={cn(
                  "flex justify-center py-6",
                  productViewMode === "grid" ? "col-span-full" : "w-full"
                )}>
                  <Button
                    variant="outline"
                    size="lg"
                    disabled={isFetchingMoreProducts}
                    onClick={() => fetchNextProducts()}
                    className="px-12 rounded-full border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all w-full md:w-auto font-semibold"
                  >
                    {isFetchingMoreProducts ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin text-lg">⏳</div>
                        Loading more products...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4 text-primary" />
                        Load More Products
                      </div>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Grouped Full-Width Fuel Dispensers View */
            <div className="space-y-6 py-1 w-full">
              {groupedDispensers.map((group) => (
                <div key={group.fuelTypeName} className="border border-border/80 rounded-xl overflow-hidden bg-background shadow-2xs">
                  {/* Fuel Type Group Header */}
                  <div 
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-border/60"
                    style={group.color ? { backgroundColor: `${group.color}25`, borderBottomColor: `${group.color}50` } : { backgroundColor: 'var(--muted)' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Droplets className="h-4 w-4" style={{ color: group.color || 'var(--primary)' }} />
                      <span className="font-bold text-base text-foreground">{group.fuelTypeName}</span>
                      <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
                        {group.items.length} {group.items.length === 1 ? "dispenser" : "dispensers"}
                      </Badge>
                    </div>
                    <div className="font-black text-base text-primary">
                      {group.price.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">/ L</span>
                    </div>
                  </div>

                  {/* Full Width List of Dispensers in this Fuel Group */}
                  <div className="p-2.5 sm:p-3 space-y-2 w-full">
                    {group.items.map((dispenser) => (
                      <DispenserCard key={dispenser.id} dispenser={dispenser} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Load More Button - Dispensers */}
              {hasMoreDispensers && (
                <div className="flex justify-center py-6 w-full">
                  <Button
                    variant="outline"
                    size="lg"
                    disabled={isFetchingMoreDispensers}
                    onClick={() => fetchNextDispensers()}
                    className="px-12 rounded-full border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all w-full md:w-auto font-semibold"
                  >
                    {isFetchingMoreDispensers ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin text-lg">⏳</div>
                        Loading more dispensers...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4 text-primary" />
                        Load More Dispensers
                      </div>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
