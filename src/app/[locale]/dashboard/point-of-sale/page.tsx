"use client"

import { InvoiceDialog } from "@/components/common/invoice-dialog"
import { PageLayout } from "@/components/common/page-layout"
import { ProductDialog } from "@/components/common/product-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { salesApi } from "@/lib/api/sales"
import { useAuth } from "@/lib/hooks/use-auth"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { useBranches } from "@/lib/hooks/use-branches"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { useCategories } from "@/lib/hooks/use-categories"
import { useContacts } from "@/lib/hooks/use-contacts"
import { useProducts } from "@/lib/hooks/use-products"
import { useCreateSale, useSales } from "@/lib/hooks/use-sales"
import { useStocks } from "@/lib/hooks/use-stocks"
import { cn } from "@/lib/utils"
import { Product, ProductVariant, Sale, Stock } from "@/types"
import {
  Calculator,
  Check,
  CreditCard,
  DollarSign,
  FileText,
  History,
  Minus,
  Package,
  Pause,
  Plus,
  Receipt,
  Save,
  Search,
  ShoppingCart,
  Trash2,
  UserPlus,
  Volume2,
  VolumeX,
  X
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

interface CartItem {
  productId?: string
  sku?: string
  variantId?: string
  itemName: string
  itemDescription?: string
  unit: string
  price: number
  quantity: number
  availableQuantity?: number
  discountType: "NONE" | "PERCENTAGE" | "FIXED"
  discountAmount: number
  totalPrice: number
}

type SaleType = "DRAFT" | "QUOTATION" | "SUSPEND" | "CREDIT_SALES" | "CARD"
type PaymentMethod = "CASH" | "CARD" | "CREDIT" | "MIXED"

export default function PointOfSalePage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const tCommon = useTranslations("common")
  const tSales = useTranslations("sales")
  const { user } = useAuth()
  const currentBusiness = useCurrentBusiness()
  const { selectedBranchId, switchBranch } = useBranchSelection()

  // State management
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all")
  const [selectedContactId, setSelectedContactId] = useState<string>("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedProductForSku, setSelectedProductForSku] = useState<Product | null>(null)
  const [isSkuDialogOpen, setIsSkuDialogOpen] = useState(false)
  const [saleType, setSaleType] = useState<SaleType>("CARD")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH")
  const [showCalculator, setShowCalculator] = useState(false)
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [showRecentTransactions, setShowRecentTransactions] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)
  const [completedSale, setCompletedSale] = useState<Sale | null>(null)

  // UX
  const [lastSelectedProductId, setLastSelectedProductId] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true
    return localStorage.getItem("pos-sound-enabled") !== "0"
  })
  const audioCtxRef = useRef<AudioContext | null>(null)
  
  // Discount and Tax
  const [discountType, setDiscountType] = useState<"NONE" | "PERCENTAGE" | "FIXED">("NONE")
  const [discountAmount, setDiscountAmount] = useState(0)
  const [taxRate, setTaxRate] = useState(0)
  const [taxAmount, setTaxAmount] = useState(0)

  // Payment (partial)
  const [paidAmountInput, setPaidAmountInput] = useState<number>(0)

  // Calculator state
  const [calculatorValue, setCalculatorValue] = useState("0")
  const [calculatorDisplay, setCalculatorDisplay] = useState("")

  // Fetch data
  const { data: productsData, isLoading: isLoadingProducts } = useProducts({
    branchId: selectedBranchId || undefined,
    limit: 1000,
  })
  const products = productsData?.items || []

  const { data: stocksData } = useStocks({
    branchId: selectedBranchId || undefined,
    limit: 10000,
  })
  const stocks = stocksData?.items || []

  const { data: contactsData } = useContacts({ type: "CUSTOMER" })
  const contacts = contactsData?.items || []

  const { data: categories = [] } = useCategories(selectedBranchId || undefined)
  const { data: branches = [] } = useBranches()

  // Recent transactions
  const { data: recentSalesData } = useSales({
    branchId: selectedBranchId || undefined,
    limit: 10,
    page: 1,
  })
  const recentSales = recentSalesData?.items || []

  const createSaleMutation = useCreateSale()

  // Persist sound toggle
  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem("pos-sound-enabled", soundEnabled ? "1" : "0")
  }, [soundEnabled])

  const playSound = (kind: "add" | "remove" | "success" | "error") => {
    if (!soundEnabled) return
    if (typeof window === "undefined") return

    try {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextCtor) return

      if (!audioCtxRef.current) audioCtxRef.current = new AudioContextCtor()
      const ctx = audioCtxRef.current

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      const now = ctx.currentTime
      const freq =
        kind === "add"
          ? 880
          : kind === "remove"
            ? 520
            : kind === "success"
              ? 1040
              : 220

      osc.type = kind === "error" ? "square" : "sine"
      osc.frequency.setValueAtTime(freq, now)

      // short envelope to avoid clicks
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "success" ? 0.18 : 0.12))

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + (kind === "success" ? 0.2 : 0.14))
    } catch {
      // ignore sound errors
    }
  }

  // Stock map by SKU
  const stockMapBySku = useMemo(() => {
    const map = new Map<string, Stock>()
    stocks.forEach((stock) => {
      if (stock.sku) {
        map.set(stock.sku, stock)
      }
    })
    return map
  }, [stocks])

  // Check access
  useEffect(() => {
    if (currentBusiness && !currentBusiness.modules?.includes("point-of-sale")) {
      router.push(`/${locale}/dashboard`)
    }
  }, [currentBusiness, locale, router])

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    let filtered = products

    // Filter by category
    if (selectedCategoryId !== "all") {
      filtered = filtered.filter((p) => p.categoryIds?.includes(selectedCategoryId))
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(query)
        const descMatch = p.description?.toLowerCase().includes(query)
        const variants = p.productVariants || p.variants || []
        const skuMatch = variants.some((v: any) => v.sku?.toLowerCase().includes(query))
        return nameMatch || descMatch || skuMatch
      })
    }

    return filtered
  }, [products, selectedCategoryId, searchQuery])

  const cartProductIdSet = useMemo(() => {
    return new Set(cart.map((c) => c.productId).filter(Boolean) as string[])
  }, [cart])

  // Clear the visual "selected" highlight after a short moment
  useEffect(() => {
    if (!lastSelectedProductId) return
    const t = window.setTimeout(() => setLastSelectedProductId(null), 700)
    return () => window.clearTimeout(t)
  }, [lastSelectedProductId])

  // Get product variants/SKUs
  const getProductVariants = (product: Product): Array<{ sku: string; variant: ProductVariant | null; stock?: Stock }> => {
    const variants: Array<{ sku: string; variant: ProductVariant | null; stock?: Stock }> = []
    const productVariants = product.productVariants || product.variants || []

    if (productVariants.length > 0) {
      productVariants.forEach((variant: any) => {
        if (variant.sku) {
          const stock = stockMapBySku.get(variant.sku)
          variants.push({
            sku: variant.sku,
            variant: variant,
            stock,
          })
        }
      })
    } else {
      const productStocks = stocks.filter((s) => s.productId === product.id && s.branchId === selectedBranchId)
      const stock = productStocks.length > 0 ? productStocks[0] : undefined
      variants.push({
        sku: stock?.sku || product.id, // Use product ID as fallback SKU
        variant: null,
        stock,
      })
    }

    return variants
  }

  // Calculate item total
  const calculateItemTotal = (item: CartItem) => {
    const subtotal = item.price * item.quantity
    let discount = 0
    if (item.discountType === "PERCENTAGE") {
      discount = (subtotal * item.discountAmount) / 100
    } else if (item.discountType === "FIXED") {
      discount = item.discountAmount
    }
    return Math.max(0, subtotal - discount)
  }

  // Calculate cart totals with discount and tax
  const cartTotals = useMemo(() => {
    const itemsSubtotal = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0)
    
    // Apply sale-level discount
    let saleDiscount = 0
    if (discountType === "PERCENTAGE") {
      saleDiscount = (itemsSubtotal * discountAmount) / 100
    } else if (discountType === "FIXED") {
      saleDiscount = discountAmount
    }
    
    const afterDiscount = Math.max(0, itemsSubtotal - saleDiscount)
    
    // Calculate tax
    const calculatedTax = (afterDiscount * taxRate) / 100
    setTaxAmount(calculatedTax)
    
    const total = afterDiscount + calculatedTax

    return {
      itemsSubtotal,
      saleDiscount,
      afterDiscount,
      tax: calculatedTax,
      total,
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    }
  }, [cart, discountType, discountAmount, taxRate])

  // Keep paidAmountInput sane when totals/payment method change
  useEffect(() => {
    if (saleType === "DRAFT") {
      setPaidAmountInput(0)
      return
    }
    if (paymentMethod === "CREDIT") {
      setPaidAmountInput(0)
      return
    }
    // default to full payment for cash/card
    if (paymentMethod === "CASH" || paymentMethod === "CARD") {
      setPaidAmountInput(cartTotals.total)
      return
    }
    // for mixed, keep existing but clamp
    if (paymentMethod === "MIXED") {
      setPaidAmountInput((v) => Math.min(Math.max(0, v || 0), cartTotals.total))
    }
  }, [cartTotals.total, paymentMethod, saleType])

  // Handle product click
  const handleProductClick = (product: Product) => {
    setLastSelectedProductId(product.id)
    const variants = getProductVariants(product)
    
    if (variants.length > 1) {
      setSelectedProductForSku(product)
      setIsSkuDialogOpen(true)
    } else if (variants.length === 1) {
      addToCartWithSku(product, variants[0].sku, variants[0].variant, variants[0].stock)
    } else {
      addToCartWithSku(product, product.id, null, undefined) // Use product ID as SKU fallback
    }
  }

  // Add to cart with SKU
  const addToCartWithSku = (
    product: Product,
    sku: string,
    variant: ProductVariant | null,
    stock: Stock | undefined
  ) => {
    const price = variant?.price || product.price || 0
    const unit = product.unit?.suffix || "pcs"
    const availableQty = stock?.quantity || 0
    const managesStock = product.manageStocks !== false

    const existingItemIndex = cart.findIndex(
      (item) => item.productId === product.id && item.sku === sku
    )

    if (existingItemIndex >= 0) {
      const updatedCart = [...cart]
      const currentItem = updatedCart[existingItemIndex]
      const newQuantity = currentItem.quantity + 1

      if (managesStock && availableQty > 0) {
        const currentAvailableQty = stock?.quantity || 0
        if (newQuantity > currentAvailableQty) {
          playSound("error")
          toast.error(`Only ${currentAvailableQty} available in stock`)
          updatedCart[existingItemIndex].quantity = currentAvailableQty
        } else {
          updatedCart[existingItemIndex].quantity = newQuantity
          playSound("add")
        }
      } else {
        updatedCart[existingItemIndex].quantity = newQuantity
        playSound("add")
      }

      updatedCart[existingItemIndex].availableQuantity = stock?.quantity || 0
      updatedCart[existingItemIndex].totalPrice = calculateItemTotal(updatedCart[existingItemIndex])
      setCart(updatedCart)
    } else {
      if (managesStock && availableQty <= 0) {
        playSound("error")
        toast.error("This item is out of stock")
        return
      }

      const newItem: CartItem = {
        productId: product.id,
        sku: sku || product.id, // Ensure SKU is always present
        variantId: variant?.id,
        itemName: product.name,
        itemDescription: product.description || "",
        unit,
        price,
        quantity: 1,
        availableQuantity: availableQty,
        discountType: "NONE",
        discountAmount: 0,
        totalPrice: price,
      }
      playSound("add")
      setCart([...cart, newItem])
    }
  }

  // Update quantity
  const updateQuantity = (index: number, delta: number) => {
    const updatedCart = [...cart]
    const item = updatedCart[index]
    const newQuantity = item.quantity + delta

    const product = products.find((p) => p.id === item.productId)
    const managesStock = product?.manageStocks !== false

    if (managesStock && item.availableQuantity !== undefined && item.availableQuantity > 0) {
      const stock = item.sku ? stockMapBySku.get(item.sku) : undefined
      const availableQty = stock?.quantity || item.availableQuantity || 0

      if (newQuantity > availableQty) {
        playSound("error")
        toast.error(`Only ${availableQty} available in stock`)
        updatedCart[index].quantity = availableQty
      } else if (newQuantity < 1) {
        return
      } else {
        updatedCart[index].quantity = newQuantity
        playSound(delta > 0 ? "add" : "remove")
      }
      updatedCart[index].availableQuantity = availableQty
    } else {
      updatedCart[index].quantity = Math.max(1, newQuantity)
      playSound(delta > 0 ? "add" : "remove")
    }

    updatedCart[index].totalPrice = calculateItemTotal(updatedCart[index])
    setCart(updatedCart)
  }

  // Remove from cart
  const removeFromCart = (index: number) => {
    playSound("remove")
    setCart(cart.filter((_, i) => i !== index))
  }

  // Clear cart
  const clearCart = () => {
    setCart([])
    setSelectedContactId("")
    setDiscountType("NONE")
    setDiscountAmount(0)
    setTaxRate(0)
    setTaxAmount(0)
  }

  // Calculator functions
  const handleCalculatorInput = (value: string) => {
    if (value === "C") {
      setCalculatorValue("0")
      setCalculatorDisplay("")
      return
    }

    if (value === "=") {
      try {
        const result = eval(calculatorDisplay || calculatorValue)
        setCalculatorValue(String(result))
        setCalculatorDisplay("")
      } catch {
        toast.error("Invalid calculation")
      }
      return
    }

    if (["+", "-", "*", "/"].includes(value)) {
      setCalculatorDisplay((prev) => prev + calculatorValue + value)
      setCalculatorValue("0")
    } else {
      setCalculatorValue((prev) => (prev === "0" ? value : prev + value))
    }
  }

  // Process checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty")
      return
    }

    if (!selectedBranchId) {
      toast.error("Please select a branch")
      return
    }

    if (!selectedContactId && saleType !== "DRAFT") {
      toast.error("Please select a customer")
      return
    }

    // Validate stock
    const stockErrors: string[] = []
    cart.forEach((item) => {
      const product = products.find((p) => p.id === item.productId)
      const managesStock = product?.manageStocks !== false

      if (managesStock && item.availableQuantity !== undefined) {
        const stock = item.sku ? stockMapBySku.get(item.sku) : undefined
        const availableQty = stock?.quantity || item.availableQuantity || 0

        if (item.quantity > availableQty) {
          stockErrors.push(`${item.itemName}: Only ${availableQty} available`)
        }
      }
    })

    if (stockErrors.length > 0) {
      toast.error(`Stock validation failed:\n${stockErrors.join("\n")}`)
      return
    }

    setIsProcessing(true)

    try {
      // Determine status based on sale type
      let status: "DRAFT" | "SOLD" | "PENDING" = "SOLD"
      if (saleType === "DRAFT") status = "DRAFT"
      if (saleType === "QUOTATION") status = "PENDING"
      if (saleType === "SUSPEND") status = "DRAFT"

      // Determine payment status
      // Calculate paid amount (user-controlled for PARTIAL/MIXED)
      const paidAmountRaw =
        paymentMethod === "CREDIT" || saleType === "CREDIT_SALES"
          ? 0
          : paymentMethod === "MIXED"
            ? paidAmountInput
            : cartTotals.total
      const paidAmount = Math.min(Math.max(0, paidAmountRaw || 0), cartTotals.total)

      // Determine payment status based on paidAmount
      let paymentStatus: "PAID" | "DUE" | "PARTIAL" = "PAID"
      if (paidAmount <= 0) paymentStatus = "DUE"
      else if (paidAmount >= cartTotals.total) paymentStatus = "PAID"
      else paymentStatus = "PARTIAL"

      // Prepare items with SKU (required)
      const items = cart.map((item) => {
        // Ensure SKU is always present (required by DTO)
        const sku = item.sku || item.productId || `temp-sku-${item.productId}-${Date.now()}`
        
        const itemData: any = {
          sku: sku,
          itemName: item.itemName,
          itemDescription: item.itemDescription || "",
          unit: item.unit,
          price: item.price,
          quantity: item.quantity,
          discountType: item.discountType,
          discountAmount: item.discountAmount,
          totalPrice: calculateItemTotal(item),
        }
        return itemData
      })

      const saleData = {
        branchId: selectedBranchId!,
        contactId: selectedContactId || "temp-contact", // Temporary contact for drafts
        items,
        status,
        paymentStatus,
        paidAmount,
        totalPrice: cartTotals.total,
        discountType,
        discountAmount: cartTotals.saleDiscount,
      }

      console.log("=".repeat(80))
      console.log("💰 CHECKOUT - SALE DATA BEING SENT")
      console.log("=".repeat(80))
      console.log("📤 Request Payload:", JSON.stringify(saleData, null, 2))
      console.log("")

      const response = await createSaleMutation.mutateAsync(saleData)
      
      console.log("✅ API RESPONSE RECEIVED")
      console.log("=".repeat(80))
      console.log("📥 Full Response Object:", JSON.stringify(response, null, 2))
      console.log("")
      console.log("📥 Response Details:", {
        id: response.id,
        invoiceNumber: response.invoiceNumber,
        invoiceSequence: response.invoiceSequence,
        branchId: response.branchId,
        branch: response.branch,
        contactId: response.contactId,
        contact: response.contact,
        status: response.status,
        paymentStatus: response.paymentStatus,
        paidAmount: response.paidAmount,
        totalPrice: response.totalPrice,
        totalAmount: response.totalAmount,
        discountType: response.discountType,
        discountAmount: response.discountAmount,
        businessId: response.businessId,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        itemsCount: response.items?.length || response.saleItems?.length || 0,
        items: response.items || response.saleItems,
        saleItems: response.saleItems,
      })
      console.log("")
      if (response.items || response.saleItems) {
        const items = response.items || response.saleItems || []
        console.log("📦 Sale Items Details:")
        items.forEach((item: any, index: number) => {
          console.log(`  Item ${index + 1}:`, {
            id: item.id,
            saleId: item.saleId,
            sku: item.sku,
            itemName: item.itemName,
            itemDescription: item.itemDescription,
            unit: item.unit,
            price: item.price,
            quantity: item.quantity,
            discountType: item.discountType,
            discountAmount: item.discountAmount,
            totalPrice: item.totalPrice,
            branchId: item.branchId,
            businessId: item.businessId,
            saleReturnId: item.saleReturnId,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          })
        })
      }
      console.log("=".repeat(80))

      // Store completed sale and show invoice
      // Fetch full sale details if response is missing nested data (branch/contact/items)
      let invoiceSale: Sale = response
      const responseItemsCount =
        (response.items?.length || 0) + (response.saleItems?.length || 0)
      if (!response.branch || !response.contact || responseItemsCount === 0) {
        try {
          invoiceSale = await salesApi.getSaleById(response.id)
        } catch {
          // If details fetch fails, fallback to the response we already have
        }
      }

      setCompletedSale(invoiceSale)
      setShowInvoice(true)
      // Prevent dialog stacking
      setShowRecentTransactions(false)
      playSound("success")
      
      toast.success("Sale completed successfully!")
      clearCart()
      // Don't auto-open recent transactions; user can open it manually
    } catch (error: any) {
      console.error("Checkout error:", error)
      playSound("error")
      toast.error(error?.message || "Failed to process sale")
    } finally {
      setIsProcessing(false)
    }
  }

  // Save as draft
  const handleSaveDraft = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty")
      return
    }

    if (!selectedBranchId) {
      toast.error("Please select a branch")
      return
    }

    setIsProcessing(true)

    try {
      const items = cart.map((item) => {
        // Ensure SKU is always present (required by DTO)
        const sku = item.sku || item.productId || `temp-sku-${item.productId}-${Date.now()}`
        
        return {
          sku: sku,
          itemName: item.itemName,
          itemDescription: item.itemDescription || "",
          unit: item.unit,
          price: item.price,
          quantity: item.quantity,
          discountType: item.discountType,
          discountAmount: item.discountAmount,
          totalPrice: calculateItemTotal(item),
        }
      })

      const saleData = {
        branchId: selectedBranchId!,
        contactId: selectedContactId || "temp-contact",
        items,
        status: "DRAFT" as const,
        paymentStatus: "DUE" as const,
        paidAmount: 0,
        totalPrice: cartTotals.total,
        discountType,
        discountAmount: cartTotals.saleDiscount,
      }

      await createSaleMutation.mutateAsync(saleData)
      toast.success("Draft saved successfully!")
    } catch (error: any) {
      console.error("Save draft error:", error)
      toast.error(error?.message || "Failed to save draft")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!currentBusiness?.modules?.includes("point-of-sale")) {
    return (
      <PageLayout title="Access Denied" description="You don't have access to this module">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              You don't have access to the Point of Sale module.
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Point of Sale" description="Process sales transactions" maxWidth="full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100dvh-180px)]">
        {/* Left Sidebar - Filters and Products */}
        <div className="lg:col-span-8 flex flex-col space-y-4 min-h-0">
          {/* Filters Bar */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Branch Filter */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Branch</Label>
                  <Select value={selectedBranchId || ""} onValueChange={switchBranch}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Category</Label>
                  <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Search */}
                <div className="md:col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1 block">Search Products</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Products
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProductDialog(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    New Product
                  </Button>
                  <Badge variant="secondary">
                    {filteredProducts.length} items
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              <ScrollArea className="h-full pr-2">
                {isLoadingProducts ? (
                  <div className="text-center py-12 text-muted-foreground">Loading products...</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchQuery ? "No products found" : "No products available"}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredProducts.map((product) => {
                      const variants = getProductVariants(product)
                      const hasMultipleSkus = variants.length > 1
                      const stock = variants[0]?.stock
                      const availableQty = stock?.quantity || 0
                      const isOutOfStock = product.manageStocks !== false && availableQty === 0
                      const isSelected = lastSelectedProductId === product.id
                      const inCart = cartProductIdSet.has(product.id)

                      // Get product image from first variant or null
                      const productImage = variants && variants.length > 0 && variants[0]?.variant
                        ? variants[0].variant.thumbnailUrl || (variants[0].variant.images && variants[0].variant.images[0])
                        : null

                      return (
                        <button
                          key={product.id}
                          onClick={() => !isOutOfStock && handleProductClick(product)}
                          disabled={isOutOfStock}
                          className={cn(
                            "p-3 border rounded-lg text-left hover:bg-accent hover:border-primary transition-colors",
                            "flex flex-col space-y-1.5 relative overflow-hidden",
                            isOutOfStock && "opacity-50 cursor-not-allowed",
                            inCart && "border-primary/60 bg-primary/5",
                            isSelected && "ring-2 ring-primary ring-offset-2"
                          )}
                        >
                          {inCart && (
                            <div className="absolute right-2 top-2 rounded-full bg-primary text-primary-foreground p-1">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                          {productImage && (
                            <div className="w-full aspect-square rounded-md overflow-hidden bg-muted mb-2">
                              <img
                                src={productImage}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="font-medium text-sm line-clamp-2 pr-6">{product.name}</div>
                          {product.price !== undefined && (
                            <div className="text-base font-bold text-primary">
                              {product.price.toFixed(2)}
                              {product.unit?.suffix && ` / ${product.unit.suffix}`}
                            </div>
                          )}
                          {hasMultipleSkus && (
                            <div className="text-xs text-muted-foreground">
                              {variants.length} variants
                            </div>
                          )}
                          {product.manageStocks !== false && (
                            <div
                              className={cn(
                                "text-xs",
                                isOutOfStock ? "text-destructive" : "text-muted-foreground"
                              )}
                            >
                              {isOutOfStock ? "Out of stock" : `${availableQty} available`}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Cart and Checkout */}
        <div className="lg:col-span-4 flex flex-col space-y-4 min-h-0">
          {/* Cart Card */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Cart ({cart.length})
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSoundEnabled((v) => !v)}
                    title={soundEnabled ? "Sound: On" : "Sound: Off"}
                  >
                    {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                  {cart.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0">
              {/* Whole cart panel scrolls when screen height is tight (prevents clipped content) */}
              <ScrollArea className="h-full">
                <div className="p-6 pt-0">
                  {/* Customer Selection */}
                  <div className="mb-3">
                    <Label className="text-xs mb-1 block">Customer</Label>
                    <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.name}
                            {contact.email && ` (${contact.email})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sale Type */}
                  <div className="mb-3">
                    <Label className="text-xs mb-1 block">Sale Type</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={saleType === "CARD" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSaleType("CARD")}
                        className="text-xs"
                      >
                        <Receipt className="h-3 w-3 mr-1" />
                        Sale
                      </Button>
                      <Button
                        variant={saleType === "DRAFT" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSaleType("DRAFT")}
                        className="text-xs"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Draft
                      </Button>
                      <Button
                        variant={saleType === "QUOTATION" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSaleType("QUOTATION")}
                        className="text-xs"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Quote
                      </Button>
                      <Button
                        variant={saleType === "SUSPEND" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSaleType("SUSPEND")}
                        className="text-xs"
                      >
                        <Pause className="h-3 w-3 mr-1" />
                        Hold
                      </Button>
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div className="mb-4">
                    <Label className="text-xs mb-2 block">Items</Label>
                    {cart.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground text-sm border rounded-lg bg-muted/20">
                        Cart is empty
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cart.map((item, index) => (
                          <div key={index} className="p-2 border rounded-lg space-y-2 bg-muted/30">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{item.itemName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {item.price.toFixed(2)} × {item.quantity} {item.unit}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={() => removeFromCart(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(index, -1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-sm font-medium w-8 text-center">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(index, 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="font-bold text-sm">
                                {item.totalPrice.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

              {/* Discount and Tax */}
              <div className="space-y-2 mb-4 flex-shrink-0 border-t pt-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-20">Discount:</Label>
                  <Select
                    value={discountType}
                    onValueChange={(v: "NONE" | "PERCENTAGE" | "FIXED") => {
                      setDiscountType(v)
                      if (v === "NONE") setDiscountAmount(0)
                    }}
                  >
                    <SelectTrigger className="h-8 w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      <SelectItem value="PERCENTAGE">%</SelectItem>
                      <SelectItem value="FIXED">Fixed</SelectItem>
                    </SelectContent>
                  </Select>
                  {discountType !== "NONE" && (
                    <Input
                      type="number"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      className="h-8 flex-1"
                      placeholder="Amount"
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-20">Tax Rate:</Label>
                  <Input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="h-8 flex-1"
                    placeholder="%"
                  />
                </div>
              </div>

              {/* Cart Summary */}
              {cart.length > 0 && (
                <div className="space-y-1.5 pt-3 border-t flex-shrink-0">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{cartTotals.itemsSubtotal.toFixed(2)}</span>
                  </div>
                  {cartTotals.saleDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount:</span>
                      <span className="text-green-600">-{cartTotals.saleDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax:</span>
                      <span>{taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t my-1" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{cartTotals.total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              {cart.length > 0 && saleType !== "DRAFT" && (
                <div className="mb-3 flex-shrink-0">
                  <Label className="text-xs mb-1 block">Payment Method</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={paymentMethod === "CASH" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentMethod("CASH")}
                      className="text-xs"
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      Cash
                    </Button>
                    <Button
                      variant={paymentMethod === "CARD" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentMethod("CARD")}
                      className="text-xs"
                    >
                      <CreditCard className="h-3 w-3 mr-1" />
                      Card
                    </Button>
                    <Button
                      variant={paymentMethod === "CREDIT" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentMethod("CREDIT")}
                      className="text-xs"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Credit
                    </Button>
                    <Button
                      variant={paymentMethod === "MIXED" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentMethod("MIXED")}
                      className="text-xs"
                    >
                      Mixed
                    </Button>
                  </div>

                  {/* Partial payment input */}
                  {paymentMethod === "MIXED" && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Paid Amount</span>
                        <span>
                          Due: {(Math.max(0, cartTotals.total - Math.min(Math.max(0, paidAmountInput || 0), cartTotals.total))).toFixed(2)}
                        </span>
                      </div>
                      <Input
                        type="number"
                        value={paidAmountInput}
                        onChange={(e) => setPaidAmountInput(Number(e.target.value))}
                        className="h-9"
                        min={0}
                        max={cartTotals.total}
                        step="0.01"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setPaidAmountInput(0)}
                        >
                          Due
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setPaidAmountInput(Math.round((cartTotals.total / 2) * 100) / 100)}
                        >
                          50%
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setPaidAmountInput(cartTotals.total)}
                        >
                          Full
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                {saleType === "DRAFT" ? (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSaveDraft}
                    disabled={cart.length === 0 || isProcessing}
                  >
                    <Save className="mr-2 h-5 w-5" />
                    Save Draft
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || !selectedContactId || isProcessing}
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    {isProcessing ? "Processing..." : "Checkout"}
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCalculator(!showCalculator)}
                  >
                    <Calculator className="h-4 w-4 mr-1" />
                    Calc
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowRecentTransactions(!showRecentTransactions)}
                  >
                    <History className="h-4 w-4 mr-1" />
                    History
                  </Button>
                </div>
              </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SKU Selection Dialog */}
      <Dialog open={isSkuDialogOpen} onOpenChange={setIsSkuDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select SKU</DialogTitle>
            <DialogDescription>
              {selectedProductForSku && `Select SKU for ${selectedProductForSku.name}`}
            </DialogDescription>
          </DialogHeader>
          {selectedProductForSku && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {getProductVariants(selectedProductForSku).map((variant, index) => {
                const stock = variant.stock
                const availableQty = stock?.quantity || 0
                const isOutOfStock = selectedProductForSku.manageStocks !== false && availableQty === 0

                return (
                  <button
                    key={variant.sku || index}
                    onClick={() => {
                      if (!isOutOfStock || !selectedProductForSku.manageStocks) {
                        addToCartWithSku(
                          selectedProductForSku,
                          variant.sku,
                          variant.variant,
                          variant.stock
                        )
                        setIsSkuDialogOpen(false)
                        setSelectedProductForSku(null)
                      }
                    }}
                    disabled={isOutOfStock && selectedProductForSku.manageStocks}
                    className={cn(
                      "w-full p-3 border rounded-lg text-left hover:bg-accent transition-colors",
                      isOutOfStock && selectedProductForSku.manageStocks && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{variant.sku || "No SKU"}</div>
                        {variant.variant && (
                          <div className="text-xs text-muted-foreground">
                            {variant.variant.variantName}
                          </div>
                        )}
                        {selectedProductForSku.manageStocks && (
                          <div className={cn(
                            "text-xs mt-1",
                            isOutOfStock ? "text-destructive" : "text-muted-foreground"
                          )}>
                            {isOutOfStock ? "Out of stock" : `${availableQty} available`}
                          </div>
                        )}
                      </div>
                      {variant.variant?.price && (
                        <div className="font-bold text-primary">
                          {variant.variant.price.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Calculator Dialog */}
      <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Calculator</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="p-3 border rounded-lg bg-muted text-right">
              <div className="text-xs text-muted-foreground min-h-[16px]">{calculatorDisplay}</div>
              <div className="text-2xl font-bold">{calculatorValue}</div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {["C", "/", "*", "-"].map((op) => (
                <Button key={op} variant="outline" onClick={() => handleCalculatorInput(op)}>
                  {op}
                </Button>
              ))}
              {["7", "8", "9", "+"].map((num) => (
                <Button key={num} variant="outline" onClick={() => handleCalculatorInput(num)}>
                  {num}
                </Button>
              ))}
              {["4", "5", "6", "="].map((num) => (
                <Button key={num} variant="outline" onClick={() => handleCalculatorInput(num)}>
                  {num}
                </Button>
              ))}
              {["1", "2", "3"].map((num) => (
                <Button key={num} variant="outline" onClick={() => handleCalculatorInput(num)}>
                  {num}
                </Button>
              ))}
              <Button
                variant="outline"
                className="col-span-2"
                onClick={() => handleCalculatorInput("0")}
              >
                0
              </Button>
              <Button variant="outline" onClick={() => handleCalculatorInput(".")}>
                .
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recent Transactions Dialog */}
      <Dialog open={showRecentTransactions} onOpenChange={setShowRecentTransactions}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Recent Transactions</DialogTitle>
            <DialogDescription>View your recent sales</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {recentSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No recent transactions</div>
            ) : (
              recentSales.map((sale) => (
                <Card key={sale.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{sale.contact?.name || sale.contactId}</div>
                        <div className="text-xs text-muted-foreground">
                          {sale.items?.length || 0} items • {new Date(sale.createdAt || "").toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{(sale.totalPrice || sale.totalAmount || 0).toFixed(2)}</div>
                        <Badge
                          variant={
                            sale.paymentStatus === "PAID"
                              ? "default"
                              : sale.paymentStatus === "DUE"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {sale.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Dialog */}
      <ProductDialog
        product={null}
        open={showProductDialog}
        onOpenChange={setShowProductDialog}
      />

      {/* Invoice Dialog */}
      <InvoiceDialog
        sale={completedSale}
        open={showInvoice}
        onOpenChange={setShowInvoice}
        onOpenRecentTransactions={() => {
          setShowInvoice(false)
          setShowRecentTransactions(true)
        }}
      />
    </PageLayout>
  )
}
