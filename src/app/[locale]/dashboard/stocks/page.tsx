"use client"

import { AdjustStockDialog } from "@/components/common/adjust-stock-dialog"
import { PageLayout } from "@/components/common/page-layout"
import { StockDialog } from "@/components/common/stock-dialog"
import { SkeletonList } from "@/components/skeletons/skeleton-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { useProducts } from "@/lib/hooks/use-products"
import {
  useStockHistoryByBranch,
  useStocksByBranch,
} from "@/lib/hooks/use-stocks"
import { Stock, StockHistory } from "@/types"
import { ArrowDown, ArrowUp, History, MoreVertical, Package, Plus, Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function StocksPage() {
  const t = useTranslations("stocks")
  const tCommon = useTranslations("common")
  const tModules = useTranslations("modulesPages.inventory")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string

  const currentBusiness = useCurrentBusiness()
  const { currentBranch, selectedBranchId } = useBranchSelection()

  const [search, setSearch] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false)
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [historyStock, setHistoryStock] = useState<Stock | null>(null)

  const { data: stocksData, isLoading } = useStocksByBranch(selectedBranchId || undefined)
  const stocks = stocksData?.items || []

  const { data: productsData } = useProducts()
  const products = productsData?.items || []
  const productMap = new Map(products.map((p) => [p.id, p]))

  const { data: history = [], isLoading: historyLoading } = useStockHistoryByBranch(
    historyStock?.branchId || undefined
  )

  // Filter stocks by search
  const filteredStocks = stocks.filter((stock) => {
    if (!search.trim()) return true
    const searchLower = search.toLowerCase()
    const product = productMap.get(stock.productId)
    const productName = product?.name || ""
    return (
      productName.toLowerCase().includes(searchLower) ||
      stock.productId?.toLowerCase().includes(searchLower) ||
      stock.id?.toLowerCase().includes(searchLower)
    )
  })

  // Secure by module access (inventory)
  useEffect(() => {
    if (currentBusiness && !currentBusiness.modules?.includes("inventory")) {
      router.push(`/${locale}/dashboard`)
    }
  }, [currentBusiness, locale, router])

  if (!currentBusiness?.modules?.includes("inventory")) {
    return (
      <PageLayout title={tModules("accessDenied")} description={tModules("noAccess")}>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{tModules("noAccessDescription")}</p>
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  const handleCreate = () => {
    setIsCreateDialogOpen(true)
  }

  const handleAdjust = (stock: Stock) => {
    setSelectedStock(stock)
    setIsAdjustDialogOpen(true)
  }

  const handleViewHistory = (stock: Stock) => {
    setHistoryStock(stock)
    setIsHistoryOpen(true)
  }

  const getStockHistoryForProduct = (productId: string) => {
    return history.filter((h) => h.productId === productId)
  }

  return (
    <PageLayout title={t("title")} description={t("description")} maxWidth="full">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>{t("title")}</CardTitle>
                <CardDescription>
                  {t("description")}
                  {currentBranch && (
                    <span className="ml-2 text-xs">
                      ({t("branch")}: {currentBranch.name})
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <div className="relative w-full sm:w-[280px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createStock")}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {!selectedBranchId ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("noBranchSelected")}</h3>
              <p className="text-muted-foreground">{t("noBranchSelectedDescription")}</p>
            </div>
          ) : isLoading ? (
            <SkeletonList count={6} />
          ) : filteredStocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("noStocks")}</h3>
              <p className="text-muted-foreground mb-4">{t("noStocksDescription")}</p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createStock")}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStocks.map((stock) => {
                const productHistory = getStockHistoryForProduct(stock.productId)
                const product = productMap.get(stock.productId)
                return (
                  <Card key={stock.id} className="relative">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold truncate">
                              {product?.name || stock.productId}
                            </h4>
                            <Badge variant={stock.quantity > 0 ? "default" : "destructive"}>
                              {t("quantity")}: {stock.quantity}
                            </Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {stock.purchasePrice !== null && stock.purchasePrice !== undefined && (
                              <span>
                                {t("purchasePrice")}: {stock.purchasePrice}
                              </span>
                            )}
                            {stock.salePrice !== null && stock.salePrice !== undefined && (
                              <span>
                                {t("salePrice")}: {stock.salePrice}
                              </span>
                            )}
                          </div>
                          {productHistory.length > 0 && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              {t("lastTransaction")}:{" "}
                              {new Date(productHistory[0].createdAt || "").toLocaleString()}
                            </div>
                          )}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewHistory(stock)}>
                              <History className="mr-2 h-4 w-4" />
                              {t("viewHistory")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAdjust(stock)}>
                              <Package className="mr-2 h-4 w-4" />
                              {t("adjustStock")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <StockDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        defaultBranchId={selectedBranchId || undefined}
      />

      <AdjustStockDialog
        open={isAdjustDialogOpen}
        onOpenChange={setIsAdjustDialogOpen}
        defaultBranchId={selectedStock?.branchId}
        defaultProductId={selectedStock?.productId}
      />

      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent
          side="bottom"
          className="w-full max-w-3xl mx-auto rounded-t-2xl sm:rounded-2xl sm:max-h-[90vh] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t("stockHistory")}
            </SheetTitle>
            <SheetDescription>{t("stockHistoryDescription")}</SheetDescription>
          </SheetHeader>
          {historyStock ? (
            <div className="space-y-4 mt-4">
              {historyLoading ? (
                <SkeletonList count={3} />
              ) : getStockHistoryForProduct(historyStock.productId).length === 0 ? (
                <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                  {t("noHistory")}
                </div>
              ) : (
                <div className="space-y-2">
                  {getStockHistoryForProduct(historyStock.productId).map((h: StockHistory) => (
                    <Card key={h.id} className="border">
                      <CardContent className="py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {h.transactionType === "IN" ? (
                                <ArrowUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <ArrowDown className="h-4 w-4 text-red-600" />
                              )}
                              <Badge
                                variant={h.transactionType === "IN" ? "default" : "destructive"}
                              >
                                {h.transactionType === "IN" ? t("stockIn") : t("stockOut")}
                              </Badge>
                              <span className="font-medium">{t("quantity")}: {h.quantity}</span>
                            </div>
                            {h.reason && (
                              <p className="text-sm text-muted-foreground mt-1">{h.reason}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(h.createdAt || "").toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </PageLayout>
  )
}
