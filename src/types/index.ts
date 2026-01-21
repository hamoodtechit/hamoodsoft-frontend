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

export interface Role {
  id: string
  businessId: string
  name: string
  permissions?: string[]
  createdAt?: string
  updatedAt?: string
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
  unit?: Unit
  categories?: Category[]
  isVariable?: boolean
  manageStocks?: boolean
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
  unit?: Unit
  createdAt?: string
  updatedAt?: string
}

export interface Attribute {
  id: string
  businessId?: string
  productId: string
  name: string
  values: string[]
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
  purchasePrice?: number | null
  salePrice?: number | null
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
  reason?: string | null
  createdAt?: string
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
