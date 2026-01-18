"use client"

import { PageLayout } from "@/components/common/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/hooks/use-auth"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { CreditCard } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"

export default function PointOfSalePage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const { user } = useAuth()
  const currentBusiness = useCurrentBusiness()

  // Check if user has access to point-of-sale module
  useEffect(() => {
    if (currentBusiness && !currentBusiness.modules?.includes("point-of-sale")) {
      router.push(`/${locale}/dashboard`)
    }
  }, [currentBusiness, locale, router])

  if (!currentBusiness?.modules?.includes("point-of-sale")) {
    return (
      <PageLayout title="Access Denied" description="You don't have access to this module">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              You don't have access to the Point of Sale module. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Point of Sale"
      description="Point of sale system for retail"
      maxWidth="full"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Point of Sale</CardTitle>
              <CardDescription>
                Process sales transactions at the point of purchase
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This is the Point of Sale module page. Here you will be able to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Process sales transactions</li>
              <li>Handle cash and card payments</li>
              <li>Manage receipts and invoices</li>
              <li>Track daily sales</li>
              <li>Generate POS reports</li>
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
