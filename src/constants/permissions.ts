// Permission format: resource:action
// Examples: units:read, units:create, units:update, units:delete

export const permissionGroups = {
  units: {
    label: "Units",
    permissions: [
      { value: "units:read", label: "Read Units" },
      { value: "units:create", label: "Create Units" },
      { value: "units:update", label: "Update Units" },
      { value: "units:delete", label: "Delete Units" },
    ],
  },
  categories: {
    label: "Categories",
    permissions: [
      { value: "categories:read", label: "Read Categories" },
      { value: "categories:create", label: "Create Categories" },
      { value: "categories:update", label: "Update Categories" },
      { value: "categories:delete", label: "Delete Categories" },
    ],
  },
  branches: {
    label: "Branches",
    permissions: [
      { value: "branches:read", label: "Read Branches" },
      { value: "branches:create", label: "Create Branches" },
      { value: "branches:update", label: "Update Branches" },
      { value: "branches:delete", label: "Delete Branches" },
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
  business: {
    label: "Business",
    permissions: [
      { value: "business:read", label: "Read Business" },
      { value: "business:update", label: "Update Business" },
      { value: "business:delete", label: "Delete Business" },
    ],
  },
  sales: {
    label: "Sales",
    permissions: [
      { value: "sales:read", label: "Read Sales" },
      { value: "sales:create", label: "Create Sales" },
      { value: "sales:update", label: "Update Sales" },
      { value: "sales:delete", label: "Delete Sales" },
    ],
  },
  purchases: {
    label: "Purchases",
    permissions: [
      { value: "purchases:read", label: "Read Purchases" },
      { value: "purchases:create", label: "Create Purchases" },
      { value: "purchases:update", label: "Update Purchases" },
      { value: "purchases:delete", label: "Delete Purchases" },
    ],
  },
  accounting: {
    label: "Accounting",
    permissions: [
      { value: "accounting:read", label: "Read Accounting" },
      { value: "accounting:create", label: "Create Accounting" },
      { value: "accounting:update", label: "Update Accounting" },
      { value: "accounting:delete", label: "Delete Accounting" },
    ],
  },
} as const

// Flatten all permissions for easy access
export const allPermissions = Object.values(permissionGroups).flatMap(
  (group) => group.permissions
)
