export const modules = [
  'inventory',
  'sales',
  'purchases',
  'accounting',
  'point-of-sale',
  'crm',
  'oil-filling-station',
] as const

export type Module = typeof modules[number]

// Module display names
export const moduleNames: Record<Module, string> = {
  'inventory': 'Inventory',
  'sales': 'Sales',
  'purchases': 'Purchases',
  'accounting': 'Accounting',
  'point-of-sale': 'Point of Sale',
  'crm': 'CRM',
  'oil-filling-station': 'Oil Filling Station',
}

// Module descriptions
export const moduleDescriptions: Record<Module, string> = {
  'inventory': 'Track stock levels and warehouse management',
  'sales': 'Track sales, orders, and customer interactions',
  'purchases': 'Manage purchase orders and suppliers',
  'accounting': 'Financial management and bookkeeping',
  'point-of-sale': 'Point of sale system for retail',
  'crm': 'Customer relationship management',
  'oil-filling-station': 'Manage fuel sales and inventory',
}
