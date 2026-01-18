"use client"

import { PageLayout } from "@/components/common/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/hooks/use-auth"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { Ruler } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"

export default function UnitsPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const { user } = useAuth()
  const currentBusiness = useCurrentBusiness()

  // Check if user has access to inventory module
  useEffect(() => {
    if (currentBusiness && !currentBusiness.modules?.includes("inventory")) {
      router.push(`/${locale}/dashboard`)
    }
  }, [currentBusiness, locale, router])

  if (!currentBusiness?.modules?.includes("inventory")) {
    return (
      <PageLayout title="Access Denied" description="You don't have access to this module">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              You don't have access to the Inventory module. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Units"
      description="Manage measurement units for your products"
      maxWidth="full"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Ruler className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Unit Management</CardTitle>
              <CardDescription>
                Manage measurement units for your inventory items
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This is the Units module page. Here you will be able to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Create and manage measurement units (kg, g, L, mL, etc.)</li>
              <li>Define unit conversions and relationships</li>
              <li>Set default units for different product types</li>
              <li>Manage unit categories and groups</li>
              <li>Track unit usage across products</li>
            </ul>
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This is a placeholder page. Full functionality will be implemented soon.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  )
}
