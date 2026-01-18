"use client"

import { PageLayout } from "@/components/common/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/hooks/use-auth"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { Settings } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"

export default function BusinessSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const { user } = useAuth()
  const currentBusiness = useCurrentBusiness()

  // Check if user has a business
  useEffect(() => {
    if (!currentBusiness) {
      router.push(`/${locale}/dashboard`)
    }
  }, [currentBusiness, locale, router])

  if (!currentBusiness) {
    return (
      <PageLayout title="Access Denied" description="You need to select a business">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Please select a business to access settings.
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Business Settings"
      description="Manage your business configuration and preferences"
      maxWidth="full"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Business Settings</CardTitle>
              <CardDescription>
                Configure your business settings, preferences, and modules
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This is the Business Settings page. Here you will be able to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Update business information and details</li>
              <li>Manage enabled modules and features</li>
              <li>Configure business preferences and defaults</li>
              <li>Set up tax rates and financial settings</li>
              <li>Manage business integrations and API keys</li>
              <li>Configure notification preferences</li>
              <li>Set up user roles and permissions</li>
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
