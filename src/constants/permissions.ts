// Permission format: resource:action
// Examples: units:read, units:create, units:update, units:delete

export type Permission = {
  value: string
  label: string
}

export interface ModulePermissionGroup {
  module: string
  permissions: string[]
}

// Default owner permissions by module (matches backend structure)
export const DEFAULT_OWNER_PERMISSIONS_BY_MODULE: ModulePermissionGroup[] = [
  {
    module: 'inventory',
    permissions: [
      'products:read',
      'products:create',
      'products:update',
      'products:delete',
      'stocks:read',
      'stocks:update',
      'product_categories:read',
      'product_categories:create',
      'product_categories:update',
      'product_categories:delete',
      'units:read',
      'units:create',
      'units:update',
      'units:delete',
      'brands:read',
      'brands:create',
      'brands:update',
      'brands:delete',
    ],
  },
  {
    module: 'purchases',
    permissions: [
      'purchases:read',
      'purchases:create',
      'purchases:update',
      'purchases:delete',
    ],
  },
  {
    module: 'sales',
    permissions: ['sales:read', 'sales:create', 'sales:update', 'sales:delete'],
  },
  {
    module: 'business',
    permissions: [
      'branches:read',
      'branches:create',
      'branches:update',
      'branches:delete',
      'business:update',
    ],
  },
  {
    module: 'user',
    permissions: [
      'user:manage',
      'subscriptions:read',
      'subscriptions:create',
      'roles:read',
      'roles:create',
      'roles:update',
      'roles:delete',
      'roles:assign',
    ],
  },
  {
    module: 'crm',
    permissions: [
      'contacts:read',
      'contacts:create',
      'contacts:update',
      'contacts:delete',
    ],
  },
  {
    module: 'settings',
    permissions: [
      'settings:read',
      'settings:create',
      'settings:update',
      'settings:delete',
    ],
  },
  {
    module: 'accounting',
    permissions: [
      'accounts:read',
      'accounts:create',
      'accounts:update',
      'accounts:delete',
      'payments:read',
      'payments:create',
      'payments:update',
      'payments:delete',
      'transactions:read',
      'transactions:create',
      'transactions:update',
      'transactions:delete',
      'income_expense_categories:read',
      'income_expense_categories:create',
      'income_expense_categories:update',
      'income_expense_categories:delete',
    ],
  },
  {
    module: 'media',
    permissions: ['media:read', 'media:create', 'media:update', 'media:delete'],
  },
]

// Frontend-friendly permission groups with labels for UI display
export const permissionGroups = {
  // Inventory module
  products: {
    label: "Products",
    permissions: [
      { value: "products:read", label: "Read Products" },
      { value: "products:create", label: "Create Products" },
      { value: "products:update", label: "Update Products" },
      { value: "products:delete", label: "Delete Products" },
    ],
  },
  stocks: {
    label: "Stocks",
    permissions: [
      { value: "stocks:read", label: "Read Stocks" },
      { value: "stocks:update", label: "Update Stocks" },
    ],
  },
  product_categories: {
    label: "Product Categories",
    permissions: [
      { value: "product_categories:read", label: "Read Categories" },
      { value: "product_categories:create", label: "Create Categories" },
      { value: "product_categories:update", label: "Update Categories" },
      { value: "product_categories:delete", label: "Delete Categories" },
    ],
  },
  units: {
    label: "Units",
    permissions: [
      { value: "units:read", label: "Read Units" },
      { value: "units:create", label: "Create Units" },
      { value: "units:update", label: "Update Units" },
      { value: "units:delete", label: "Delete Units" },
    ],
  },
  brands: {
    label: "Brands",
    permissions: [
      { value: "brands:read", label: "Read Brands" },
      { value: "brands:create", label: "Create Brands" },
      { value: "brands:update", label: "Update Brands" },
      { value: "brands:delete", label: "Delete Brands" },
    ],
  },
  // Purchases module
  purchases: {
    label: "Purchases",
    permissions: [
      { value: "purchases:read", label: "Read Purchases" },
      { value: "purchases:create", label: "Create Purchases" },
      { value: "purchases:update", label: "Update Purchases" },
      { value: "purchases:delete", label: "Delete Purchases" },
    ],
  },
  // Sales module
  sales: {
    label: "Sales",
    permissions: [
      { value: "sales:read", label: "Read Sales" },
      { value: "sales:create", label: "Create Sales" },
      { value: "sales:update", label: "Update Sales" },
      { value: "sales:delete", label: "Delete Sales" },
    ],
  },
  // Business module
  branches: {
    label: "Branches",
    permissions: [
      { value: "branches:read", label: "Read Branches" },
      { value: "branches:create", label: "Create Branches" },
      { value: "branches:update", label: "Update Branches" },
      { value: "branches:delete", label: "Delete Branches" },
    ],
  },
  business: {
    label: "Business",
    permissions: [
      { value: "business:update", label: "Update Business" },
    ],
  },
  // User module
  user: {
    label: "User Management",
    permissions: [
      { value: "user:manage", label: "Manage Users" },
      { value: "subscriptions:read", label: "Read Subscriptions" },
      { value: "subscriptions:create", label: "Create Subscriptions" },
    ],
  },
  roles: {
    label: "Roles",
    permissions: [
      { value: "roles:read", label: "Read Roles" },
      { value: "roles:create", label: "Create Roles" },
      { value: "roles:update", label: "Update Roles" },
      { value: "roles:delete", label: "Delete Roles" },
      { value: "roles:assign", label: "Assign Users to Roles" },
    ],
  },
  // CRM module
  contacts: {
    label: "Contacts",
    permissions: [
      { value: "contacts:read", label: "Read Contacts" },
      { value: "contacts:create", label: "Create Contacts" },
      { value: "contacts:update", label: "Update Contacts" },
      { value: "contacts:delete", label: "Delete Contacts" },
    ],
  },
  // Settings module
  settings: {
    label: "Settings",
    permissions: [
      { value: "settings:read", label: "Read Settings" },
      { value: "settings:create", label: "Create Settings" },
      { value: "settings:update", label: "Update Settings" },
      { value: "settings:delete", label: "Delete Settings" },
    ],
  },
  // Accounting module
  accounts: {
    label: "Accounts",
    permissions: [
      { value: "accounts:read", label: "Read Accounts" },
      { value: "accounts:create", label: "Create Accounts" },
      { value: "accounts:update", label: "Update Accounts" },
      { value: "accounts:delete", label: "Delete Accounts" },
    ],
  },
  payments: {
    label: "Payments",
    permissions: [
      { value: "payments:read", label: "Read Payments" },
      { value: "payments:create", label: "Create Payments" },
      { value: "payments:update", label: "Update Payments" },
      { value: "payments:delete", label: "Delete Payments" },
    ],
  },
  transactions: {
    label: "Transactions",
    permissions: [
      { value: "transactions:read", label: "Read Transactions" },
      { value: "transactions:create", label: "Create Transactions" },
      { value: "transactions:update", label: "Update Transactions" },
      { value: "transactions:delete", label: "Delete Transactions" },
    ],
  },
  income_expense_categories: {
    label: "Income/Expense Categories",
    permissions: [
      { value: "income_expense_categories:read", label: "Read Categories" },
      { value: "income_expense_categories:create", label: "Create Categories" },
      { value: "income_expense_categories:update", label: "Update Categories" },
      { value: "income_expense_categories:delete", label: "Delete Categories" },
    ],
  },
  // Media module
  media: {
    label: "Media",
    permissions: [
      { value: "media:read", label: "Read Media" },
      { value: "media:create", label: "Create Media" },
      { value: "media:update", label: "Update Media" },
      { value: "media:delete", label: "Delete Media" },
    ],
  },
} as const

// Flatten all permissions for easy access
export const allPermissions: Permission[] = (
  Object.values(permissionGroups) as unknown as Array<{ permissions: readonly Permission[] }>
).flatMap((group) => group.permissions) as Permission[]
