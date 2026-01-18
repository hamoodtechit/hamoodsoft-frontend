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
