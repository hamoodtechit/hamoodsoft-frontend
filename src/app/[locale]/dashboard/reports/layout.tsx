"use client"

import { PermissionGuard } from "@/components/common/permission-guard"
import { PageLayout } from "@/components/common/page-layout"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslations } from "next-intl"

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  const tSettings = useTranslations("settings")

  return (
    <PermissionGuard
      permission="reports:read"
      fallback={
        <PageLayout title={tSettings("accessDenied")} description={tSettings("selectBusinessDescription")}>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                You do not have permission to view reports.
              </p>
            </CardContent>
          </Card>
        </PageLayout>
      }
    >
      {children}
    </PermissionGuard>
  )
}
