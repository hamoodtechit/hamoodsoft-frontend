import {
  BookOpen,
  Fuel,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react"
import { LucideIcon } from "lucide-react"

export interface App {
  id: string
  name: string
  description: string
  icon: LucideIcon
  category: "core" | "management" | "modules"
}

export const availableApps: App[] = [
  {
    id: "people",
    name: "People",
    description: "Manage employees, customers, and contacts",
    icon: Users,
    category: "management",
  },
  {
    id: "sales",
    name: "Sales",
    description: "Track sales, orders, and customer interactions",
    icon: ShoppingCart,
    category: "management",
  },
  {
    id: "purchase",
    name: "Purchase",
    description: "Manage purchase orders and suppliers",
    icon: Package,
    category: "management",
  },
  {
    id: "inventory",
    name: "Inventory",
    description: "Track stock levels and warehouse management",
    icon: Package,
    category: "management",
  },
  {
    id: "accounting",
    name: "Accounting",
    description: "Financial management and bookkeeping",
    icon: BookOpen,
    category: "management",
  },
  {
    id: "petrol-pump",
    name: "Petrol Pump",
    description: "Manage fuel sales and inventory",
    icon: Fuel,
    category: "modules",
  },
]

// Dashboard is always included, so it's not in the selectable apps
export const CORE_APP_ID = "dashboard"
