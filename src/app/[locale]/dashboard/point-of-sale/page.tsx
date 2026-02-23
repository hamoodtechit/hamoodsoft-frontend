"use client"

import { ContactDialog } from "@/components/common/contact-dialog"
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog"
import { InvoiceDialog } from "@/components/common/invoice-dialog"
import { PageLayout } from "@/components/common/page-layout"
import { ProductDialog } from "@/components/common/product-dialog"
import { SaleDialog } from "@/components/common/sale-dialog"
import { SystemLoader } from "@/components/common/system-loader"
import { POSSessionIndicator } from "@/components/pos/pos-session-indicator"
import { CloseSessionDialog, OpenSessionDialog } from "@/components/pos/session-dialogs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NumericInput } from "@/components/ui/numeric-input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { salesApi } from "@/lib/api/sales"
import { useAccounts } from "@/lib/hooks/use-accounts"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { useBranches } from "@/lib/hooks/use-branches"
import { useBrands } from "@/lib/hooks/use-brands"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { useCategories } from "@/lib/hooks/use-categories"
import { useContacts } from "@/lib/hooks/use-contacts"
import { useFuelTypes } from "@/lib/hooks/use-fuel-types"
import { usePOSSession } from "@/lib/hooks/use-pos-sessions"
import { useInfiniteProducts } from "@/lib/hooks/use-products"
import { useCreateSale, useDeleteSale, useSales } from "@/lib/hooks/use-sales"
import { useStocks } from "@/lib/hooks/use-stocks"
import { useInfiniteTankers } from "@/lib/hooks/use-tankers"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { cn } from "@/lib/utils"
import { getRandomGradient } from "@/lib/utils/aesthetics"
import { Product, ProductVariant, Sale, Stock, Tanker } from "@/types"
import {
    ArrowLeft,
    Calculator,
    Check,
    Container,
    Droplets,
    Edit,
    FileText,
    Filter,
    HelpCircle,
    History,
    LayoutGrid,
    List,
    LogOut,
    Minus,
    Package,
    Plus,
    Printer,
    Save,
    Search,
    ShoppingCart,
    Trash2,
    UserPlus,
    Volume2,
    VolumeX,
    X
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
  const currentBusiness = useCurrentBusiness()
  const { selectedBranchId, switchBranch } = useBranchSelection()

  // State management
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all")
  const [selectedBrandId, setSelectedBrandId] = useState<string>("all")
  const [barcodeInput, setBarcodeInput] = useState("")
  const [posMode, setPosMode] = useState<"standard" | "petrol">("standard")
  const [selectedTankerId, setSelectedTankerId] = useState<string | null>(null)
  const [selectedContactId, setSelectedContactId] = useState<string>("")
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
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
  const [showCloseSession, setShowCloseSession] = useState(false)
  const [completedSale, setCompletedSale] = useState<Sale | null>(null)
  const [transactionFilter, setTransactionFilter] = useState<"FINAL" | "QUOTATION" | "DRAFT">("FINAL")
  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null)
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null)
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [productViewMode, setProductViewMode] = useState<"grid" | "list">("list") // Default to list for performance
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  
  // UX
  const [lastSelectedProductId, setLastSelectedProductId] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true
    return localStorage.getItem("pos-sound-enabled") !== "0"
  })
  const audioCtxRef = useRef<AudioContext | null>(null)
  
  // Discount and Tax - Get tax rate from settings
  const { taxSettings } = useAppSettings()
  const defaultTaxRate = taxSettings?.rate ?? 0
  const [discountType, setDiscountType] = useState<"NONE" | "PERCENTAGE" | "FIXED">("NONE")
  const [discountAmount, setDiscountAmount] = useState(0)
  const [taxRate, setTaxRate] = useState(defaultTaxRate)
  
  // Update tax rate when settings load
  useEffect(() => {
    if (taxSettings?.rate !== undefined) {
      setTaxRate(taxSettings.rate)
    }
  }, [taxSettings?.rate])

  // Payment (partial)
  const [paidAmountInput, setPaidAmountInput] = useState<number>(0)
  
  // Flexible payment splitter for MIXED payments
  interface PaymentSplit {
    id: string
    accountId: string
    amount: number
  }
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([])
  
  // Account selection for single payment methods
  const [cashAccountId, setCashAccountId] = useState<string>("")
  const [bankAccountId, setBankAccountId] = useState<string>("")

  // Calculator state
  const [calculatorValue, setCalculatorValue] = useState("0")
  const [calculatorDisplay, setCalculatorDisplay] = useState("")

  // Fetch data with Infinite Query for better pagination
  const { 
    data: infiniteProductsData, 
    isLoading: isLoadingProducts,
    fetchNextPage: fetchNextProducts,
    hasNextPage: hasMoreProducts,
    isFetchingNextPage: isFetchingMoreProducts 
  } = useInfiniteProducts({
    branchId: selectedBranchId || undefined,
    categoryId: selectedCategoryId !== "all" ? selectedCategoryId : undefined,
    search: searchQuery.trim() || undefined,
    limit: 50,
  })
  
  const products = useMemo(() => 
    infiniteProductsData?.pages.flatMap(page => page.items) || [], 
  [infiniteProductsData])

  const { data: stocksData } = useStocks({
    branchId: selectedBranchId || undefined,
    limit: 10000,
  })
  const stocks = stocksData?.items || []

  const { data: contactsData } = useContacts({ type: "CUSTOMER" })
  const contacts = contactsData?.items || []

  const { data: categories = [] } = useCategories(selectedBranchId || undefined)
  const { data: brandsData } = useBrands()
  const brands = brandsData?.items || []
  const { data: branches = [] } = useBranches()

  const { data: fuelTypesData } = useFuelTypes({ limit: 1000 })
  const { 
    data: infiniteTankersData, 
    isLoading: isLoadingTankers,
    fetchNextPage: fetchNextTankers,
    hasNextPage: hasMoreTankers,
    isFetchingNextPage: isFetchingMoreTankers
  } = useInfiniteTankers({ 
    limit: 50,
    search: searchQuery.trim() || undefined
  })
  
  const tankers = useMemo(() => 
    infiniteTankersData?.pages.flatMap(page => page.items) || [],
  [infiniteTankersData])

  // Stock map by SKU - includes both separate stocks query and product.stocks
  const stockMapBySku = useMemo(() => {
    const map = new Map<string, Stock>()
    
    // Add stocks from separate query
    stocks.forEach((stock) => {
      if (stock.sku) {
        map.set(stock.sku, stock)
      }
    })
    
    // Also add stocks from product.stocks array (if available)
    products.forEach((product) => {
      if (product.stocks && Array.isArray(product.stocks)) {
        product.stocks.forEach((stock) => {
          if (stock.sku) {
            // Only add if not already in map (separate query takes precedence)
            if (!map.has(stock.sku)) {
              map.set(stock.sku, stock)
            }
          }
        })
      }
    })
    
    return map
  }, [stocks, products])

  // Sound logic
  const playSound = useCallback((kind: "add" | "remove" | "success" | "error") => {
    if (!soundEnabled) return
    if (typeof window === "undefined") return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  }, [soundEnabled])

  // Persist sound toggle
  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem("pos-sound-enabled", soundEnabled ? "1" : "0")
  }, [soundEnabled])

  // Recent transactions - filter by status
  const { data: recentSalesData } = useSales({
    branchId: selectedBranchId || undefined,
    limit: 50,
    page: 1,
    status: transactionFilter === "FINAL" ? "SOLD" : transactionFilter === "QUOTATION" ? "PENDING" : "DRAFT",
  })
  const recentSales = recentSalesData?.items || []

  const createSaleMutation = useCreateSale()
  const deleteSaleMutation = useDeleteSale()
  
  // Get accounts for payment creation
  const { data: accountsData } = useAccounts({ limit: 100 })
  const accounts = useMemo(() => (accountsData?.items ?? []).filter((acc) => acc.isActive), [accountsData?.items])
  
  // POS Session
  const { data: activeSession, isLoading: isLoadingSession, refetch: refetchSession } = usePOSSession(selectedBranchId || undefined)

  // Consolidate all account filtering to one place
  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => account.isActive)
  }, [accounts])

  // Update item quantity in cart
  const calculateItemTotal = useCallback((item: CartItem) => {
    const total = item.price * item.quantity
    if (item.discountType === "PERCENTAGE") {
      return total * (1 - item.discountAmount / 100)
    } else if (item.discountType === "FIXED") {
      return total - item.discountAmount
    }
    return total
  }, [])

  const updateQuantity = useCallback((index: number, delta: number) => {
    const updatedCart = [...cart]
    const item = updatedCart[index]
    const newQuantity = Math.max(0.001, item.quantity + delta) // Allow small decimals for fuel
    
    if (newQuantity < 0.001) return

    // For fuel items, check against tanker's current fuel
    if (item.productId?.startsWith("fuel-")) {
      const tanker = tankers.find((t: Tanker) => t.id === item.variantId)
      const availableFuel = tanker?.currentFuel || 0
      if (newQuantity > availableFuel) {
        playSound("error")
        toast.error(`Only ${availableFuel}L available in ${tanker?.name || "tanker"}`)
        updatedCart[index].quantity = availableFuel
      } else {
        updatedCart[index].quantity = newQuantity
        playSound(delta > 0 ? "add" : "remove")
      }
      updatedCart[index].availableQuantity = availableFuel
    } else {
      // For regular products
      const product = products.find((p) => p.id === item.productId)
      const managesStock = product?.manageStocks !== false

      if (managesStock && item.availableQuantity !== undefined && item.availableQuantity > 0) {
        const stock = item.sku ? stockMapBySku.get(item.sku) : undefined
        const availableQty = stock?.quantity || item.availableQuantity || 0

        if (newQuantity > availableQty) {
          playSound("error")
          toast.error(`Only ${availableQty} available in stock`)
          updatedCart[index].quantity = availableQty
        } else {
          updatedCart[index].quantity = Math.floor(newQuantity) // Standard products are integers
          playSound(delta > 0 ? "add" : "remove")
        }
        updatedCart[index].availableQuantity = availableQty
      } else {
        updatedCart[index].quantity = Math.floor(newQuantity)
        playSound(delta > 0 ? "add" : "remove")
      }
    }

    updatedCart[index].totalPrice = calculateItemTotal(updatedCart[index])
    setCart(updatedCart)
  }, [cart, products, stockMapBySku, calculateItemTotal, playSound, tankers])

  // Set absolute quantity
  const setQuantity = useCallback((index: number, quantity: number) => {
    const updatedCart = [...cart]
    const item = updatedCart[index]
    const newQuantity = Math.max(0.001, quantity) // Allow small decimals for fuel

    // For fuel items, check against tanker's current fuel
    if (item.productId?.startsWith("fuel-")) {
      const tanker = tankers.find((t: Tanker) => t.id === item.variantId)
      const availableFuel = tanker?.currentFuel || 0
      if (newQuantity > availableFuel) {
        playSound("error")
        toast.error(`Only ${availableFuel}L available in ${tanker?.name || "tanker"}`)
        updatedCart[index].quantity = availableFuel
      } else {
        updatedCart[index].quantity = newQuantity
        playSound("add")
      }
      updatedCart[index].availableQuantity = availableFuel
    } else {
      // For regular products
      const product = products.find((p) => p.id === item.productId)
      const managesStock = product?.manageStocks !== false

      if (managesStock && item.availableQuantity !== undefined && item.availableQuantity > 0) {
        const stock = item.sku ? stockMapBySku.get(item.sku) : undefined
        const availableQty = stock?.quantity || item.availableQuantity || 0

        if (newQuantity > availableQty) {
          playSound("error")
          toast.error(`Only ${availableQty} available in stock`)
          updatedCart[index].quantity = availableQty
        } else {
          updatedCart[index].quantity = Math.floor(newQuantity)
          playSound("add")
        }
        updatedCart[index].availableQuantity = availableQty
      } else {
        updatedCart[index].quantity = Math.floor(newQuantity)
        playSound("add")
      }
    }

    updatedCart[index].totalPrice = calculateItemTotal(updatedCart[index])
    setCart(updatedCart)
  }, [cart, products, stockMapBySku, calculateItemTotal, playSound, tankers])

  const cashAccounts = useMemo(() => accounts.filter((acc) => acc.type === "CASH"), [accounts])
  const bankAccounts = useMemo(() => accounts.filter((acc) => acc.type === "BANK"), [accounts])
  
  // Set default accounts when available
  useEffect(() => {
    if (accounts.length > 0) {
      // For CASH payment method, prefer CASH type account, but fallback to any account
      if (paymentMethod === "CASH" && !cashAccountId) {
        const cashAccount = cashAccounts.length > 0 ? cashAccounts[0] : accounts[0]
        setCashAccountId(cashAccount.id)
      }
      // For CARD payment method, prefer BANK type account, but fallback to any account
      if (paymentMethod === "CARD" && !bankAccountId) {
        const bankAccount = bankAccounts.length > 0 ? bankAccounts[0] : accounts[0]
        setBankAccountId(bankAccount.id)
      }
    }
  }, [accounts, cashAccounts, bankAccounts, paymentMethod, cashAccountId, bankAccountId])

  // Check access
  useEffect(() => {
    if (currentBusiness && !currentBusiness.modules?.includes("point-of-sale")) {
      router.push(`/${locale}/dashboard`)
    }
  }, [currentBusiness, locale, router])

  // Filter products by brand (client-side since API doesn't support brandId filter yet)
  // Category and search are handled by API
  const filteredProducts = useMemo(() => {
    let filtered = products

    // Filter by brand (client-side)
    if (selectedBrandId !== "all") {
      filtered = filtered.filter((p) => p.brandId === selectedBrandId)
    }

    return filtered
  }, [products, selectedBrandId])


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
  const getProductVariants = useCallback((product: Product): Array<{ sku: string; variant: ProductVariant | null; stock?: Stock }> => {
    const variants: Array<{ sku: string; variant: ProductVariant | null; stock?: Stock }> = []
    
    // Use productVariants from API response, or fallback to variants (normalized)
    const productVariants = product.productVariants || product.variants || []

    if (productVariants.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      productVariants.forEach((variant: any) => {
        // Ensure we have a SKU (use variant.sku or variant.id as fallback)
        const sku = variant.sku || variant.id || product.id
        
        // Try to find stock: multiple strategies
        let stock: Stock | undefined = undefined
        
        // Strategy 1: Find by SKU in stockMapBySku
        stock = stockMapBySku.get(sku)
        
        // Strategy 2: Find by SKU in product.stocks
        if (!stock && product.stocks && Array.isArray(product.stocks)) {
          stock = product.stocks.find((s) => s.sku === sku && s.branchId === selectedBranchId)
        }
        
        // Strategy 3: Try from separate stocks query by SKU
        if (!stock) {
          stock = stocks.find((s) => s.sku === sku && s.branchId === selectedBranchId)
        }
        
        // Strategy 4: For variable products, if variant has no stock but product has stocks, 
        // try to find any stock for this product (variant might not have explicit SKU match)
        // This handles cases where stock SKU doesn't match variant SKU exactly
        if (!stock && product.stocks && Array.isArray(product.stocks)) {
          // Try to find stock by productId and branchId (for variable products)
          // Use the first stock found for this product/branch
          stock = product.stocks.find((s) => s.productId === product.id && s.branchId === selectedBranchId)
        }
        
        // Strategy 5: Try from separate stocks query by productId (fallback for variable products)
        if (!stock) {
          stock = stocks.find((s) => s.productId === product.id && s.branchId === selectedBranchId)
        }
        
        // Get price: For variants, prioritize variant.price over stock.salePrice
        // Priority: variant.price > stock.salePrice > product.price
        // This ensures variant-specific pricing is used first
        const originalVariantPrice = variant.price !== null && variant.price !== undefined ? variant.price : null
        const variantPrice = originalVariantPrice ?? stock?.salePrice ?? product.price ?? 0
        
        // Map variant to ProductVariant type
        // Preserve the original variant object but use calculated price for display/cart
        const variantData: ProductVariant = {
          id: variant.id || '',
          productId: product.id,
          sku: sku,
          price: variantPrice, // Use calculated price (stock.salePrice > variant.price > product.price)
          unitId: variant.unitId || product.unitId,
          variantName: variant.variantName || '',
          options: variant.options || {},
          thumbnailUrl: variant.thumbnailUrl || null,
          images: variant.images || [],
        }
        
        // Debug log in development to track price calculation
        if (process.env.NODE_ENV === "development") {
          console.log("🔍 Variant Price Calculation:", {
            variantId: variant.id,
            variantName: variant.variantName,
            originalVariantPrice: variant.price,
            stockSalePrice: stock?.salePrice,
            productPrice: product.price,
            calculatedPrice: variantPrice,
            sku: sku
          })
        }
        
        variants.push({
          sku,
          variant: variantData,
          stock,
        })
      })
    } else {
      // No variants - use product-level stock
      // First try from separate stocks query
      let stock = stocks.find((s) => s.productId === product.id && s.branchId === selectedBranchId)
      
      // If not found, try from product.stocks
      if (!stock && product.stocks && Array.isArray(product.stocks)) {
        stock = product.stocks.find((s) => s.productId === product.id && s.branchId === selectedBranchId)
      }
      
      // Get price: Use stock.salePrice if available, otherwise product.price
      variants.push({
        sku: stock?.sku || product.id, // Use product ID as fallback SKU
        variant: null,
        stock,
      })
    }

    return variants
  }, [stockMapBySku, stocks, selectedBranchId])

  // Calculate item total
  // The old calculateItemTotal was here, now it's moved up with updateQuantity.

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
    
    const total = afterDiscount + calculatedTax

    return {
      itemsSubtotal,
      saleDiscount,
      afterDiscount,
      tax: calculatedTax,
      total,
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    }
  }, [cart, discountType, discountAmount, taxRate, calculateItemTotal])

  // Keep paidAmountInput sane when totals/payment method change
  useEffect(() => {
    if (saleType === "DRAFT") {
      setPaidAmountInput(0)
      setPaymentSplits([])
      return
    }
    if (paymentMethod === "CREDIT") {
      setPaidAmountInput(0)
      setPaymentSplits([])
      return
    }
    // default to full payment for cash/card
    if (paymentMethod === "CASH" || paymentMethod === "CARD") {
      setPaidAmountInput(cartTotals.total)
      setPaymentSplits([])
      return
    }
    // for mixed, keep existing but clamp
    if (paymentMethod === "MIXED") {
      setPaidAmountInput((v) => Math.min(Math.max(0, v || 0), cartTotals.total))
      // Auto-add one split if none exist and accounts are available
      if (paymentSplits.length === 0 && accounts.length > 0) {
        setPaymentSplits([
          {
            id: `split-${Date.now()}`,
            accountId: accounts[0].id,
            amount: 0,
          },
        ])
      }
    }
  }, [cartTotals.total, paymentMethod, saleType, accounts, paymentSplits.length])

  // Add to cart with SKU
  const addToCartWithSku = useCallback((
    product: Product,
    sku: string,
    variant: ProductVariant | null,
    stock: Stock | undefined
  ) => {
    const unit = product.unit?.suffix || "pcs"
    const managesStock = product.manageStocks !== false

    // Priority for SKU: 
    // 1. Variant SKU (if provided)
    // 2. Stock SKU (if found)
    // 3. Fallback to product.id
    const finalSku = sku || variant?.sku || stock?.sku || product.id
    
    // BUILD ITEM NAME WITH VARIANT NAME
    const itemName = variant?.variantName 
      ? `${product.name} - ${variant.variantName}`
      : product.name

    // FIND EXISTING ITEM IN CART
    // Use BOTH productId AND finalSku to ensure variants are distinct
    const existingItemIndex = cart.findIndex(
      (item) => item.productId === product.id && item.sku === finalSku
    )

    // Stock lookup refinement
    let finalStock = stock
    if (!finalStock && product.stocks && Array.isArray(product.stocks)) {
      finalStock = product.stocks.find((s) => s.sku === finalSku && s.branchId === selectedBranchId)
      if (!finalStock && !variant) { 
        // Only fallback to product-level stock if we don't have a specific variant SKU
        finalStock = product.stocks.find((s) => s.productId === product.id && s.branchId === selectedBranchId)
      }
    }
    
    // Price lookup: Priority is Variant > Stock > Product
    const price = variant?.price ?? finalStock?.salePrice ?? product.price ?? 0
    const availableQty = finalStock?.quantity || (variant ? 0 : (product.manageStocks === false ? 999999 : 0))

    if (existingItemIndex >= 0) {
      const updatedCart = [...cart]
      const currentItem = updatedCart[existingItemIndex]
      const newQuantity = currentItem.quantity + 1

      if (managesStock && availableQty > 0) {
        if (newQuantity > availableQty) {
          playSound("error")
          toast.error(`Only ${availableQty} available in stock`)
          updatedCart[existingItemIndex].quantity = availableQty
        } else {
          updatedCart[existingItemIndex].quantity = newQuantity
          playSound("add")
        }
      } else {
        updatedCart[existingItemIndex].quantity = newQuantity
        playSound("add")
      }

      updatedCart[existingItemIndex].availableQuantity = availableQty
      updatedCart[existingItemIndex].totalPrice = calculateItemTotal(updatedCart[existingItemIndex])
      setCart(updatedCart)
    } else {
      // Out of stock check
      if (managesStock && finalStock !== undefined && availableQty <= 0) {
        playSound("error")
        toast.error("This item is out of stock")
        return
      }

      const newItem: CartItem = {
        productId: product.id,
        sku: finalSku,
        variantId: variant?.id,
        itemName,
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
  }, [cart, selectedBranchId, stocks, calculateItemTotal, playSound])

  // Handle product click
  const handleProductClick = useCallback((product: Product) => {
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
  }, [getProductVariants, addToCartWithSku])

  const handleTankerClick = useCallback((tanker: Tanker) => {
    if (!tanker.fuelType) return
    
    const fuelType = tanker.fuelType
    const productId = `fuel-${fuelType.id}`
    // Use tanker ID as the unique SKU for fuel items to prevent merging different tankers
    const tankerSku = tanker.id 
    
    const existingIndex = cart.findIndex(
      (item) => item.productId === productId && item.sku === tankerSku
    )

    if (existingIndex !== -1) {
      updateQuantity(existingIndex, 1)
    } else {
      const newItem: CartItem = {
        productId: productId,
        sku: tankerSku,
        variantId: tanker.id,
        itemName: `${fuelType.name} (${tanker.name})`,
        itemDescription: `Fuel from ${tanker.name}`,
        unit: "Liter", 
        price: fuelType.price,
        quantity: 1,
        availableQuantity: tanker.currentFuel,
        discountType: "NONE",
        discountAmount: 0,
        totalPrice: fuelType.price,
      }
      playSound("add")
      setCart([...cart, newItem])
    }
  }, [cart, updateQuantity, playSound])

  // Handle barcode scanning (moved after addToCartWithSku and handleProductClick)
  const handleBarcodeScan = useCallback((barcode: string) => {
    if (!barcode.trim()) return

    // Find product by barcode
    let foundProduct: Product | null = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let foundVariant: any = null
    let foundStock: Stock | undefined = undefined

    // Search in products
    for (const product of products) {
      // Check product barcode
      if (product.barcode === barcode) {
        foundProduct = product
        // Find stock for regular product
        if (product.stocks && Array.isArray(product.stocks)) {
          foundStock = product.stocks.find((s) => s.productId === product.id && s.branchId === selectedBranchId)
        }
        if (!foundStock) {
          foundStock = stocks.find((s) => s.productId === product.id && s.branchId === selectedBranchId)
        }
        break
      }

      // Check variant SKUs (barcode scanner might scan SKU)
      const variants = product.productVariants || product.variants || []
      for (const variant of variants) {
        if (variant.sku === barcode) {
          foundProduct = product
          foundVariant = variant
          // Find stock for this variant
          if (product.stocks && Array.isArray(product.stocks)) {
            foundStock = product.stocks.find((s) => s.sku === variant.sku && s.branchId === selectedBranchId)
          }
          if (!foundStock) {
            foundStock = stocks.find((s) => s.sku === variant.sku && s.branchId === selectedBranchId)
          }
          break
        }
      }
      if (foundProduct) break
    }

    if (foundProduct) {
      const managesStock = foundProduct.manageStocks !== false
      
      // Check stock availability before adding
      if (managesStock) {
        if (foundStock === undefined) {
          playSound("error")
          toast.error("Stock not available for this item")
          setBarcodeInput("")
          return
        }
        if (foundStock.quantity <= 0) {
          playSound("error")
          toast.error("This item is out of stock")
          setBarcodeInput("")
          return
        }
      }
      
      // If variant found, add directly to cart
      if (foundVariant) {
        // Get price from stock if available
        const variantPrice = foundStock?.salePrice ?? foundVariant.price ?? foundProduct.price ?? 0
        
        const variantData: ProductVariant = {
          id: foundVariant.id || '',
          productId: foundProduct.id,
          sku: foundVariant.sku,
          price: variantPrice,
          unitId: foundVariant.unitId || foundProduct.unitId,
          variantName: foundVariant.variantName || '',
          options: foundVariant.options || {},
          thumbnailUrl: foundVariant.thumbnailUrl || null,
          images: foundVariant.images || [],
        }
        addToCartWithSku(foundProduct, foundVariant.sku, variantData, foundStock)
        playSound("add")
        toast.success(`Added ${foundProduct.name}${foundVariant.variantName ? ` - ${foundVariant.variantName}` : ''}`)
      } else {
        // Regular product - handle normally (will check stock in handleProductClick/addToCartWithSku)
        handleProductClick(foundProduct)
      }
      setBarcodeInput("")
    } else {
      playSound("error")
      toast.error("Product not found")
      setBarcodeInput("")
    }
  }, [products, stocks, selectedBranchId, addToCartWithSku, handleProductClick, playSound])

  // Handle barcode input (scan or manual entry)
  useEffect(() => {
    if (barcodeInput.length >= 3) {
      // Debounce barcode input (barcode scanners typically send data quickly)
      const timer = setTimeout(() => {
        handleBarcodeScan(barcodeInput)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [barcodeInput, handleBarcodeScan])

  // Payment splits for Mixed payment
  const addPaymentSplit = useCallback(() => {
    setPaymentSplits([
      ...paymentSplits,
      { id: Math.random().toString(36).substr(2, 9), accountId: "", amount: 0 }
    ])
  }, [paymentSplits])

  const removePaymentSplit = useCallback((id: string) => {
    setPaymentSplits(paymentSplits.filter(s => s.id !== id))
  }, [paymentSplits])

  const updatePaymentSplit = useCallback((id: string, updates: Partial<PaymentSplit>) => {
    setPaymentSplits(paymentSplits.map(s => s.id === id ? { ...s, ...updates } : s))
  }, [paymentSplits])

  // Remove from cart
  const removeFromCart = useCallback((index: number) => {
    playSound("remove")
    setCart(cart.filter((_, i) => i !== index))
  }, [cart, playSound])

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([])
    setSelectedContactId("")
    setDiscountType("NONE")
    setDiscountAmount(0)
    setTaxRate(0)
  }, [])

  // Calculator functions
  const handleCalculatorInput = useCallback((value: string) => {
    if (value === "C") {
      setCalculatorValue("0")
      setCalculatorDisplay("")
      return
    }

    if (value === "=") {
      try {
        // eslint-disable-next-line no-eval
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
  }, [calculatorDisplay, calculatorValue])

  // Process checkout
  const handleCheckout = useCallback(async () => {
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
      if (item.productId?.startsWith("fuel-")) {
        const tanker = tankers.find((t: Tanker) => t.id === item.variantId)
        const availableFuel = tanker?.currentFuel || 0
        if (item.quantity > availableFuel) {
          stockErrors.push(`${item.itemName}: Only ${availableFuel}L available`)
        }
      } else {
        const product = products.find((p) => p.id === item.productId)
        const managesStock = product?.manageStocks !== false

        if (managesStock && item.availableQuantity !== undefined) {
          const stock = item.sku ? stockMapBySku.get(item.sku) : undefined
          const availableQty = stock?.quantity || item.availableQuantity || 0

          if (item.quantity > availableQty) {
            stockErrors.push(`${item.itemName}: Only ${availableQty} available`)
          }
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
        
        const itemData = {
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

      // Prepare payments array if paidAmount > 0 and sale is SOLD
      const payments: {
        accountId: string
        amount: number
        branchId: string
        contactId?: string
        notes: string
        occurredAt: string
        type: "SALE_PAYMENT" | "PURCHASE_PAYMENT"
      }[] = []
      if (paidAmount > 0 && status === "SOLD") {
        if (paymentMethod === "CASH" && cashAccountId) {
          payments.push({
            accountId: cashAccountId,
            amount: paidAmount,
            branchId: selectedBranchId,
            contactId: selectedContactId || undefined,
            notes: `Payment for sale`,
            occurredAt: new Date().toISOString(),
            type: "SALE_PAYMENT",
          })
        } else if (paymentMethod === "CARD" && bankAccountId) {
          payments.push({
            accountId: bankAccountId,
            amount: paidAmount,
            branchId: selectedBranchId,
            contactId: selectedContactId || undefined,
            notes: `Payment for sale`,
            occurredAt: new Date().toISOString(),
            type: "SALE_PAYMENT",
          })
        } else if (paymentMethod === "MIXED") {
          // For MIXED: use flexible payment splits
          paymentSplits.forEach((split) => {
            if (split.accountId && split.amount > 0) {
              const account = accounts.find((acc) => acc.id === split.accountId)
              payments.push({
                accountId: split.accountId,
                amount: split.amount,
                branchId: selectedBranchId,
                contactId: selectedContactId || undefined,
                notes: `Payment for sale${account ? ` (${account.name})` : ""}`,
                occurredAt: new Date().toISOString(),
                type: "SALE_PAYMENT",
              })
            }
          })
        }
      }

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
        ...(payments.length > 0 && { payments }),
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Checkout error:", error)
      playSound("error")
      toast.error(error?.message || "Failed to process sale")
    } finally {
      setIsProcessing(false)
    }
  }, [
    cart, 
    selectedBranchId, 
    selectedContactId, 
    saleType, 
    paymentMethod, 
    paidAmountInput, 
    cartTotals, 
    discountType, 
    cashAccountId, 
    bankAccountId, 
    paymentSplits, 
    accounts, 
    products, 
    stockMapBySku, 
    calculateItemTotal, 
    playSound, 
    createSaleMutation, 
    clearCart,
    tankers
  ])

  // Save as draft
  const handleSaveDraft = useCallback(async () => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Save draft error:", error)
      toast.error(error?.message || "Failed to save draft")
    } finally {
      setIsProcessing(false)
    }
  }, [
    cart, 
    selectedBranchId, 
    selectedContactId, 
    cartTotals.total, 
    cartTotals.saleDiscount, 
    discountType, 
    calculateItemTotal, 
    createSaleMutation
  ])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input (except for specific cases)
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
          toast.error("Please select a customer first")
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
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [cart, selectedContactId, isProcessing, saleType, handleCheckout, handleSaveDraft, clearCart])

  if (!currentBusiness?.modules?.includes("point-of-sale")) {
    return (
      <PageLayout title="Access Denied" description="You don&apos;t have access to this module">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              You don&apos;t have access to the Point of Sale module.
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Custom Compact Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card shrink-0">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push(`/${locale}/dashboard`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Exit POS</span>
          </Button>
          
          <div className="h-6 w-[1px] bg-border" />

          <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border">
            <Button
              variant={posMode === "standard" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPosMode("standard")}
              className={cn("h-8 px-3 transition-all", posMode === "standard" && "shadow-sm")}
            >
              <Package className="h-4 w-4 mr-2" />
              Standard
            </Button>
            {currentBusiness?.modules?.includes("oil-filling-station") && (
              <Button
                variant={posMode === "petrol" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPosMode("petrol")}
                className={cn("h-8 px-3 transition-all", posMode === "petrol" && "shadow-sm")}
              >
                <Droplets className="h-4 w-4 mr-2" />
                Petrol Pump
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Action buttons could go here if they fit better than the sidebar */}
          <POSSessionIndicator />
          <div className="h-6 w-[1px] bg-border" />
          <Badge variant="outline" className="font-mono">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Badge>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
        {/* Left Sidebar - Filters and Products */}
        <div className="lg:col-span-8 flex flex-col space-y-4 min-h-0">
          {/* Top Bar - Scan, Search, Filter & View Toggle */}
          <Card className="flex-shrink-0">
            <CardContent className="py-3">
              <div className="flex flex-col sm:flex-row items-end gap-3">
                {/* Barcode Scanner */}
                <div className="flex-1 w-full">
                  <Label className="text-[10px] text-muted-foreground uppercase font-bold mb-1 block">
                    Barcode
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        ref={barcodeInputRef}
                        placeholder="Scan or type SKU... (/)"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && barcodeInput.trim()) {
                            e.preventDefault()
                            handleBarcodeScan(barcodeInput)
                          }
                        }}
                        className="pl-9 h-10"
                      />
                  </div>
                </div>

                {/* Search */}
                <div className="flex-1 w-full">
                  <Label className="text-[10px] text-muted-foreground uppercase font-bold mb-1 block">
                    Search Products
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      ref={searchInputRef}
                      placeholder="Search by name... (F1)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={() => setShowCalculator(!showCalculator)}
                    title="Calculator"
                  >
                    <Calculator className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={() => setShowRecentTransactions(!showRecentTransactions)}
                    title="History"
                  >
                    <History className="h-4 w-4" />
                  </Button>

                  {activeSession && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all"
                      onClick={() => setShowCloseSession(true)}
                      title="Close Session (End Shift)"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={() => setIsFilterDialogOpen(true)}
                    title="Filters"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={() => setShowShortcutsHelp(true)}
                    title="Keyboard Shortcuts (?)"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center border rounded-md p-1 bg-muted/20">
                    <Button
                      variant={productViewMode === "grid" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setProductViewMode("grid")}
                      title="Grid View"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={productViewMode === "list" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setProductViewMode("list")}
                      title="List View"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories or Petrol Selection */}
          {posMode === "standard" ? (
            <Card className="flex-shrink-0">
              <CardContent className="p-3">
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex space-x-2 pb-1">
                    <Button
                      variant={selectedCategoryId === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategoryId("all")}
                      className="rounded-full px-5 text-xs font-semibold"
                    >
                      All Items
                    </Button>
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategoryId === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategoryId(category.id)}
                        className="rounded-full px-5 text-xs font-semibold"
                      >
                        {category.name}
                      </Button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex-shrink-0">
              <CardContent className="p-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Droplets className="h-4 w-4 text-primary" />
                    Petrol Pump Selling Mode
                  </div>
                  <Badge variant="outline">Select Tanker Below</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products Grid */}
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
                      Select Tanker / Fuel
                    </>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {posMode === "standard" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => setShowProductDialog(true)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      New Product
                    </Button>
                  )}
                  <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
                    {posMode === "standard" ? products.length : tankers.length} items
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              <ScrollArea className="h-full pr-2">
                {isLoadingProducts || isLoadingTankers ? (
                  <div className="py-20">
                    <SystemLoader text={`Loading ${posMode === "standard" ? "products" : "tankers"}...`} />
                  </div>
                ) : posMode === "standard" && products.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchQuery ? "No products found" : "No products available"}
                  </div>
                ) : posMode === "petrol" && (tankers.length === 0) ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No tankers found
                  </div>
                ) : (
                  <div className={cn(
                    "py-2",
                    productViewMode === "grid" 
                      ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                      : "space-y-2"
                  )}>
                    {posMode === "standard" ? (
                      products.map((product) => {
                        const variants = getProductVariants(product)
                        const hasMultipleVariants = variants.length > 1
                        const firstVariant = variants[0]?.variant
                        const stock = variants[0]?.stock
                        const managesStock = product.manageStocks !== false
                        
                        const isOutOfStock = managesStock && (
                          hasMultipleVariants 
                            ? variants.every(v => !v.stock || v.stock.quantity === 0)
                            : !stock || stock.quantity === 0
                        )

                        const productImage = firstVariant?.thumbnailUrl || product.thumbnailUrl || null
                        const displayPrice = stock?.salePrice ?? firstVariant?.price ?? product.price ?? 0
                        const inCart = cartProductIdSet.has(product.id)
                        const isSelected = lastSelectedProductId === product.id

                        if (productViewMode === "list") {
                          return (
                            <button
                              key={product.id}
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
                                  <img src={productImage} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="h-6 w-6 m-auto text-foreground/20" />
                                )}
                              </div>
                              <div className="flex-1 text-left">
                                <div className="font-bold text-sm truncate">{product.name}</div>
                                  <div className="text-xs text-muted-foreground">SKU: {variants[0]?.sku || 'N/A'}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-black text-primary">{displayPrice.toFixed(2)}</div>
                                <div className="text-[10px] text-muted-foreground">{product.unit?.suffix}</div>
                              </div>
                              {managesStock && (
                                <Badge variant={isOutOfStock ? "destructive" : "outline"} className="ml-2 text-[10px]">
                                  {isOutOfStock ? "OOS" : `In: ${stock?.quantity || 0}`}
                                </Badge>
                              )}
                            </button>
                          )
                        }

                        return (
                          <button
                            key={product.id}
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
                                <img
                                  src={productImage}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                                  {isOutOfStock ? "Out of Stock" : `${stock?.quantity || 0} available`}
                                </Badge>
                              )}
                            </div>
                          </button>
                        )
                      })
                    ) : (
                      tankers.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).map((tanker) => {
                        const fuelType = tanker.fuelType
                        const inCart = cart.some((item) => item.variantId === tanker.id)
                        const fuelLevel = (tanker.currentFuel / tanker.capacity) * 100
                        
                        if (productViewMode === "list") {
                          return (
                            <button
                              key={tanker.id}
                              onClick={() => handleTankerClick(tanker)}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                                "bg-gradient-to-br", getRandomGradient(tanker.id, 'subtle'),
                                "hover:border-primary/50 hover:bg-primary/5",
                                inCart && "border-primary/30 ring-1 ring-primary/20"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded flex-shrink-0 border flex overflow-hidden bg-gradient-to-br",
                                getRandomGradient(tanker.id, 'vibrant')
                              )}>
                                <Droplets className="h-6 w-6 m-auto text-primary" />
                              </div>
                              <div className="flex-1 text-left">
                                <div className="font-bold text-sm truncate">{tanker.name}</div>
                                  <div className="text-xs text-muted-foreground">{fuelType?.name || 'Loading...'}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-black text-primary">{fuelType?.price.toFixed(2)}</div>
                                <div className="text-[10px] text-muted-foreground">per Liter</div>
                              </div>
                              <div className="ml-4 w-24">
                                <div className="text-[10px] mb-1">Level: {tanker.currentFuel}L</div>
                                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className={cn("h-full", fuelLevel < 20 ? "bg-destructive" : "bg-primary")} 
                                    style={{ width: `${fuelLevel}%` }}
                                  />
                                </div>
                              </div>
                            </button>
                          )
                        }

                        return (
                          <button
                            key={tanker.id}
                            onClick={() => handleTankerClick(tanker)}
                            className={cn(
                              "group relative border-2 rounded-xl overflow-hidden p-4",
                              "bg-gradient-to-br", getRandomGradient(tanker.id, 'subtle'),
                              "transition-all duration-200 ease-in-out",
                              "hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50",
                              "active:scale-[0.98]",
                              "flex flex-col h-full",
                              inCart && "border-primary/40 shadow-md shadow-primary/5"
                            )}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className={cn(
                                "h-10 w-10 flex items-center justify-center rounded-lg bg-gradient-to-br text-primary",
                                getRandomGradient(tanker.id, 'vibrant')
                              )}>
                                <Droplets className="h-6 w-6" />
                              </div>
                              {inCart && (
                                <div className="rounded-full bg-primary text-primary-foreground p-1 shadow-md">
                                  <Check className="h-3 w-3" />
                                </div>
                              )}
                            </div>
                            
                            <div className="text-left flex-1">
                              <h3 className="font-bold text-sm truncate mb-1">{tanker.name}</h3>
                              <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider font-semibold">
                                {fuelType?.name || 'Loading...'}
                              </p>
                              
                              <div className="flex items-end justify-between mt-auto">
                                <div>
                                  <div className="text-lg font-black text-primary">{fuelType?.price.toFixed(2)}</div>
                                  <div className="text-[10px] text-muted-foreground">Price/Liter</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-bold">{tanker.currentFuel}L</div>
                                  <div className="text-[10px] text-muted-foreground">Current Level</div>
                                </div>
                              </div>
                              <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-3">
                                <div 
                                  className={cn("h-full", fuelLevel < 20 ? "bg-destructive" : "bg-primary")} 
                                  style={{ width: `${fuelLevel}%` }}
                                />
                              </div>
                            </div>
                          </button>
                        )
                      })
                    )}
                    
                    {/* Load More Button */}
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

                    {posMode === "petrol" && hasMoreTankers && (
                      <div className={cn(
                        "flex justify-center py-6",
                        productViewMode === "grid" ? "col-span-full" : "w-full"
                      )}>
                        <Button 
                          variant="outline" 
                          size="lg"
                          disabled={isFetchingMoreTankers}
                          onClick={() => fetchNextTankers()}
                          className="px-12 rounded-full border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all w-full md:w-auto"
                        >
                          {isFetchingMoreTankers ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin text-lg">⏳</div>
                              Loading...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              Load More Tankers
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
            <CardContent className="flex-1 min-h-0 p-0 flex flex-col">
              {/* Whole cart panel scrolls when screen height is tight (prevents clipped content) */}
              <ScrollArea className="flex-1">
                <div className="p-6 pt-0">
                  {/* Cart Items - Moved to occupy more height */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                       <Label className="text-xs block">Items</Label>
                       <Badge variant="outline" className="text-[10px] py-0">{cart.length} items</Badge>
                    </div>
                    {cart.length === 0 ? (
                      <div className="text-center py-20 text-muted-foreground text-sm border rounded-lg bg-muted/20 border-dashed">
                        <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        Cart is empty
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cart.map((item, index) => {
                          const product = products.find((p) => p.id === item.productId)
                          const variant = product?.productVariants?.find((v) => v.id === item.variantId) ||
                                          product?.variants?.find((v) => v.id === item.variantId)
                          const variantImage = variant?.thumbnailUrl || product?.thumbnailUrl

                          return (
                            <div key={index} className="px-3 py-2 border rounded-lg bg-card hover:border-primary/30 transition-colors flex items-center gap-2">
                              {variantImage && (
                                <div className="w-8 h-8 rounded overflow-hidden bg-muted flex-shrink-0 border">
                                  <img
                                    src={variantImage}
                                    alt={item.itemName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold truncate leading-tight">{item.itemName}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  {item.price.toFixed(2)}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(index, -1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <NumericInput
                                  value={item.quantity}
                                  onValueChange={(val) => setQuantity(index, val)}
                                  className="h-7 w-12 text-xs text-center p-0 border-none bg-transparent"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(index, 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="text-xs font-black text-primary min-w-[60px] text-right">
                                {item.totalPrice.toFixed(2)}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => removeFromCart(index)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>

              {/* Sticky Cart Footer with Scrollable Settings */}
              <div className="border-t bg-card mt-auto flex flex-col shadow-[0_-4px_10px_rgba(0,0,0,0.05)] max-h-[60%]">
                <ScrollArea className="flex-1">
                  <div className="p-4 pt-4 space-y-4">
                    {/* Customer & Sale Type Moved HERE */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground block">Customer</Label>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-4 w-4 text-primary hover:text-primary/80"
                            onClick={() => setIsContactDialogOpen(true)}
                          >
                            <UserPlus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                          <SelectTrigger className="h-8 text-[10px] px-2">
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {contacts.map((contact) => (
                              <SelectItem key={contact.id} value={contact.id} className="text-xs">
                                {contact.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Sale Type</Label>
                        <Select value={saleType} onValueChange={(v: SaleType) => setSaleType(v)}>
                          <SelectTrigger className="h-8 text-[10px] px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CARD" className="text-xs">Sale</SelectItem>
                            <SelectItem value="DRAFT" className="text-xs">Draft</SelectItem>
                            <SelectItem value="QUOTATION" className="text-xs">Quote</SelectItem>
                            <SelectItem value="SUSPEND" className="text-xs">Hold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Discount, Tax, and Payment Method */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Discount</Label>
                        <div className="flex gap-1">
                          <Select
                            value={discountType}
                            onValueChange={(v: "NONE" | "PERCENTAGE" | "FIXED") => {
                              setDiscountType(v)
                              if (v === "NONE") setDiscountAmount(0)
                            }}
                          >
                            <SelectTrigger className="h-8 text-[10px] px-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="text-xs">
                              <SelectItem value="NONE" className="text-xs">None</SelectItem>
                              <SelectItem value="PERCENTAGE" className="text-xs">%</SelectItem>
                              <SelectItem value="FIXED" className="text-xs">Flat</SelectItem>
                            </SelectContent>
                          </Select>
                          {discountType !== "NONE" && (
                            <NumericInput
                              value={discountAmount}
                              onValueChange={setDiscountAmount}
                              className="h-8 flex-1 text-xs px-2"
                            />
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Tax (%)</Label>
                        <NumericInput
                          value={taxRate}
                          onValueChange={setTaxRate}
                          className="h-8 w-full text-xs px-2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Payment Method</Label>
                        <Select value={paymentMethod} onValueChange={(v: PaymentMethod) => {
                          setPaymentMethod(v)
                          if (v === "MIXED" && paymentSplits.length === 0) {
                            setPaymentSplits([{ id: "1", accountId: "", amount: cartTotals.total }])
                          }
                        }}>
                          <SelectTrigger className="h-8 text-[10px] px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CASH" className="text-xs">Cash</SelectItem>
                            <SelectItem value="CARD" className="text-xs">Card</SelectItem>
                            <SelectItem value="CREDIT" className="text-xs">Credit</SelectItem>
                            <SelectItem value="MIXED" className="text-xs">Mixed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {(paymentMethod === "CASH" || paymentMethod === "CARD") && accounts.length > 0 && (
                        <div>
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Account</Label>
                          <Select 
                            value={paymentMethod === "CASH" ? cashAccountId : bankAccountId} 
                            onValueChange={paymentMethod === "CASH" ? setCashAccountId : setBankAccountId}
                          >
                            <SelectTrigger className="h-8 text-[10px] px-2 font-medium">
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {(paymentMethod === "CASH" ? cashAccounts : bankAccounts).map(acc => (
                                <SelectItem key={acc.id} value={acc.id} className="text-xs">
                                  {acc.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Mixed Payment Splits */}
                    {paymentMethod === "MIXED" && (
                      <div className="pt-2 border-t border-dashed space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Splits</Label>
                          <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={addPaymentSplit}>
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                        <div className="space-y-2 py-1">
                          {paymentSplits.map((split) => (
                            <div key={split.id} className="flex gap-1 items-end">
                              <div className="flex-1">
                                <Select 
                                  value={split.accountId} 
                                  onValueChange={(v) => updatePaymentSplit(split.id, { accountId: v })}
                                >
                                  <SelectTrigger className="h-8 text-[10px] px-2">
                                    <SelectValue placeholder="Acc" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-[200px]">
                                    {accounts.map(acc => (
                                      <SelectItem key={acc.id} value={acc.id} className="text-xs">
                                        {acc.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="w-20">
                                <NumericInput 
                                  className="h-8 text-[10px] px-2" 
                                  value={split.amount}
                                  onValueChange={(val) => updatePaymentSplit(split.id, { amount: val })}
                                  placeholder="Amt"
                                />
                              </div>
                              {paymentSplits.length > 1 && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => removePaymentSplit(split.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                        {/* Remaining Amount Indicator */}
                        {Math.abs(cartTotals.total - paymentSplits.reduce((acc, s) => acc + s.amount, 0)) > 0.01 && (
                          <div className="text-[10px] text-right font-medium text-destructive">
                            Remaining: {(cartTotals.total - paymentSplits.reduce((acc, s) => acc + s.amount, 0)).toFixed(2)}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </ScrollArea>

                {/* Cart Summary - Pinned above checkout button */}
                {cart.length > 0 && (
                  <div className="px-4 py-3 border-t bg-card space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{cartTotals.itemsSubtotal.toFixed(2)}</span>
                    </div>
                    {cartTotals.saleDiscount > 0 && (
                      <div className="flex justify-between text-xs text-destructive">
                        <span>Discount</span>
                        <span>-{cartTotals.saleDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {cartTotals.tax > 0 && (
                      <div className="flex justify-between text-xs">
                        <span>Tax ({taxRate}%)</span>
                        <span>{cartTotals.tax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-sm border-t pt-1 mt-1 text-primary">
                      <span>Total</span>
                      <span>{cartTotals.total.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Permanent Action Buttons */}
                <div className="p-4 border-t bg-card">
                  <div className="flex flex-col gap-2">
                    <Button
                      size="lg"
                      className="w-full text-base font-black h-12 shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]"
                      disabled={cart.length === 0 || isProcessing || (paymentMethod === "MIXED" && Math.abs(cartTotals.total - paymentSplits.reduce((acc, s) => acc + s.amount, 0)) > 0.01)}
                      onClick={handleCheckout}
                    >
                      {isProcessing ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="flex items-center">
                            <Save className="h-5 w-5 mr-2" />
                            {saleType === "CARD" ? "COMPLETE SALE" : `SAVE AS ${saleType}`}
                          </span>
                          <span className="text-xl font-black">{cartTotals.total.toFixed(2)}</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>

      {/* Session Management */}
      <OpenSessionDialog 
        open={!activeSession && !isLoadingSession && !!selectedBranchId} 
        branchId={selectedBranchId || ""} 
        onOpenSuccess={() => refetchSession()} 
      />
      
      {activeSession && (
        <CloseSessionDialog
          open={showCloseSession}
          onOpenChange={setShowCloseSession}
          branchId={selectedBranchId || ""}
          expectedBalance={activeSession.openingBalance} // Simplification: in reality should includes sales
          onCloseSuccess={() => refetchSession()}
        />
      )}

      {/* Shortcuts Help Dialog */}
      <Dialog open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Quick actions for faster checkout
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {[
              { key: "F1", label: "Focus Search" },
              { key: "F2", label: "Checkout / Save" },
              { key: "F3", label: "Toggle View Mode" },
              { key: "F4", label: "Clear Cart" },
              { key: "/", label: "Focus Barcode" },
              { key: "?", label: "Show this help" },
              { key: "ESC", label: "Close Dialogs" },
            ].map((s) => (
              <div key={s.key} className="flex items-center justify-between p-2 border rounded-lg bg-muted/30">
                <span className="text-xs font-bold text-muted-foreground">{s.label}</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowShortcutsHelp(false)} className="w-full">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Product Filters</DialogTitle>
            <DialogDescription>Apply filters to find products</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Branch Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Branch</Label>
              <Select value={selectedBranchId || ""} onValueChange={switchBranch}>
                <SelectTrigger className="h-11">
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
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger className="h-11">
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

            {/* Brand Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Brand</Label>
              <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="All brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsFilterDialogOpen(false)} className="w-full">
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isSkuDialogOpen} onOpenChange={setIsSkuDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Select Variant</DialogTitle>
            <DialogDescription className="text-base">
              {selectedProductForSku && `Choose a variant for "${selectedProductForSku.name}"`}
            </DialogDescription>
          </DialogHeader>
          {selectedProductForSku && (
            <ScrollArea className="max-h-[500px] pr-4">
              <div className="space-y-3">
                {getProductVariants(selectedProductForSku).map((variantData, index) => {
                  const variant = variantData.variant
                  const stock = variantData.stock
                  const availableQty = stock?.quantity || 0
                  const managesStock = selectedProductForSku.manageStocks !== false
                  // Out of stock if: manages stock AND (stock doesn't exist OR quantity is 0)
                  const isOutOfStock = managesStock && (stock === undefined || stock.quantity === 0)

                  // Get variant image
                  const variantImage = variant?.thumbnailUrl || 
                    (variant?.images && variant.images[0]) ||
                    selectedProductForSku.thumbnailUrl ||
                    (selectedProductForSku.images && selectedProductForSku.images[0]) ||
                    null

                  // Get variant price: For variants, prioritize variant.price over stock.salePrice
                  // Priority: variant.price > stock.salePrice > product.price
                  // This ensures variant-specific pricing is used first
                  const variantPriceValue = variant?.price !== null && variant?.price !== undefined ? variant.price : null
                  const variantPrice = variantPriceValue ?? stock?.salePrice ?? selectedProductForSku.price ?? 0

                  // Format variant options for display
                  const optionsText = variant?.options 
                    ? Object.entries(variant.options)
                        .map(([key, value]) => {
                          // Remove 'attr-' prefix if present
                          const cleanKey = key.replace(/^attr-/, '')
                          return `${cleanKey}: ${value}`
                        })
                        .join(', ')
                    : ''

                  return (
                    <button
                      key={variantData.sku || index}
                    onClick={() => {
                      if (!isOutOfStock) {
                        addToCartWithSku(
                          selectedProductForSku,
                          variantData.sku,
                          variant,
                          stock
                        )
                        setIsSkuDialogOpen(false)
                        setSelectedProductForSku(null)
                      }
                    }}
                    disabled={isOutOfStock}
                      className={cn(
                        "group w-full p-4 border-2 rounded-xl text-left",
                        "transition-all duration-200",
                        "hover:border-primary/50 hover:shadow-md hover:shadow-primary/10",
                        "active:scale-[0.98]",
                        "flex items-center gap-4 bg-card",
                        isOutOfStock && managesStock && "opacity-50 cursor-not-allowed hover:shadow-none"
                      )}
                    >
                      {/* Variant Image */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-muted to-muted/50 flex-shrink-0 border">
                        {variantImage ? (
                          <img
                            src={variantImage}
                            alt={variant?.variantName || selectedProductForSku.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      
                      {/* Variant Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                          {variant?.variantName || selectedProductForSku.name}
                        </div>
                        {optionsText && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {optionsText.split(', ').map((option, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {option}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>SKU: {variantData.sku}</span>
                          {managesStock && (
                            <>
                              <span>•</span>
                              {isOutOfStock ? (
                                <Badge variant="destructive" className="text-xs px-2 py-0.5">
                                  Out of stock
                                </Badge>
                              ) : (
                                <Badge 
                                  variant={availableQty > 10 ? "default" : "secondary"} 
                                  className="text-xs px-2 py-0.5"
                                >
                                  {availableQty} available
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-xl font-bold text-primary">
                          {variantPrice.toFixed(2)}
                        </div>
                        {selectedProductForSku.unit?.suffix && (
                          <div className="text-xs text-muted-foreground">
                            / {selectedProductForSku.unit.suffix}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
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
        <DialogContent className="max-w-3xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
            <DialogTitle className="text-xl font-semibold">Recent Transactions</DialogTitle>
            <DialogDescription>View and manage your recent sales</DialogDescription>
          </DialogHeader>
          
          {/* Tabs */}
          <div className="flex items-center gap-2 border-b pb-2 px-6 flex-shrink-0">
            <Button
              variant={transactionFilter === "FINAL" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTransactionFilter("FINAL")}
              className="text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Final
            </Button>
            <Button
              variant={transactionFilter === "QUOTATION" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTransactionFilter("QUOTATION")}
              className="text-xs"
            >
              <FileText className="h-3 w-3 mr-1" />
              Quotation
            </Button>
            <Button
              variant={transactionFilter === "DRAFT" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTransactionFilter("DRAFT")}
              className="text-xs"
            >
              <FileText className="h-3 w-3 mr-1" />
              Draft
            </Button>
          </div>

          {/* Transactions List */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full px-6 pb-6">
            <div className="space-y-3 py-2">
              {recentSales.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No {transactionFilter.toLowerCase()} transactions found
                </div>
              ) : (
                recentSales.map((sale) => {
                  // Use invoiceNumber from API, fallback to invoiceSequence format
                  const invoiceNumber = sale.invoiceNumber || (sale.invoiceSequence ? `INV${String(sale.invoiceSequence).padStart(6, "0")}` : sale.id.slice(0, 8).toUpperCase())
                  const contactName = sale.contact?.name || "Walk-In Customer"
                  const itemsCount = (sale.items?.length || sale.saleItems?.length || 0)
                  const totalAmount = sale.totalPrice || sale.totalAmount || 0

                  return (
                    <Card key={sale.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-base">{invoiceNumber}</span>
                              <Badge
                                variant={
                                  sale.status === "SOLD"
                                    ? "default"
                                    : sale.status === "PENDING"
                                    ? "secondary"
                                    : "outline"
                                }
                                className="text-xs"
                              >
                                {sale.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              {contactName}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{itemsCount} items</span>
                              <span>•</span>
                              <span>{new Date(sale.createdAt || "").toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <div className="text-right">
                              <div className="font-bold text-lg">{totalAmount.toFixed(2)}</div>
                              <Badge
                                variant={
                                  sale.paymentStatus === "PAID"
                                    ? "default"
                                    : sale.paymentStatus === "DUE"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="text-xs mt-1"
                              >
                                {sale.paymentStatus}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSaleToEdit(sale)
                                  setIsSaleDialogOpen(true)
                                }}
                                className="h-8 px-2 text-xs"
                                title="Edit"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCompletedSale(sale)
                                  setShowInvoice(true)
                                  setShowRecentTransactions(false)
                                }}
                                className="h-8 px-2 text-xs bg-green-50 hover:bg-green-100 border-green-200"
                                title="Print"
                              >
                                <Printer className="h-3 w-3 text-green-600" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSaleToDelete(sale)
                                  setIsDeleteDialogOpen(true)
                                }}
                                className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                                title="Delete"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sale Edit Dialog */}
      <SaleDialog
        sale={saleToEdit}
        open={isSaleDialogOpen}
        onOpenChange={(open) => {
          setIsSaleDialogOpen(open)
          if (!open) {
            setSaleToEdit(null)
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => {
          if (saleToDelete) {
            deleteSaleMutation.mutate(saleToDelete.id, {
              onSuccess: () => {
                setIsDeleteDialogOpen(false)
                setSaleToDelete(null)
                toast.success("Transaction deleted successfully")
              },
            })
          }
        }}
        title="Delete Transaction"
        description={`Are you sure you want to delete transaction ${saleToDelete?.invoiceNumber || saleToDelete?.id}? This action cannot be undone.`}
      />

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
      {/* Contact Creation Dialog */}
      <ContactDialog 
        open={isContactDialogOpen}
        onOpenChange={setIsContactDialogOpen}
        contact={null}
        onSuccess={(newContact) => {
          setSelectedContactId(newContact.id)
        }}
      />

      {/* Session Management */}
      <OpenSessionDialog 
        open={!activeSession && !isLoadingSession && !!selectedBranchId} 
        branchId={selectedBranchId || ""} 
        onOpenSuccess={() => refetchSession()} 
      />
      
      {activeSession && (
        <CloseSessionDialog
          open={showCloseSession}
          onOpenChange={setShowCloseSession}
          branchId={selectedBranchId || ""}
          expectedBalance={activeSession.openingBalance}
          onCloseSuccess={() => refetchSession()}
        />
      )}
    </div>
  </div>
  )
}