/**
 * Permission Utilities
 * Industry-standard utilities for permission management
 */


/**
 * Type-safe permission keys
 * Add all your permissions here for type safety
 */
export const PERMISSIONS = {
  // Products
  PRODUCTS_READ: "products:read",
  PRODUCTS_CREATE: "products:create",
  PRODUCTS_UPDATE: "products:update",
  PRODUCTS_DELETE: "products:delete",
  
  // Stocks
  STOCKS_READ: "stocks:read",
  STOCKS_UPDATE: "stocks:update",
  
  // Categories
  CATEGORIES_READ: "product_categories:read",
  CATEGORIES_CREATE: "product_categories:create",
  CATEGORIES_UPDATE: "product_categories:update",
  CATEGORIES_DELETE: "product_categories:delete",
  
  // Brands
  BRANDS_READ: "brands:read",
  BRANDS_CREATE: "brands:create",
  BRANDS_UPDATE: "brands:update",
  BRANDS_DELETE: "brands:delete",
  
  // Units
  UNITS_READ: "units:read",
  UNITS_CREATE: "units:create",
  UNITS_UPDATE: "units:update",
  UNITS_DELETE: "units:delete",
  
  // Attributes (if exists)
  ATTRIBUTES_READ: "attributes:read",
  ATTRIBUTES_CREATE: "attributes:create",
  ATTRIBUTES_UPDATE: "attributes:update",
  ATTRIBUTES_DELETE: "attributes:delete",
  
  // Sales
  SALES_READ: "sales:read",
  SALES_CREATE: "sales:create",
  SALES_UPDATE: "sales:update",
  SALES_DELETE: "sales:delete",
  
  // Purchases
  PURCHASES_READ: "purchases:read",
  PURCHASES_CREATE: "purchases:create",
  PURCHASES_UPDATE: "purchases:update",
  PURCHASES_DELETE: "purchases:delete",
  
  // Accounts
  ACCOUNTS_READ: "accounts:read",
  ACCOUNTS_CREATE: "accounts:create",
  ACCOUNTS_UPDATE: "accounts:update",
  ACCOUNTS_DELETE: "accounts:delete",
  
  // Transactions
  TRANSACTIONS_READ: "transactions:read",
  TRANSACTIONS_CREATE: "transactions:create",
  TRANSACTIONS_UPDATE: "transactions:update",
  TRANSACTIONS_DELETE: "transactions:delete",
  
  // Contacts
  CONTACTS_READ: "contacts:read",
  CONTACTS_CREATE: "contacts:create",
  CONTACTS_UPDATE: "contacts:update",
  CONTACTS_DELETE: "contacts:delete",
  
  // Roles
  ROLES_READ: "roles:read",
  ROLES_CREATE: "roles:create",
  ROLES_UPDATE: "roles:update",
  ROLES_DELETE: "roles:delete",
  ROLES_ASSIGN: "roles:assign",
  
  // Settings
  SETTINGS_READ: "settings:read",
  SETTINGS_CREATE: "settings:create",
  SETTINGS_UPDATE: "settings:update",
  SETTINGS_DELETE: "settings:delete",
  
  // Business
  BUSINESS_UPDATE: "business:update",
  
  // Branches
  BRANCHES_READ: "branches:read",
  BRANCHES_CREATE: "branches:create",
  BRANCHES_UPDATE: "branches:update",
  BRANCHES_DELETE: "branches:delete",
} as const

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS]

/**
 * Module names for type safety
 */
export const MODULES = {
  INVENTORY: "inventory",
  SALES: "sales",
  PURCHASES: "purchases",
  ACCOUNTING: "accounting",
  CRM: "crm",
  POINT_OF_SALE: "point-of-sale",
  OIL_FILLING_STATION: "oil-filling-station",
} as const

export type ModuleName = typeof MODULES[keyof typeof MODULES]

/**
 * Permission groups for common operations
 */
export const PERMISSION_GROUPS = {
  // CRUD operations
  PRODUCTS_FULL: [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.PRODUCTS_DELETE,
  ],
  PRODUCTS_MANAGE: [
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.PRODUCTS_DELETE,
  ],
  PRODUCTS_READ_ONLY: [PERMISSIONS.PRODUCTS_READ],
  
  // Sales
  SALES_FULL: [
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_UPDATE,
    PERMISSIONS.SALES_DELETE,
  ],
  
  // Accounting
  ACCOUNTING_FULL: [
    PERMISSIONS.ACCOUNTS_READ,
    PERMISSIONS.ACCOUNTS_CREATE,
    PERMISSIONS.ACCOUNTS_UPDATE,
    PERMISSIONS.ACCOUNTS_DELETE,
    PERMISSIONS.TRANSACTIONS_READ,
    PERMISSIONS.TRANSACTIONS_CREATE,
    PERMISSIONS.TRANSACTIONS_UPDATE,
    PERMISSIONS.TRANSACTIONS_DELETE,
  ],
} as const

/**
 * Helper to check if a string is a valid permission
 */
export function isValidPermission(permission: string): permission is PermissionKey {
  return Object.values(PERMISSIONS).includes(permission as PermissionKey)
}

/**
 * Helper to check if a string is a valid module
 */
export function isValidModule(module: string): module is ModuleName {
  return Object.values(MODULES).includes(module as ModuleName)
}

/**
 * Get permissions for a module
 */
export function getModulePermissions(module: ModuleName): PermissionKey[] {
  const modulePrefix = `${module}:`
  return Object.values(PERMISSIONS).filter(
    (perm) => perm.startsWith(modulePrefix)
  ) as PermissionKey[]
}

/**
 * Log permission denial for security auditing
 * In production, send this to your logging service
 */
export function logPermissionDenial(
  userId: string,
  permission: string,
  resource?: string
) {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[Permission Denied] User: ${userId}, Permission: ${permission}`, {
      resource,
      timestamp: new Date().toISOString(),
    })
  }
  
  // In production, send to logging service:
  // logService.warn('permission_denied', {
  //   userId,
  //   permission,
  //   resource,
  //   timestamp: new Date().toISOString(),
  // })
}
