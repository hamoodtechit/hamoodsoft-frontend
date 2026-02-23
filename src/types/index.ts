export type Locale = "en" | "bn"

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  roleId?: string | null
  currentBusinessId?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Business {
  id: string
  name: string
  dbName?: string
  dbUrl?: string
  neonProjectId?: string
  ownerId?: string
  modules?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  message: string
  code?: string | number
  errors?: Record<string, string[]>
}

export interface Category {
  id: string
  name: string
  parentId?: string | null
  parent?: Category | null
  children?: Category[]
  createdAt?: string
  updatedAt?: string
}

export interface Branch {
  id: string
  name: string
  address: string
  phone: string
  createdAt?: string
  updatedAt?: string
}

export interface Unit {
  id: string
  name: string
  suffix: string
  createdAt?: string
  updatedAt?: string
}

export interface Permission {
  id: string
  key: string
  action: string
  module: string
  application: string
  createdAt?: string
  updatedAt?: string
}

export interface RolePermission {
  id: string
  roleId: string
  permissionId: string
  permission: Permission
  createdAt?: string
  updatedAt?: string
}

export interface Role {
  id: string
  businessId: string
  name: string
  description?: string | null
  allowedBranchIds?: string[]
  permissions?: string[] // Normalized from rolePermissions for frontend use
  rolePermissions?: RolePermission[] // Raw API response
  createdAt?: string
  updatedAt?: string
}

export interface ModulePermissionGroup {
  module: string
  permissions: string[]
}

export interface ProductVariantInput {
  id?: string
  variantName: string
  sku?: string
  price?: number
  unitId?: string
  options: Record<string, string>
  thumbnailUrl?: string | null
  images?: string[]
}

export interface Product {
  id: string
  businessId?: string
  branchIds?: string[]
  name: string
  description?: string | null
  price: number
  unitId: string
  categoryIds?: string[]
  brandId?: string | null
  variants?: ProductVariantInput[]
  productVariants?: ProductVariant[] // API response field
  unit?: Unit
  categories?: Category[]
  brand?: Brand
  isVariable?: boolean
  manageStocks?: boolean
  alertQuantity?: number | null
  barcode?: string | null
  barcodeType?: string | null
  weight?: number | null
  profitMarginAmount?: number
  profitMarginPercent?: number
  purchasePrice?: number
  salePrice?: number
  thumbnailUrl?: string | null
  images?: string[]
  stocks?: Stock[] // Stock data from API response
  createdAt?: string
  updatedAt?: string
}

export interface ProductVariant {
  id: string
  productId: string
  sku: string
  price: number
  unitId: string
  variantName: string
  options?: Record<string, string>
  thumbnailUrl?: string | null
  images?: string[]
  unit?: Unit
  createdAt?: string
  updatedAt?: string
}

export interface Attribute {
  id: string
  businessId?: string
  brandId?: string
  name: string
  values: string[]
  createdAt?: string
  updatedAt?: string
}

export interface Brand {
  id: string
  businessId?: string
  name: string
  description?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Stock {
  id: string
  businessId?: string
  branchId: string
  productId: string
  unitId: string
  quantity: number
  sku?: string // SKU field from stock
  purchasePrice?: number | null
  salePrice?: number | null
  profitMarginPercent?: number
  profitMarginAmount?: number
  product?: Product
  branch?: Branch
  unit?: Unit
  createdAt?: string
  updatedAt?: string
}

export interface StockHistory {
  id: string
  stockId: string
  branchId: string
  productId: string
  unitId: string
  transactionType: "IN" | "OUT"
  quantity: number
  quantityChange?: number
  reason?: string | null
  branch?: Branch
  product?: Product
  stock?: Stock
  createdAt?: string
}

export interface StockAdjustment {
  id: string
  businessId?: string
  branchId: string
  stockId: string
  productId: string
  stockHistoryId: string
  reason: string
  branch?: Branch
  product?: Product
  stock?: Stock
  stockHistory?: StockHistory
  createdAt?: string
  updatedAt?: string
}

export interface PurchaseItem {
  id?: string
  itemName: string
  itemDescription?: string
  unit: string
  price: number
  quantity: number
  sku?: string
  discountType?: "NONE" | "PERCENTAGE" | "FIXED"
  discountAmount?: number
  totalPrice?: number
}

export type PurchaseStatus = "PENDING" | "COMPLETED" | "CANCELLED"

export interface Purchase {
  id: string
  businessId?: string
  branchId: string
  contactId: string
  status: PurchaseStatus
  paidAmount: number
  dueAmount: number
  totalPrice: number // API returns totalPrice, not totalAmount
  totalAmount?: number // Keep for backward compatibility
  discountType?: "NONE" | "PERCENTAGE" | "FIXED"
  discountAmount?: number
  taxType?: "NONE" | "PERCENTAGE" | "FIXED"
  taxRate?: number
  taxAmount?: number
  items?: PurchaseItem[] // For backward compatibility
  purchaseItems?: PurchaseItem[] // API response use purchaseItems
  payments?: Payment[]
  paymentStatus?: "PAID" | "DUE" | "PARTIAL"
  branch?: Branch
  contact?: Contact
  poNumber?: string
  poSequence?: number
  createdAt?: string
  updatedAt?: string
}

export type SaleStatus = "DRAFT" | "SOLD" | "PENDING"
export type PaymentStatus = "PAID" | "DUE" | "PARTIAL"

export interface SaleItem {
  id?: string
  saleId?: string
  branchId?: string
  businessId?: string
  sku?: string
  itemName: string
  itemDescription?: string
  unit: string
  price: number
  quantity: number
  discountType?: "NONE" | "PERCENTAGE" | "FIXED"
  discountAmount?: number
  totalPrice?: number
  saleReturnId?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Sale {
  id: string
  businessId?: string
  branchId: string
  contactId: string
  status: SaleStatus
  paymentStatus: PaymentStatus
  paidAmount: number
  totalAmount?: number
  totalPrice?: number
  discountType?: "NONE" | "PERCENTAGE" | "FIXED"
  discountAmount?: number
  taxRate?: number
  taxAmount?: number
  items?: SaleItem[] // For backward compatibility
  saleItems?: SaleItem[] // API response uses saleItems
  payments?: Payment[] // Payments associated with this sale
  invoiceNumber?: string
  invoiceSequence?: number
  branch?: Branch
  contact?: Contact
  createdAt?: string
  updatedAt?: string
}

export type POSSessionStatus = "OPEN" | "CLOSED"

export interface POSSession {
  id: string
  businessId: string
  branchId: string
  userId: string
  status: POSSessionStatus
  openingBalance: number
  closingBalance: number | null
  actualBalance: number | null
  variance: number | null
  openingNote: string | null
  closingNote: string | null
  accountId: string | null
  openedAt: string
  closedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface OpenPOSSessionInput {
  openingBalance: number
  openingNote?: string
  branchId: string
}

export interface ClosePOSSessionInput {
  branchId: string
  actualBalance: number
  closingNote?: string
}

export type ContactType = "CUSTOMER" | "SUPPLIER"

export interface Contact {
  id: string
  businessId?: string
  type: ContactType
  name: string
  email?: string
  phone?: string
  address?: string
  isIndividual: boolean
  companyName?: string
  companyAddress?: string
  companyPhone?: string
  balance: number
  creditLimit: number
  createdAt?: string
  updatedAt?: string
}

export interface Media {
  id: string
  businessId: string
  name: string
  type: "image" | "document"
  resourceType: "image" | "raw"
  provider: string
  folder: string
  publicId: string
  url: string
  secureUrl: string
  format: string
  bytes: number | null
  width: number | null
  height: number | null
  originalFilename: string
  mimeType: string
  createdAt?: string
  updatedAt?: string
}

export interface Setting {
  id: string
  businessId?: string
  name: string
  configs: Record<string, any> // configs can have different structures based on setting type
  createdAt?: string
  updatedAt?: string
}

export type AccountType = "CASH" | "BANK" | "WALLET" | "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE"

export interface Account {
  id: string
  businessId?: string
  name: string
  type: AccountType
  description?: string | null
  openingBalance: number
  currentBalance?: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface AccountLedgerEntry {
  id: string
  accountId?: string
  transactionType?: "DEBIT" | "CREDIT"
  amount: number
  balance?: number
  balanceAfter?: number // API uses balanceAfter
  referenceType?: string | null
  referenceId?: string | null
  description?: string | null
  createdAt?: string
  date?: string // API uses date instead of createdAt
  type?: "IN" | "OUT" // API uses IN/OUT instead of DEBIT/CREDIT
  category?: string | null // API uses category instead of description
  debit?: number // API has separate debit field
  credit?: number // API has separate credit field
  branchId?: string | null
  contactId?: string | null
}

export interface AccountLedgerResponse {
  items: AccountLedgerEntry[]
  total: number
  openingBalance: number
  totals: {
    debit: number
    credit: number
  }
  closingBalance: number
}

export type PaymentType = "SALE_PAYMENT" | "PURCHASE_PAYMENT" | "DEPOSIT"

export interface Payment {
  id: string
  businessId?: string
  branchId?: string
  type: PaymentType
  accountId: string
  amount: number
  saleId?: string | null
  purchaseId?: string | null
  contactId?: string | null
  occurredAt: string
  notes?: string | null
  account?: Account
  sale?: Sale
  purchase?: Purchase
  contact?: Contact
  branch?: Branch
  createdAt?: string
  updatedAt?: string
}

export type TransactionType = "INCOME" | "EXPENSE"

export interface Transaction {
  id: string
  businessId?: string
  branchId: string
  accountId: string
  contactId?: string | null
  categoryId?: string | null
  incomeExpenseCategoryId?: string | null
  type: TransactionType
  amount: number
  paidAmount?: number // Only for expenses
  occurredAt: string
  note?: string | null
  referenceId?: string | null
  account?: Account
  contact?: Contact
  category?: IncomeExpenseCategory
  incomeExpenseCategory?: IncomeExpenseCategory // API returns this field
  branch?: Branch
  createdAt?: string
  updatedAt?: string
}

export interface IncomeExpenseCategory {
  id: string
  businessId?: string
  name: string
  description?: string | null
  type: "INCOME" | "EXPENSE"
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface PaginatedResult<T> {
  items: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages?: number
    [key: string]: any
  }
}

// Fuel & Petrol Pump Types
export interface FuelType {
  id: string
  businessId: string
  name: string
  price: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Tanker {
  id: string
  businessId: string
  tankerNumber: string
  fuelTypeId: string
  name: string
  capacity: number
  currentFuel: number
  pressure: number
  temperature: number
  location: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  fuelType?: FuelType
}

export interface CreateFuelTypeInput {
  name: string
  price: number
  isActive?: boolean
}

export interface CreateTankerInput {
  name: string
  capacity: number
  fuelTypeId: string
  tankerNumber: string
  currentFuel: number
  pressure: number
  temperature: number
  location: string
}

export interface UpdateTankerInput {
  name?: string
  capacity?: number
  fuelTypeId?: string
  tankerNumber?: string
  currentFuel?: number
  pressure?: number
  temperature?: number
  location?: string
}
