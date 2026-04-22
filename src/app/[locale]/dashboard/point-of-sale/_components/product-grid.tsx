"use client"

import { usePOS } from "./pos-provider"
import { ProductCard } from "./product-card"
import { DispenserCard } from "./dispenser-card"
import { SystemLoader } from "@/components/common/system-loader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Container, Package, Plus } from "lucide-react"
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

  console.log("dispenser", dispensers)
  return (
    <Card className="flex-1 flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            {posMode === "standard" ? (
              <>
                <Package className="h-4 w-4" />
                Products
              </>
            ) : (
              <>
                <Container className="h-4 w-4" />
                Select Dispenser
              </>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {posMode === "standard" && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => router.push(`/${locale}/dashboard/products/new?returnTo=pos`)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                New Product
              </Button>
            )}
            <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
              {posMode === "standard" ? products.length : dispensers.length} items
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full pr-2">
          {isLoadingProducts || isLoadingDispensers ? (
            <div className="py-20">
              <SystemLoader text={`Loading ${posMode === "standard" ? "products" : "dispensers"}...`} />
            </div>
          ) : posMode === "standard" && products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? "No products found" : "No products available"}
            </div>
          ) : posMode === "petrol" && (dispensers.length === 0) ? (
            <div className="text-center py-12 text-muted-foreground">
              No dispensers found
            </div>
          ) : (
            <div className={cn(
              "py-2",
              productViewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                : "space-y-2"
            )}>
              {posMode === "standard" ? (
                filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                dispensers
                  .filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((dispenser) => (
                    <DispenserCard key={dispenser.id} dispenser={dispenser} />
                  ))
              )}

              {/* Load More Button - Products */}
              {posMode === "standard" && hasMoreProducts && (
                <div className={cn(
                  "flex justify-center py-6",
                  productViewMode === "grid" ? "col-span-full" : "w-full"
                )}>
                  <Button
                    variant="outline"
                    size="lg"
                    disabled={isFetchingMoreProducts}
                    onClick={() => fetchNextProducts()}
                    className="px-12 rounded-full border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all w-full md:w-auto"
                  >
                    {isFetchingMoreProducts ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin text-lg">⏳</div>
                        Loading...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Load More Products
                      </div>
                    )}
                  </Button>
                </div>
              )}

              {/* Load More Button - Dispensers */}
              {posMode === "petrol" && hasMoreDispensers && (
                <div className={cn(
                  "flex justify-center py-6",
                  productViewMode === "grid" ? "col-span-full" : "w-full"
                )}>
                  <Button
                    variant="outline"
                    size="lg"
                    disabled={isFetchingMoreDispensers}
                    onClick={() => fetchNextDispensers()}
                    className="px-12 rounded-full border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all w-full md:w-auto"
                  >
                    {isFetchingMoreDispensers ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin text-lg">⏳</div>
                        Loading...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
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
