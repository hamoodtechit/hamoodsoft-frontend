"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useSettings, useUpdateSetting, useCreateSetting } from "@/lib/hooks/use-settings"
import { Settings, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { PageLayout } from "@/components/common/page-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface BusinessConfig {
  showPointReducing: boolean
  pointReducingAmountPerLiter: number // in milliliters
}

const DEFAULT_CONFIG: BusinessConfig = {
  showPointReducing: false,
  pointReducingAmountPerLiter: 0,
}

export default function BusinessSettingsPage() {
  const { data: settingsData, isLoading: settingsLoading } = useSettings()
  const updateMutation = useUpdateSetting()
  const createMutation = useCreateSetting()

  const [config, setConfig] = useState<BusinessConfig>(DEFAULT_CONFIG)
  const [settingId, setSettingId] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Find businessConfig from settings list
  useEffect(() => {
    if (settingsData?.items) {
      const found = settingsData.items.find((s) => s.name === "businessConfig")
      if (found) {
        setSettingId(found.id)
        setConfig({
          showPointReducing: found.configs?.showPointReducing ?? false,
          pointReducingAmountPerLiter: found.configs?.pointReducingAmountPerLiter ?? 0,
        })
      }
    }
  }, [settingsData])

  const handleSave = () => {
    const configs = {
      showPointReducing: config.showPointReducing,
      pointReducingAmountPerLiter: config.pointReducingAmountPerLiter,
    }

    if (settingId) {
      updateMutation.mutate(
        { id: settingId, data: { name: "businessConfig", configs } },
        {
          onSuccess: () => setHasChanges(false),
        }
      )
    } else {
      createMutation.mutate(
        { name: "businessConfig", configs },
        {
          onSuccess: () => setHasChanges(false),
        }
      )
    }
  }

  const isSaving = updateMutation.isPending || createMutation.isPending

  if (settingsLoading) {
    return (
      <PageLayout
        title="Business Settings"
        description="Configure business-level settings for your fuel station."
        align="left"
      >
        <div className="space-y-6 w-full">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-56" />
                  <Skeleton className="h-4 w-72" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-24 w-full" />
                <div className="flex justify-end pt-4">
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Business Settings"
      description="Configure business-level settings for your fuel station."
      align="left"
    >
      <div className="space-y-6 w-full">
        {/* Point Reducing Section Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Settings className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <CardTitle>Fuel Point Reducing</CardTitle>
                <CardDescription>
                  Configure the fuel quantity reduction per liter for dispensing adjustments.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Show Point Reducing Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
              <div className="space-y-1 pr-4">
                <Label htmlFor="showPointReducing" className="text-sm font-medium">
                  Show Point Reducing
                </Label>
                <p className="text-xs text-muted-foreground">
                  When enabled, the actual (reduced) quantity is shown in the sales UI.
                  When disabled, the named/told quantity is displayed instead.
                </p>
              </div>
              <Switch
                id="showPointReducing"
                checked={config.showPointReducing}
                onCheckedChange={(checked) => {
                  setConfig((prev) => ({ ...prev, showPointReducing: checked }))
                  setHasChanges(true)
                }}
              />
            </div>

            {/* Reducing Amount Per Liter */}
            <div className="space-y-3 p-4 rounded-lg bg-muted/50 border">
              <div className="space-y-1">
                <Label htmlFor="reducingAmount" className="text-sm font-medium">
                  Reducing Amount per Liter (ml)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Amount in milliliters to reduce per liter when dispensing fuel.
                  For example, entering <strong>20</strong> means each liter sold will actually dispense 980ml.
                </p>
              </div>
              <div className="flex items-center gap-3 max-w-[280px]">
                <Input
                  id="reducingAmount"
                  type="number"
                  min={0}
                  max={1000}
                  step={1}
                  value={config.pointReducingAmountPerLiter}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0
                    setConfig((prev) => ({ ...prev, pointReducingAmountPerLiter: val }))
                    setHasChanges(true)
                  }}
                  className="w-[140px]"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">ml / liter</span>
              </div>
              {config.pointReducingAmountPerLiter > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-md">
                  ⚡ Each liter sold will actually dispense{" "}
                  <strong>{(1000 - config.pointReducingAmountPerLiter).toFixed(0)} ml</strong>{" "}
                  ({((1000 - config.pointReducingAmountPerLiter) / 1000 * 100).toFixed(1)}% of 1L)
                </p>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="min-w-32"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Saving...
                  </span>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
