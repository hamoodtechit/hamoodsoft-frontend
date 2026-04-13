"use client"

import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

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
import { useInfiniteDispensers } from "@/lib/hooks/use-dispensers"
import { useAppSettings } from "@/lib/providers/settings-provider"
import type { Product, ProductVariant, Sale, Stock, Dispenser, Account, Contact, Category, Branch } from "@/types"

// ── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId?: string
  sku?: string
  variantId?: string
  dispenserId?: string
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

export type SaleType = "DRAFT" | "QUOTATION" | "SUSPEND" | "CREDIT_SALES" | "CARD"
export type PaymentMethod = "CASH" | "CARD" | "CREDIT" | "MIXED"

export interface PaymentSplit {
  id: string
  accountId: string
  amount: number
}

// ── Context Interface ────────────────────────────────────────────────────────

interface POSContextValue {
  // Navigation
  locale: string
  router: ReturnType<typeof useRouter>
  currentBusiness: ReturnType<typeof useCurrentBusiness>
  selectedBranchId: string | null
  switchBranch: (id: string) => void

  // UI State
  searchQuery: string
  setSearchQuery: (v: string) => void
  selectedCategoryId: string
  setSelectedCategoryId: (v: string) => void
  selectedBrandId: string
  setSelectedBrandId: (v: string) => void
  barcodeInput: string
  setBarcodeInput: (v: string) => void
  posMode: "standard" | "petrol"
  setPosMode: (v: "standard" | "petrol") => void
  selectedContactId: string
  setSelectedContactId: (v: string) => void
  isContactDialogOpen: boolean
  setIsContactDialogOpen: (v: boolean) => void
  isProcessing: boolean
  selectedProductForSku: Product | null
  setSelectedProductForSku: (v: Product | null) => void
  isSkuDialogOpen: boolean
  setIsSkuDialogOpen: (v: boolean) => void
  saleType: SaleType
  setSaleType: (v: SaleType) => void
  paymentMethod: PaymentMethod
  setPaymentMethod: (v: PaymentMethod) => void
  showCalculator: boolean
  setShowCalculator: (v: boolean) => void
  showProductDialog: boolean
  setShowProductDialog: (v: boolean) => void
  showRecentTransactions: boolean
  setShowRecentTransactions: (v: boolean) => void
  showInvoice: boolean
  setShowInvoice: (v: boolean) => void
  showCloseSession: boolean
  setShowCloseSession: (v: boolean) => void
  completedSale: Sale | null
  setCompletedSale: (v: Sale | null) => void
  transactionFilter: "FINAL" | "QUOTATION" | "DRAFT"
  setTransactionFilter: (v: "FINAL" | "QUOTATION" | "DRAFT") => void
  saleToEdit: Sale | null
  setSaleToEdit: (v: Sale | null) => void
  saleToDelete: Sale | null
  setSaleToDelete: (v: Sale | null) => void
  isSaleDialogOpen: boolean
  setIsSaleDialogOpen: (v: boolean) => void
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: (v: boolean) => void
  isFilterDialogOpen: boolean
  setIsFilterDialogOpen: (v: boolean) => void
  productViewMode: "grid" | "list"
  setProductViewMode: React.Dispatch<React.SetStateAction<"grid" | "list">>
  showShortcutsHelp: boolean
  setShowShortcutsHelp: (v: boolean) => void
  isCheckoutOpen: boolean
  setIsCheckoutOpen: (v: boolean) => void
  lastSelectedProductId: string | null
  setLastSelectedProductId: (v: string | null) => void
  soundEnabled: boolean
  setSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>

  // Refs
  searchInputRef: React.RefObject<HTMLInputElement>
  barcodeInputRef: React.RefObject<HTMLInputElement>

  // Discount / Tax
  discountType: "NONE" | "PERCENTAGE" | "FIXED"
  setDiscountType: (v: "NONE" | "PERCENTAGE" | "FIXED") => void
  discountAmount: number
  setDiscountAmount: (v: number) => void
  taxRate: number
  setTaxRate: (v: number) => void

  // Payment
  paidAmountInput: number
  setPaidAmountInput: React.Dispatch<React.SetStateAction<number>>
  paymentSplits: PaymentSplit[]
  setPaymentSplits: React.Dispatch<React.SetStateAction<PaymentSplit[]>>
  cashAccountId: string
  setCashAccountId: (v: string) => void
  bankAccountId: string
  setBankAccountId: (v: string) => void

  // Calculator
  calculatorValue: string
  setCalculatorValue: (v: string) => void
  calculatorDisplay: string
  setCalculatorDisplay: (v: string) => void

  // Data
  products: Product[]
  stocks: Stock[]
  dispensers: Dispenser[]
  contacts: Contact[]
  categories: Category[]
  brands: { id: string; name: string }[]
  branches: Branch[]
  accounts: Account[]
  cashAccounts: Account[]
  bankAccounts: Account[]
  filteredProducts: Product[]
  cartProductIdSet: Set<string>
  recentSales: Sale[]
  deleteSaleMutation: ReturnType<typeof useDeleteSale>

  // Loading / Pagination
  isLoadingProducts: boolean
  isLoadingDispensers: boolean
  fetchNextProducts: () => void
  hasMoreProducts: boolean | undefined
  isFetchingMoreProducts: boolean
  fetchNextDispensers: () => void
  hasMoreDispensers: boolean | undefined
  isFetchingMoreDispensers: boolean

  // Session
  activeSession: ReturnType<typeof usePOSSession>["data"]
  isLoadingSession: boolean
  refetchSession: () => void

  // Cart
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  cartTotals: {
    itemsSubtotal: number
    saleDiscount: number
    afterDiscount: number
    tax: number
    total: number
    itemCount: number
  }

  // Functions
  playSound: (kind: "add" | "remove" | "success" | "error") => void
  getProductVariants: (product: Product) => Array<{ sku: string; variant: ProductVariant | null; stock?: Stock }>
  calculateItemTotal: (item: CartItem) => number
  updateQuantity: (index: number, delta: number) => void
  setQuantity: (index: number, quantity: number) => void
  addToCartWithSku: (product: Product, sku: string, variant: ProductVariant | null, stock: Stock | undefined) => void
  handleProductClick: (product: Product) => void
  handleDispenserClick: (dispenser: Dispenser) => void
  handleBarcodeScan: (barcode: string) => void
  addPaymentSplit: () => void
  removePaymentSplit: (id: string) => void
  updatePaymentSplit: (id: string, updates: Partial<PaymentSplit>) => void
  removeFromCart: (index: number) => void
  clearCart: () => void
  handleCalculatorInput: (value: string) => void
  handleCheckout: () => Promise<void>
  handleSaveDraft: () => Promise<void>
}

const POSContext = createContext<POSContextValue | null>(null)

export function usePOS() {
  const ctx = useContext(POSContext)
  if (!ctx) throw new Error("usePOS must be used inside <POSProvider>")
  return ctx
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function POSProvider({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const currentBusiness = useCurrentBusiness()
  const { selectedBranchId, switchBranch } = useBranchSelection()

  // ── State management ───────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all")
  const [selectedBrandId, setSelectedBrandId] = useState<string>("all")
  const [barcodeInput, setBarcodeInput] = useState("")
  const [posMode, setPosMode] = useState<"standard" | "petrol">("standard")
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
  const [productViewMode, setProductViewMode] = useState<"grid" | "list">("list")
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null!)
  const barcodeInputRef = useRef<HTMLInputElement>(null!)

  // UX
  const [lastSelectedProductId, setLastSelectedProductId] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true
    return localStorage.getItem("pos-sound-enabled") !== "0"
  })
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Discount and Tax
  const { taxSettings } = useAppSettings()
  const defaultTaxRate = taxSettings?.rate ?? 0
  const [discountType, setDiscountType] = useState<"NONE" | "PERCENTAGE" | "FIXED">("NONE")
  const [discountAmount, setDiscountAmount] = useState(0)
  const [taxRate, setTaxRate] = useState(defaultTaxRate)

  useEffect(() => {
    if (taxSettings?.rate !== undefined) {
      setTaxRate(taxSettings.rate)
    }
  }, [taxSettings?.rate])

  // Payment
  const [paidAmountInput, setPaidAmountInput] = useState<number>(0)
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([])
  const [cashAccountId, setCashAccountId] = useState<string>("")
  const [bankAccountId, setBankAccountId] = useState<string>("")

  // Calculator
  const [calculatorValue, setCalculatorValue] = useState("0")
  const [calculatorDisplay, setCalculatorDisplay] = useState("")

  // ── Data hooks ─────────────────────────────────────────────────────────
  const {
    data: infiniteProductsData,
    isLoading: isLoadingProducts,
    fetchNextPage: fetchNextProducts,
    hasNextPage: hasMoreProducts,
    isFetchingNextPage: isFetchingMoreProducts,
  } = useInfiniteProducts({
    branchId: selectedBranchId || undefined,
    categoryId: selectedCategoryId !== "all" ? selectedCategoryId : undefined,
    search: searchQuery.trim() || undefined,
    limit: 50,
  })

  const products = useMemo(() => {
    return infiniteProductsData?.pages.flatMap(page => page.items) || []
  }, [infiniteProductsData])

  const { data: stocksData } = useStocks({
    branchId: selectedBranchId || undefined,
    limit: 10000,
  })
  const stocks = useMemo(() => {
    return stocksData?.items || []
  }, [stocksData])

  const { data: contactsData } = useContacts({ type: "CUSTOMER" })
  const contacts = contactsData?.items || []

  const { data: categories = [] } = useCategories(selectedBranchId || undefined)
  const { data: brandsData } = useBrands()
  const brands = brandsData?.items || []
  const { data: branches = [] } = useBranches()

  useFuelTypes({ limit: 1000 })
  const {
    data: infiniteDispensersData,
    isLoading: isLoadingDispensers,
    fetchNextPage: fetchNextDispensers,
    hasNextPage: hasMoreDispensers,
    isFetchingNextPage: isFetchingMoreDispensers,
  } = useInfiniteDispensers({
    limit: 50,
    search: searchQuery.trim() || undefined,
    branchId: selectedBranchId || undefined,
    status: "ACTIVE",
  })

  const dispensers = useMemo(() => {
    const result = infiniteDispensersData?.pages.flatMap(page => page.items) || []
    console.log("[POS DEBUG] infiniteDispensersData:", JSON.stringify(infiniteDispensersData, null, 2)?.substring(0, 500))
    console.log("[POS DEBUG] dispensers count:", result.length, "branchId:", selectedBranchId)
    return result
  }, [infiniteDispensersData, selectedBranchId])

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

  // Recent transactions
  const { data: recentSalesData } = useSales({
    branchId: selectedBranchId || undefined,
    limit: 50,
    page: 1,
    status: transactionFilter === "FINAL" ? "SOLD" : transactionFilter === "QUOTATION" ? "PENDING" : "DRAFT",
  })
  const recentSales = recentSalesData?.items || []

  const createSaleMutation = useCreateSale()
  const deleteSaleMutation = useDeleteSale()

  // Accounts
  const { data: accountsData } = useAccounts({ limit: 100 })
  const accounts = useMemo(() => (accountsData?.items ?? []).filter((acc) => acc.isActive), [accountsData?.items])

  // POS Session
  const { data: activeSession, isLoading: isLoadingSession, refetch: refetchSession } = usePOSSession(selectedBranchId || undefined)

  // ── Derived data ───────────────────────────────────────────────────────

  const cashAccounts = useMemo(() => accounts.filter((acc) => acc.type === "CASH"), [accounts])
  const bankAccounts = useMemo(() => accounts.filter((acc) => acc.type === "BANK"), [accounts])

  const filteredProducts = useMemo(() => {
    let filtered = products
    if (selectedBrandId !== "all") {
      filtered = filtered.filter((p) => p.brandId === selectedBrandId)
    }
    return filtered
  }, [products, selectedBrandId])

  const cartProductIdSet = useMemo(() => {
    return new Set(cart.map((c) => c.productId).filter(Boolean) as string[])
  }, [cart])

  // ── Effects ────────────────────────────────────────────────────────────

  // Set default accounts when available
  useEffect(() => {
    if (accounts.length > 0) {
      if (paymentMethod === "CASH" && !cashAccountId) {
        const cashAccount = cashAccounts.length > 0 ? cashAccounts[0] : accounts[0]
        setCashAccountId(cashAccount.id)
      }
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

  // Clear selected product highlight after a short moment
  useEffect(() => {
    if (!lastSelectedProductId) return
    const t = window.setTimeout(() => setLastSelectedProductId(null), 700)
    return () => window.clearTimeout(t)
  }, [lastSelectedProductId])

  // Keep paidAmountInput sane when totals/payment method change
  const cartTotals = useMemo(() => {
    const itemsSubtotal = cart.reduce((sum, item) => sum + calculateItemTotalFn(item), 0)

    let saleDiscount = 0
    if (discountType === "PERCENTAGE") {
      saleDiscount = (itemsSubtotal * discountAmount) / 100
    } else if (discountType === "FIXED") {
      saleDiscount = discountAmount
    }

    const afterDiscount = Math.max(0, itemsSubtotal - saleDiscount)
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
  }, [cart, discountType, discountAmount, taxRate])

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
    if (paymentMethod === "CASH" || paymentMethod === "CARD") {
      setPaidAmountInput(cartTotals.total)
      setPaymentSplits([])
      return
    }
    if (paymentMethod === "MIXED") {
      setPaidAmountInput((v) => Math.min(Math.max(0, v || 0), cartTotals.total))
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

  // Barcode input debounce
  useEffect(() => {
    if (barcodeInput.length >= 3) {
      const timer = setTimeout(() => {
        handleBarcodeScanFn(barcodeInput)
      }, 300)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barcodeInput])

  // ── Functions ──────────────────────────────────────────────────────────

  const getProductVariants = useCallback((product: Product): Array<{ sku: string; variant: ProductVariant | null; stock?: Stock }> => {
    // 1. Gather all unique stock records for this branch
    const seenStockIds = new Set<string>()
    const branchStocks: Stock[] = []

    ;(product.stocks || []).forEach(s => {
      if (s.branchId === selectedBranchId && s.id) {
        seenStockIds.add(s.id)
        branchStocks.push(s)
      }
    })

    stocks.forEach(s => {
      if (s.productId === product.id && s.branchId === selectedBranchId && s.id) {
        if (!seenStockIds.has(s.id)) {
          seenStockIds.add(s.id)
          branchStocks.push(s)
        }
      }
    })

    // 2. Handle Non-Variable Products
    if (product.isVariable === false) {
      if (branchStocks.length === 0) {
        return [{ sku: product.id, variant: null, stock: undefined }]
      }
      const totalQty = branchStocks.reduce((sum, s) => sum + (s.quantity || 0), 0)
      const baseStock = { ...branchStocks[0], quantity: totalQty }
      return [{
        sku: product.id,
        variant: null,
        stock: baseStock,
      }]
    }

    const productVariants = product.productVariants || product.variants || []
    const variantStockMap = new Map<string, { sku: string; variant: ProductVariant | null; stock: Stock }>()

    // 3. VARIABLE PRODUCTS
    branchStocks.forEach(stock => {
      const variant = productVariants.find(v =>
        (stock.variantId && v.id === stock.variantId) ||
        (stock.sku && v.sku === stock.sku)
      )

      const variantId = variant?.id || 'base'
      const skuId = stock.sku || variant?.sku || variant?.id || product.id
      const key = `${variantId}-${skuId}`

      if (variantStockMap.has(key)) {
        const entry = variantStockMap.get(key)!
        entry.stock = {
          ...entry.stock,
          quantity: entry.stock.quantity + stock.quantity,
        }
      } else {
        variantStockMap.set(key, {
          sku: skuId,
          variant: variant ? {
            ...variant,
            id: variant.id || '',
            productId: product.id,
            sku: skuId,
            price: variant.price ?? stock.salePrice ?? product.price ?? 0,
            unitId: variant.unitId || product.unitId,
            variantName: variant.variantName || '',
            options: variant.options || {},
            thumbnailUrl: variant.thumbnailUrl || null,
            images: variant.images || [],
          } as ProductVariant : null,
          stock: { ...stock },
        })
      }
    })

    const result: Array<{ sku: string; variant: ProductVariant | null; stock?: Stock }> = Array.from(variantStockMap.values())

    // 4. Add defined variants that have NO stock records
    productVariants.forEach(variant => {
      const isAlreadyHandled = result.some(r => r.variant?.id === variant.id)
      if (!isAlreadyHandled) {
        result.push({
          sku: variant.sku || variant.id || product.id,
          variant: {
            ...variant,
            id: variant.id || variant.sku || product.id,
            productId: product.id,
            sku: variant.sku || variant.id || product.id,
            price: variant.price ?? product.price ?? 0,
            unitId: variant.unitId || product.unitId,
            variantName: variant.variantName || product.name,
          } as ProductVariant,
          stock: undefined,
        })
      }
    })

    // 5. Sort by quantity
    return result.sort((a, b) => (b.stock?.quantity || 0) - (a.stock?.quantity || 0))
  }, [stocks, selectedBranchId])

  const calculateItemTotal = useCallback((item: CartItem) => {
    return calculateItemTotalFn(item)
  }, [])

  const updateQuantity = useCallback((index: number, delta: number) => {
    const updatedCart = [...cart]
    const item = updatedCart[index]
    const newQuantity = Math.max(0.001, item.quantity + delta)

    if (newQuantity < 0.001) return

    if (item.productId?.startsWith("fuel-") && item.dispenserId) {
      const dispenser = dispensers.find((d: Dispenser) => d.id === item.dispenserId)
      const tanker = dispenser?.tanker
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
      const product = products.find((p) => p.id === item.productId)
      const managesStock = product?.manageStocks !== false

      if (managesStock && item.availableQuantity !== undefined && item.availableQuantity > 0) {
        const pv = product ? getProductVariants(product) : []
        const variantEntry = pv.find(v => v.sku === item.sku)
        const availableQty = variantEntry?.stock?.quantity ?? item.availableQuantity ?? 0

        if (newQuantity > availableQty) {
          playSound("error")
          toast.error(`Only ${availableQty} available in stock`)
          updatedCart[index].quantity = availableQty
        } else {
          updatedCart[index].quantity = Math.floor(newQuantity)
          playSound(delta > 0 ? "add" : "remove")
        }
        updatedCart[index].availableQuantity = availableQty
      } else {
        updatedCart[index].quantity = Math.floor(newQuantity)
        playSound(delta > 0 ? "add" : "remove")
      }
    }

    updatedCart[index].totalPrice = calculateItemTotalFn(updatedCart[index])
    setCart(updatedCart)
  }, [cart, products, getProductVariants, playSound, dispensers])

  const setQuantityFn = useCallback((index: number, quantity: number) => {
    const updatedCart = [...cart]
    const item = updatedCart[index]
    const newQuantity = Math.max(0.001, quantity)

    if (item.productId?.startsWith("fuel-") && item.dispenserId) {
      const dispenser = dispensers.find((d: Dispenser) => d.id === item.dispenserId)
      const tanker = dispenser?.tanker
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
      const product = products.find((p) => p.id === item.productId)
      const managesStock = product?.manageStocks !== false

      if (managesStock && item.availableQuantity !== undefined && item.availableQuantity > 0) {
        const pv = product ? getProductVariants(product) : []
        const variantEntry = pv.find(v => v.sku === item.sku)
        const availableQty = variantEntry?.stock?.quantity ?? item.availableQuantity ?? 0

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

    updatedCart[index].totalPrice = calculateItemTotalFn(updatedCart[index])
    setCart(updatedCart)
  }, [cart, products, getProductVariants, playSound, dispensers])

  const addToCartWithSku = useCallback((
    product: Product,
    sku: string,
    variant: ProductVariant | null,
    stock: Stock | undefined
  ) => {
    const unit = product.unit?.suffix || "pcs"
    const managesStock = product.manageStocks !== false
    const finalSku = sku || variant?.sku || stock?.sku || product.id

    const itemName = variant?.variantName
      ? `${product.name} - ${variant.variantName}`
      : product.name

    const existingItemIndex = cart.findIndex(
      (item) => item.productId === product.id && item.sku === finalSku
    )

    const variants = getProductVariants(product)
    const variantEntry = variants.find(v => v.sku === finalSku)
    const finalStock = variantEntry?.stock

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
      updatedCart[existingItemIndex].totalPrice = calculateItemTotalFn(updatedCart[existingItemIndex])
      setCart(updatedCart)
    } else {
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
  }, [cart, getProductVariants, playSound])

  const handleProductClick = useCallback((product: Product) => {
    setLastSelectedProductId(product.id)
    const variants = getProductVariants(product)

    if (variants.length > 1) {
      setSelectedProductForSku(product)
      setIsSkuDialogOpen(true)
    } else if (variants.length === 1) {
      addToCartWithSku(product, variants[0].sku, variants[0].variant, variants[0].stock)
    } else {
      addToCartWithSku(product, product.id, null, undefined)
    }
  }, [getProductVariants, addToCartWithSku])

  const handleDispenserClick = useCallback((dispenser: Dispenser) => {
    if (!dispenser.tanker?.fuelType) return

    const fuelType = dispenser.tanker.fuelType
    const tanker = dispenser.tanker
    const productId = `fuel-${fuelType.id}`
    const dispenserSku = dispenser.id

    const existingIndex = cart.findIndex(
      (item) => item.productId === productId && item.sku === dispenserSku
    )

    if (existingIndex !== -1) {
      updateQuantity(existingIndex, 1)
    } else {
      const newItem: CartItem = {
        productId: productId,
        sku: dispenserSku,
        variantId: tanker.id,
        dispenserId: dispenser.id,
        itemName: `${fuelType.name} (${dispenser.name})`,
        itemDescription: `Fuel from ${dispenser.name}`,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBarcodeScanFn = useCallback((barcode: string) => {
    if (!barcode.trim()) return

    let foundProduct: Product | null = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let foundVariant: any = null
    let foundStock: Stock | undefined = undefined

    for (const product of products) {
      if (product.barcode === barcode) {
        foundProduct = product
        if (product.stocks && Array.isArray(product.stocks)) {
          foundStock = product.stocks.find((s) => s.productId === product.id && s.branchId === selectedBranchId)
        }
        if (!foundStock) {
          foundStock = stocks.find((s) => s.productId === product.id && s.branchId === selectedBranchId)
        }
        break
      }

      const allPossibleVariants = getProductVariants(product)
      const matchingVariant = allPossibleVariants.find(v => v.sku === barcode)

      if (matchingVariant) {
        foundProduct = product
        foundVariant = matchingVariant.variant
        foundStock = matchingVariant.stock
        break
      }
      if (foundProduct) break
    }

    if (foundProduct) {
      const managesStock = foundProduct.manageStocks !== false

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

      if (foundVariant) {
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
        handleProductClick(foundProduct)
      }
      setBarcodeInput("")
    } else {
      playSound("error")
      toast.error("Product not found")
      setBarcodeInput("")
    }
  }, [products, stocks, selectedBranchId, getProductVariants, addToCartWithSku, handleProductClick, playSound])

  const addPaymentSplit = useCallback(() => {
    setPaymentSplits([
      ...paymentSplits,
      { id: Math.random().toString(36).substr(2, 9), accountId: "", amount: 0 },
    ])
  }, [paymentSplits])

  const removePaymentSplit = useCallback((id: string) => {
    setPaymentSplits(paymentSplits.filter(s => s.id !== id))
  }, [paymentSplits])

  const updatePaymentSplitFn = useCallback((id: string, updates: Partial<PaymentSplit>) => {
    setPaymentSplits(paymentSplits.map(s => s.id === id ? { ...s, ...updates } : s))
  }, [paymentSplits])

  const removeFromCart = useCallback((index: number) => {
    playSound("remove")
    setCart(cart.filter((_, i) => i !== index))
  }, [cart, playSound])

  const clearCart = useCallback(() => {
    setCart([])
    setSelectedContactId("")
    setDiscountType("NONE")
    setDiscountAmount(0)
    setTaxRate(0)
  }, [])

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
        const dispenser = dispensers.find((d: Dispenser) => d.id === item.dispenserId)
        const tanker = dispenser?.tanker
        const availableFuel = tanker?.currentFuel || 0
        if (item.quantity > availableFuel) {
          stockErrors.push(`${item.itemName}: Only ${availableFuel}L available`)
        }
      } else {
        const product = products.find((p) => p.id === item.productId)
        const managesStock = product?.manageStocks !== false

        if (managesStock && item.availableQuantity !== undefined) {
          const pv = product ? getProductVariants(product) : []
          const variantEntry = pv.find(v => v.sku === item.sku)
          const availableQty = variantEntry?.stock?.quantity ?? item.availableQuantity ?? 0

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
      let status: "DRAFT" | "SOLD" | "PENDING" = "SOLD"
      if (saleType === "DRAFT") status = "DRAFT"
      if (saleType === "QUOTATION") status = "PENDING"
      if (saleType === "SUSPEND") status = "DRAFT"

      const paidAmountRaw =
        paymentMethod === "CREDIT" || saleType === "CREDIT_SALES"
          ? 0
          : paymentMethod === "MIXED"
            ? paidAmountInput
            : cartTotals.total
      const paidAmount = Math.min(Math.max(0, paidAmountRaw || 0), cartTotals.total)

      let paymentStatus: "PAID" | "DUE" | "PARTIAL" = "PAID"
      if (paidAmount <= 0) paymentStatus = "DUE"
      else if (paidAmount >= cartTotals.total) paymentStatus = "PAID"
      else paymentStatus = "PARTIAL"

      const items = cart.map((item) => {
        const sku = item.sku || item.productId || `temp-sku-${item.productId}-${Date.now()}`
        const isFuel = item.productId?.startsWith("fuel-")

        const itemData = {
          sku: sku,
          productId: isFuel ? undefined : item.productId,
          variantId: item.variantId,
          itemName: item.itemName,
          itemDescription: item.itemDescription || "",
          unit: item.unit,
          price: item.price,
          quantity: item.quantity,
          discountType: item.discountType,
          discountAmount: item.discountAmount,
          totalPrice: calculateItemTotalFn(item),
          itemType: isFuel ? "fuel" : "product",
          fuelTypeId: isFuel ? item.productId?.replace("fuel-", "") : undefined,
          tankerId: isFuel ? dispensers.find(d => d.id === item.dispenserId)?.tankerId : undefined,
          dispenserId: item.dispenserId,
        }
        return itemData
      })

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
        contactId: selectedContactId || "temp-contact",
        items,
        status,
        paymentStatus,
        paidAmount,
        totalPrice: cartTotals.total,
        discountType,
        discountAmount: cartTotals.saleDiscount,
        ...(payments.length > 0 && { payments }),
      }

      const response = await createSaleMutation.mutateAsync(saleData)

      // Store completed sale and show invoice
      let invoiceSale: Sale = response
      const responseItemsCount =
        (response.items?.length || 0) + (response.saleItems?.length || 0)
      if (!response.branch || !response.contact || responseItemsCount === 0) {
        try {
          invoiceSale = await salesApi.getSaleById(response.id)
        } catch {
          // fallback to response
        }
      }

      setCompletedSale(invoiceSale)
      setShowInvoice(true)
      setShowRecentTransactions(false)
      playSound("success")

      toast.success("Sale completed successfully!")
      clearCart()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Checkout error:", error)
      playSound("error")
      toast.error(error?.message || "Failed to process sale")
    } finally {
      setIsProcessing(false)
    }
  }, [
    cart, selectedBranchId, selectedContactId, saleType, paymentMethod,
    paidAmountInput, cartTotals, discountType, cashAccountId, bankAccountId,
    paymentSplits, accounts, products, getProductVariants,
    playSound, createSaleMutation, clearCart, dispensers,
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
          totalPrice: calculateItemTotalFn(item),
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
    cart, selectedBranchId, selectedContactId,
    cartTotals.total, cartTotals.saleDiscount,
    discountType, createSaleMutation,
  ])

  // ── Context value ──────────────────────────────────────────────────────

  const value: POSContextValue = {
    locale, router, currentBusiness, selectedBranchId, switchBranch,
    searchQuery, setSearchQuery, selectedCategoryId, setSelectedCategoryId,
    selectedBrandId, setSelectedBrandId, barcodeInput, setBarcodeInput,
    posMode, setPosMode, selectedContactId, setSelectedContactId,
    isContactDialogOpen, setIsContactDialogOpen, isProcessing,
    selectedProductForSku, setSelectedProductForSku, isSkuDialogOpen, setIsSkuDialogOpen,
    saleType, setSaleType, paymentMethod, setPaymentMethod,
    showCalculator, setShowCalculator, showProductDialog, setShowProductDialog,
    showRecentTransactions, setShowRecentTransactions, showInvoice, setShowInvoice,
    showCloseSession, setShowCloseSession, completedSale, setCompletedSale,
    transactionFilter, setTransactionFilter, saleToEdit, setSaleToEdit,
    saleToDelete, setSaleToDelete, isSaleDialogOpen, setIsSaleDialogOpen,
    isDeleteDialogOpen, setIsDeleteDialogOpen, isFilterDialogOpen, setIsFilterDialogOpen,
    productViewMode, setProductViewMode, showShortcutsHelp, setShowShortcutsHelp,
    isCheckoutOpen, setIsCheckoutOpen, lastSelectedProductId, setLastSelectedProductId,
    soundEnabled, setSoundEnabled,
    searchInputRef, barcodeInputRef,
    discountType, setDiscountType, discountAmount, setDiscountAmount, taxRate, setTaxRate,
    paidAmountInput, setPaidAmountInput, paymentSplits, setPaymentSplits,
    cashAccountId, setCashAccountId, bankAccountId, setBankAccountId,
    calculatorValue, setCalculatorValue, calculatorDisplay, setCalculatorDisplay,
    products, stocks, dispensers, contacts, categories, brands, branches,
    accounts, cashAccounts, bankAccounts, filteredProducts, cartProductIdSet,
    recentSales, deleteSaleMutation,
    isLoadingProducts, isLoadingDispensers,
    fetchNextProducts, hasMoreProducts, isFetchingMoreProducts,
    fetchNextDispensers, hasMoreDispensers, isFetchingMoreDispensers,
    activeSession, isLoadingSession, refetchSession,
    cart, setCart, cartTotals,
    playSound, getProductVariants, calculateItemTotal,
    updateQuantity, setQuantity: setQuantityFn, addToCartWithSku,
    handleProductClick, handleDispenserClick,
    handleBarcodeScan: handleBarcodeScanFn,
    addPaymentSplit, removePaymentSplit, updatePaymentSplit: updatePaymentSplitFn,
    removeFromCart, clearCart, handleCalculatorInput, handleCheckout, handleSaveDraft,
  }

  return <POSContext.Provider value={value}>{children}</POSContext.Provider>
}

// ── Pure utility (no deps) ───────────────────────────────────────────────────

function calculateItemTotalFn(item: CartItem) {
  const total = item.price * item.quantity
  if (item.discountType === "PERCENTAGE") {
    return total * (1 - item.discountAmount / 100)
  } else if (item.discountType === "FIXED") {
    return total - item.discountAmount
  }
  return total
}
