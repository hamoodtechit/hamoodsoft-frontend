"use client"

import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog"
import { InvoiceDialog } from "@/components/common/invoice-dialog"
import { PageLayout } from "@/components/common/page-layout"
import { ProductDialog } from "@/components/common/product-dialog"
import { SaleDialog } from "@/components/common/sale-dialog"
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
import { useAccounts } from "@/lib/hooks/use-accounts"
import { useAuth } from "@/lib/hooks/use-auth"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { useBranches } from "@/lib/hooks/use-branches"
import { useBrands } from "@/lib/hooks/use-brands"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { useCategories } from "@/lib/hooks/use-categories"
import { useContacts } from "@/lib/hooks/use-contacts"
import { useProducts } from "@/lib/hooks/use-products"
import { useCreateSale, useDeleteSale, useSales, useUpdateSale } from "@/lib/hooks/use-sales"
import { useStocks } from "@/lib/hooks/use-stocks"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { cn } from "@/lib/utils"
import { Product, ProductVariant, Sale, Stock } from "@/types"
import {
  Calculator,
  Check,
  CreditCard,
  DollarSign,
  Edit,
  FileText,
  History,
  Minus,
  Package,
  Pause,
  Plus,
  Printer,
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
  const tCommon = useTranslations("common")
  const tSales = useTranslations("sales")
  const { user } = useAuth()
  const currentBusiness = useCurrentBusiness()
  const { selectedBranchId, switchBranch } = useBranchSelection()

  // State management
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all")
  const [selectedBrandId, setSelectedBrandId] = useState<string>("all")
  const [barcodeInput, setBarcodeInput] = useState("")
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
  const [transactionFilter, setTransactionFilter] = useState<"FINAL" | "QUOTATION" | "DRAFT">("FINAL")
  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null)
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null)
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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
  const [taxAmount, setTaxAmount] = useState(0)
  
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

  // Fetch data with API-side filtering and searching
  const { data: productsData, isLoading: isLoadingProducts } = useProducts({
    branchId: selectedBranchId || undefined,
    categoryId: selectedCategoryId !== "all" ? selectedCategoryId : undefined,
    search: searchQuery.trim() || undefined,
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
  const { data: brandsData } = useBrands()
  const brands = brandsData?.items || []
  const { data: branches = [] } = useBranches()

  // Recent transactions - filter by status
  const { data: recentSalesData } = useSales({
    branchId: selectedBranchId || undefined,
    limit: 50,
    page: 1,
    status: transactionFilter === "FINAL" ? "SOLD" : transactionFilter === "QUOTATION" ? "PENDING" : "DRAFT",
  })
  const recentSales = recentSalesData?.items || []

  const createSaleMutation = useCreateSale()
  const updateSaleMutation = useUpdateSale()
  const deleteSaleMutation = useDeleteSale()
  
  // Get accounts for payment creation
  const { data: accountsData } = useAccounts({ limit: 100 })
  const accounts = (accountsData?.items ?? []).filter((acc) => acc.isActive)
  const cashAccounts = accounts.filter((acc) => acc.type === "CASH")
  const bankAccounts = accounts.filter((acc) => acc.type === "BANK")
  
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts.length, paymentMethod])

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
  const getProductVariants = (product: Product): Array<{ sku: string; variant: ProductVariant | null; stock?: Stock }> => {
    const variants: Array<{ sku: string; variant: ProductVariant | null; stock?: Stock }> = []
    
    // Use productVariants from API response, or fallback to variants (normalized)
    const productVariants = product.productVariants || product.variants || []

    if (productVariants.length > 0) {
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
      const productPrice = stock?.salePrice ?? product.price ?? 0
      
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartTotals.total, paymentMethod, saleType, accounts.length])

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
    const unit = product.unit?.suffix || "pcs"
    const managesStock = product.manageStocks !== false

    // If stock not found but product has stocks, try to find it
    let finalStock = stock
    if (!finalStock && product.stocks && Array.isArray(product.stocks)) {
      // Try to find stock by SKU first
      finalStock = product.stocks.find((s) => s.sku === sku && s.branchId === selectedBranchId)
      // If not found, try by productId (for variable products)
      if (!finalStock) {
        finalStock = product.stocks.find((s) => s.productId === product.id && s.branchId === selectedBranchId)
      }
    }
    
    // Also try from separate stocks query
    if (!finalStock) {
      finalStock = stocks.find((s) => (s.sku === sku || s.productId === product.id) && s.branchId === selectedBranchId)
    }
    
    // Get price: For variants, prioritize variant.price over stock.salePrice
    // Priority: variant.price > stock.salePrice > product.price
    // This ensures variant-specific pricing is used first
    const price = variant?.price ?? finalStock?.salePrice ?? product.price ?? 0
    
    const availableQty = finalStock?.quantity || 0

    // Build item name with variant name if available
    const itemName = variant?.variantName 
      ? `${product.name} - ${variant.variantName}`
      : product.name

    const existingItemIndex = cart.findIndex(
      (item) => item.productId === product.id && item.sku === sku
    )

    if (existingItemIndex >= 0) {
      const updatedCart = [...cart]
      const currentItem = updatedCart[existingItemIndex]
      const newQuantity = currentItem.quantity + 1

      if (managesStock && availableQty > 0) {
        const currentAvailableQty = finalStock?.quantity || 0
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

      updatedCart[existingItemIndex].availableQuantity = finalStock?.quantity || 0
      updatedCart[existingItemIndex].totalPrice = calculateItemTotal(updatedCart[existingItemIndex])
      setCart(updatedCart)
    } else {
      // Real-world scenario: Block if manages stock AND (stock exists with quantity 0 OR stock not found for variable products)
      // For variable products, if stock exists but quantity is 0, block it
      // For non-variable products, only block if stock exists and quantity is 0
      if (managesStock) {
        if (finalStock !== undefined && availableQty <= 0) {
          playSound("error")
          toast.error("This item is out of stock")
          return
        }
        // For variable products without stock, don't block (allow selection)
        // For non-variable products without stock, allow adding (stock not set)
      }

      const newItem: CartItem = {
        productId: product.id,
        sku: finalStock?.sku || sku || product.id, // Use stock SKU if available, otherwise variant/product SKU
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
  }

  // Handle barcode scanning (moved after addToCartWithSku and handleProductClick)
  const handleBarcodeScan = useCallback((barcode: string) => {
    if (!barcode.trim()) return

    // Find product by barcode
    let foundProduct: Product | null = null
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
  }, [products, stocks, selectedBranchId, addToCartWithSku, handleProductClick])

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

      // Prepare payments array if paidAmount > 0 and sale is SOLD
      const payments: any[] = []
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
              <div className="space-y-4">
                {/* First Row: Branch, Category, Brand */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                  {/* Brand Filter */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Brand</Label>
                    <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                      <SelectTrigger>
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

                {/* Second Row: Barcode Scanner & Search */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Barcode Scanner */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Barcode Scanner
                      <span className="ml-2 text-xs text-muted-foreground/70">(Scan or type)</span>
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Scan barcode or enter SKU..."
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyDown={(e) => {
                          // Enter key to trigger scan
                          if (e.key === "Enter" && barcodeInput.trim()) {
                            e.preventDefault()
                            handleBarcodeScan(barcodeInput)
                          }
                        }}
                        className="pl-9"
                        autoFocus={false}
                      />
                    </div>
                  </div>

                  {/* Search */}
                  <div>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredProducts.map((product) => {
                      const variants = getProductVariants(product)
                      const hasMultipleVariants = variants.length > 1
                      const firstVariant = variants[0]?.variant
                      const stock = variants[0]?.stock
                      const managesStock = product.manageStocks !== false
                      
                      // For variable products, check if any variant has stock
                      let availableQty = stock?.quantity || 0
                      if (hasMultipleVariants && !stock) {
                        // Check if any variant has stock
                        const variantWithStock = variants.find((v) => v.stock && v.stock.quantity > 0)
                        if (variantWithStock) {
                          availableQty = variantWithStock.stock?.quantity || 0
                        }
                      }
                      
                      // Real-world scenario: Mark as out of stock if manages stock
                      // 1. If stock doesn't exist → Out of stock (can't sell without stock)
                      // 2. If stock exists but quantity is 0 → Out of stock
                      // For variable products, check all variants - if all are out of stock or missing, mark as out of stock
                      let isOutOfStock = false
                      if (managesStock) {
                        if (hasMultipleVariants) {
                          // Check if all variants are out of stock or missing stock
                          const allOutOfStock = variants.every((v) => {
                            const vStock = v.stock
                            return vStock === undefined || vStock.quantity === 0
                          })
                          isOutOfStock = allOutOfStock
                        } else {
                          // For non-variable products: out of stock if stock doesn't exist OR quantity is 0
                          isOutOfStock = stock === undefined || stock.quantity === 0
                        }
                      }
                      const isSelected = lastSelectedProductId === product.id
                      const inCart = cartProductIdSet.has(product.id)

                      // Get product image: prefer variant image, then product image
                      // Get product image (prioritizes variant, then product)
                      const productImage = firstVariant?.thumbnailUrl || 
                        (firstVariant?.images && firstVariant.images[0]) ||
                        product.thumbnailUrl ||
                        (product.images && product.images[0]) ||
                        null
                      
                      // Count total images (product + variant images)
                      const totalImages = (() => {
                        let count = 0
                        if (product.thumbnailUrl) count++
                        if (product.images && Array.isArray(product.images)) count += product.images.length
                        const variants = product.productVariants || product.variants || []
                        variants.forEach((v: any) => {
                          if (v.thumbnailUrl) count++
                          if (v.images && Array.isArray(v.images)) count += v.images.length
                        })
                        return count
                      })()

                      // Get display price: Use stock.salePrice if available, otherwise variant/product price
                      const displayPrice = stock?.salePrice ?? firstVariant?.price ?? product.price ?? 0

                      return (
                        <button
                          key={product.id}
                          onClick={() => !isOutOfStock && handleProductClick(product)}
                          disabled={isOutOfStock}
                          className={cn(
                            "group relative bg-card border-2 rounded-xl overflow-hidden",
                            "transition-all duration-200 ease-in-out",
                            "hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50",
                            "active:scale-[0.98]",
                            "flex flex-col h-full",
                            isOutOfStock && "opacity-60 cursor-not-allowed hover:shadow-none",
                            inCart && "border-primary/40 bg-primary/5 shadow-md shadow-primary/5",
                            isSelected && "ring-2 ring-primary ring-offset-2 shadow-lg"
                          )}
                        >
                          {/* In Cart Indicator */}
                          {inCart && (
                            <div className="absolute right-2 top-2 z-10 rounded-full bg-primary text-primary-foreground p-1.5 shadow-md">
                              <Check className="h-3.5 w-3.5" />
                            </div>
                          )}
                          
                          {/* Variant Badge */}
                          {hasMultipleVariants && (
                            <Badge 
                              className="absolute left-2 top-2 z-10 text-xs font-semibold shadow-sm" 
                              variant="secondary"
                            >
                              {variants.length} variants
                            </Badge>
                          )}
                          
                          {/* Product Image */}
                          <div className="relative w-full aspect-square bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                            {productImage ? (
                              <img
                                src={productImage}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-12 w-12 text-muted-foreground/40" />
                              </div>
                            )}
                            {/* Multiple images indicator */}
                            {totalImages > 1 && (
                              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                                {totalImages} {totalImages === 1 ? "image" : "images"}
                              </div>
                            )}
                            {/* Overlay gradient for better text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          
                          {/* Product Info */}
                          <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                            <div>
                              <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1.5 group-hover:text-primary transition-colors">
                                {product.name}
                              </h3>
                              
                              {displayPrice > 0 && (
                                <div className="flex items-baseline gap-1">
                                  <span className="text-lg font-bold text-primary">
                                    {displayPrice.toFixed(2)}
                                  </span>
                                  {product.unit?.suffix && (
                                    <span className="text-xs text-muted-foreground">
                                      / {product.unit.suffix}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Stock Status */}
                            {managesStock && (
                              <div className="flex items-center gap-1.5">
                                {isOutOfStock ? (
                                  <Badge variant="destructive" className="text-xs px-2 py-0.5">
                                    Out of stock
                                  </Badge>
                                ) : stock !== undefined ? (
                                  <Badge 
                                    variant={availableQty > 10 ? "default" : "secondary"} 
                                    className="text-xs px-2 py-0.5"
                                  >
                                    {availableQty} available
                                  </Badge>
                                ) : hasMultipleVariants ? (
                                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                                    Select variant
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    Stock not set
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
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
                      <div className="space-y-3">
                        {cart.map((item, index) => {
                          // Get product to check if it has variants
                          const product = products.find((p) => p.id === item.productId)
                          const variant = product?.productVariants?.find((v) => v.id === item.variantId) ||
                                          product?.variants?.find((v) => v.id === item.variantId)
                          
                          // Get variant image
                          const variantImage = variant?.thumbnailUrl || 
                            (variant?.images && variant.images[0]) ||
                            product?.thumbnailUrl ||
                            (product?.images && product.images[0]) ||
                            null

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
                            <div key={index} className="p-4 border-2 rounded-xl bg-card hover:border-primary/30 transition-colors space-y-3 shadow-sm">
                              <div className="flex items-start gap-3">
                                {variantImage && (
                                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                                    <img
                                      src={variantImage}
                                      alt={item.itemName}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm mb-1">{item.itemName}</div>
                                  {optionsText && (
                                    <div className="flex flex-wrap gap-1 mb-1.5">
                                      {optionsText.split(', ').map((option, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs px-1.5 py-0">
                                          {option}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                  {item.sku && item.sku !== item.productId && (
                                    <div className="text-xs text-muted-foreground mb-1">
                                      SKU: {item.sku}
                                    </div>
                                  )}
                                  <div className="text-xs text-muted-foreground">
                                    {item.price.toFixed(2)} × {item.quantity} {item.unit}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                                  onClick={() => removeFromCart(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => updateQuantity(index, -1)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="text-sm font-semibold w-10 text-center">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => updateQuantity(index, 1)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="text-lg font-bold text-primary">
                                  {item.totalPrice.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          )
                        })}
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

                  {/* Account Selection */}
                  {paymentMethod === "CASH" && accounts.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <Label className="text-xs">Account</Label>
                      <Select value={cashAccountId} onValueChange={setCashAccountId}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name} ({account.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {paymentMethod === "CARD" && accounts.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <Label className="text-xs">Account</Label>
                      <Select value={bankAccountId} onValueChange={setBankAccountId}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name} ({account.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Partial payment input */}
                  {paymentMethod === "MIXED" && (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Paid Amount</span>
                        <span>
                          Due: {(Math.max(0, cartTotals.total - Math.min(Math.max(0, paidAmountInput || 0), cartTotals.total))).toFixed(2)}
                        </span>
                      </div>
                      <Input
                        type="number"
                        value={paidAmountInput}
                        onChange={(e) => {
                          const amount = Number(e.target.value)
                          setPaidAmountInput(amount)
                        }}
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
                      
                      {/* Flexible Payment Splitter */}
                      <div className="space-y-2 border-t pt-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Payment Split</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPaymentSplits([
                                ...paymentSplits,
                                {
                                  id: `split-${Date.now()}-${Math.random()}`,
                                  accountId: "",
                                  amount: 0,
                                },
                              ])
                            }}
                            className="h-7 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Account
                          </Button>
                        </div>
                        
                        {paymentSplits.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            No payment splits. Click "Add Account" to split payment.
                          </p>
                        )}
                        
                        {paymentSplits.map((split, index) => {
                          const totalAllocated = paymentSplits.reduce((sum, s) => sum + (s.amount || 0), 0)
                          const remaining = paidAmountInput - totalAllocated
                          const account = accounts.find((acc) => acc.id === split.accountId)
                          
                          return (
                            <div key={split.id} className="flex gap-2 items-start">
                              <div className="flex-1 space-y-1">
                                <Select
                                  value={split.accountId}
                                  onValueChange={(value) => {
                                    const updated = [...paymentSplits]
                                    updated[index].accountId = value
                                    setPaymentSplits(updated)
                                  }}
                                >
                                  <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Select account" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {accounts.map((account) => (
                                      <SelectItem key={account.id} value={account.id}>
                                        {account.name} ({account.type})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="number"
                                  value={split.amount || ""}
                                  onChange={(e) => {
                                    const updated = [...paymentSplits]
                                    const amount = Math.max(0, Math.min(Number(e.target.value), paidAmountInput))
                                    updated[index].amount = amount
                                    setPaymentSplits(updated)
                                  }}
                                  className="h-9 text-xs"
                                  placeholder="Amount"
                                  min={0}
                                  max={paidAmountInput}
                                  step="0.01"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setPaymentSplits(paymentSplits.filter((_, i) => i !== index))
                                }}
                                className="h-9 w-9 p-0"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )
                        })}
                        
                        {paymentSplits.length > 0 && (
                          <div className="pt-2 border-t space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Total Allocated:</span>
                              <span className="font-medium">
                                {paymentSplits.reduce((sum, s) => sum + (s.amount || 0), 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Remaining:</span>
                              <span
                                className={
                                  paidAmountInput - paymentSplits.reduce((sum, s) => sum + (s.amount || 0), 0) < 0
                                    ? "text-destructive font-medium"
                                    : "font-medium"
                                }
                              >
                                {(
                                  paidAmountInput - paymentSplits.reduce((sum, s) => sum + (s.amount || 0), 0)
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
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

      {/* Variant Selection Dialog */}
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
    </PageLayout>
  )
}