import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  DollarSign,
} from "lucide-react"

export default async function DashboardPage() {
  const t = await getTranslations("common")

  // Mock data - replace with actual API calls
  const stats = [
    {
      title: "Total Sales",
      value: "$45,231",
      change: "+20.1%",
      icon: DollarSign,
    },
    {
      title: "Active Users",
      value: "1,234",
      change: "+12.5%",
      icon: Users,
    },
    {
      title: "Orders",
      value: "892",
      change: "+8.2%",
      icon: ShoppingCart,
    },
    {
      title: "Products",
      value: "456",
      change: "+5.1%",
      icon: Package,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stat.change}</span> from last
                  month
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Frequently used actions and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <button className="flex items-center justify-between rounded-lg border p-4 text-left hover:bg-accent">
                <div>
                  <div className="font-medium">Create New Sale</div>
                  <div className="text-sm text-muted-foreground">
                    Start a new sales transaction
                  </div>
                </div>
                <ShoppingCart className="h-5 w-5" />
              </button>
              <button className="flex items-center justify-between rounded-lg border p-4 text-left hover:bg-accent">
                <div>
                  <div className="font-medium">Add Product</div>
                  <div className="text-sm text-muted-foreground">
                    Add a new product to inventory
                  </div>
                </div>
                <Package className="h-5 w-5" />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest business activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New sale completed</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New customer added</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
