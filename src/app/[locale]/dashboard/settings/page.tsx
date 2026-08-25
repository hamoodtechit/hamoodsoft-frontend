"use client"

import { MediaDialog } from "@/components/common/media-dialog"
import { PageLayout } from "@/components/common/page-layout"
import { SkeletonList } from "@/components/skeletons/skeleton-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useUpdateSetting, useCreateSetting } from "@/lib/hooks/use-settings"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { UpdateSettingInput, updateSettingSchema } from "@/lib/validations/settings"
import { Setting } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { Edit, Globe, Image as ImageIcon, Locate, Lock, Settings, ShieldCheck, X } from "lucide-react"
import { COMMON_TIMEZONES, DEFAULT_TIMEZONE, detectDeviceTimeZone } from "@/lib/utils/date"
import { useHasPermission, useIsOwner } from "@/lib/hooks/use-permissions"
import { PERMISSIONS } from "@/lib/utils/permissions"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"
import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"

interface BusinessConfig {
  showPointReducing: boolean
  pointReducingAmountPerLiter: number // in milliliters
}

const DEFAULT_CONFIG: BusinessConfig = {
  showPointReducing: false,
  pointReducingAmountPerLiter: 0,
}

export default function BusinessSettingsPage() {
  const t = useTranslations("settings")
  const { settings, isLoading, generalSettings, taxSettings, invoiceSettings } = useAppSettings()
  const isOwner = useIsOwner()
  const canUpdateSettings = useHasPermission(PERMISSIONS.SETTINGS_UPDATE) || isOwner
  const updateMutation = useUpdateSetting()
  const createMutation = useCreateSetting()
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeMediaField, setActiveMediaField] = useState<"configs.logoUrl" | "configs.secondaryLogoUrl" | null>(null)

  // Business config state (for Fuel Point Reducing)
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig>(DEFAULT_CONFIG)
  const [businessConfigHasChanges, setBusinessConfigHasChanges] = useState(false) // eslint-disable-line @typescript-eslint/no-unused-vars

  const form = useForm<UpdateSettingInput>({
    resolver: zodResolver(updateSettingSchema),
    defaultValues: {
      name: "",
      configs: {},
    },
  })

  const handleEdit = (setting: Setting) => {
    if ((setting.name === "email" || setting.name === "sms") && !isOwner) {
      return
    }
    if (!canUpdateSettings) {
      return
    }
    setEditingSetting(setting)
    if (setting.name === "businessConfig") {
      // For businessConfig, sync local state from the setting's configs
      setBusinessConfig({
        showPointReducing: Boolean(setting.configs?.showPointReducing ?? false),
        pointReducingAmountPerLiter: Number(setting.configs?.pointReducingAmountPerLiter ?? 0),
      })
      setBusinessConfigHasChanges(false)
    }
    form.reset({
      name: setting.name,
      configs: setting.configs || {},
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = (data: UpdateSettingInput) => {
    if (!editingSetting) return

    // For businessConfig, use the local state instead of the form
    if (editingSetting.name === "businessConfig") {
      const configs = {
        showPointReducing: businessConfig.showPointReducing,
        pointReducingAmountPerLiter: businessConfig.pointReducingAmountPerLiter,
      }
      
      if (editingSetting.id.startsWith("new-")) {
        createMutation.mutate(
          {
            name: "businessConfig",
            configs,
          },
          {
            onSuccess: () => {
              setIsDialogOpen(false)
              setEditingSetting(null)
              form.reset()
              setBusinessConfigHasChanges(false)
            },
          }
        )
        return
      }

      updateMutation.mutate(
        {
          id: editingSetting.id,
          data: { name: "businessConfig", configs },
        },
        {
          onSuccess: () => {
            setIsDialogOpen(false)
            setEditingSetting(null)
            form.reset()
            setBusinessConfigHasChanges(false)
          },
        }
      )
      return
    }

    if (editingSetting.id.startsWith("new-")) {
      createMutation.mutate(
        {
          name: editingSetting.name,
          configs: data.configs,
        },
        {
          onSuccess: () => {
            setIsDialogOpen(false)
            setEditingSetting(null)
            form.reset()
          },
        }
      )
      return
    }

    updateMutation.mutate(
      {
        id: editingSetting.id,
        data,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false)
          setEditingSetting(null)
          form.reset()
        },
      }
    )
  }

  const getSettingDisplayName = (name: string): string => {
    const names: Record<string, string> = {
      general: "General Settings",
      taxRate: "Tax Rate",
      invoice: "Invoice Settings",
      email: "Email Settings",
      sms: "SMS Settings",
      businessConfig: "Business Config",
      inventory: "Inventory Settings",
    }
    return names[name] || name.charAt(0).toUpperCase() + name.slice(1)
  }

  const getSettingDescription = (name: string): string => {
    const descriptions: Record<string, string> = {
      general: "Configure logo, currency, timezone, and general preferences",
      taxRate: "Set default tax rate and tax name",
      invoice: "Configure invoice prefix, layout, footer, and numbering",
      email: "Configure email server settings (SMTP)",
      sms: "Configure SMS provider settings (Nexmo, Twilio)",
      businessConfig: "Configure fuel point reducing settings",
      inventory: "Configure inventory and stock rules",
    }
    return descriptions[name] || "Configure this setting"
  }

  const operationalSettings = useMemo(() => {
    const operationalNames = ["general", "taxRate", "invoice", "inventory", "businessConfig"]
    const map = new Map<string, Setting>()
    settings.forEach((s) => {
      if (operationalNames.includes(s.name)) {
        map.set(s.name, s)
      }
    })

    operationalNames.forEach((name) => {
      if (!map.has(name)) {
        map.set(name, { id: `new-${name}`, name, configs: {} } as Setting)
      }
    })

    return Array.from(map.values())
  }, [settings])

  const integrationSettings = useMemo(() => {
    if (!isOwner) return []
    const integrationNames = ["email", "sms"]
    const map = new Map<string, Setting>()
    settings.forEach((s) => {
      if (integrationNames.includes(s.name)) {
        map.set(s.name, s)
      }
    })

    integrationNames.forEach((name) => {
      if (!map.has(name)) {
        map.set(name, { id: `new-${name}`, name, configs: {} } as Setting)
      }
    })

    return Array.from(map.values())
  }, [settings, isOwner])

  const renderSettingCard = (setting: Setting, isRestricted = false) => (
    <Card key={setting.id} className="relative">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">
                {getSettingDisplayName(setting.name)}
              </CardTitle>
              {isRestricted && (
                <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[10px] py-0 h-4">
                  Owner Only
                </Badge>
              )}
            </div>
            <CardDescription className="mt-1">
              {getSettingDescription(setting.name)}
            </CardDescription>
          </div>
          {canUpdateSettings && (!isRestricted || isOwner) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(setting)}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {setting.name === "general" && generalSettings && (
            <>
              {generalSettings.companyName && (
                <div>
                  <span className="text-muted-foreground">Company: </span>
                  <span className="font-medium">{generalSettings.companyName}</span>
                </div>
              )}
              {generalSettings.currency && (
                <div>
                  <span className="text-muted-foreground">Currency: </span>
                  <span className="font-medium">
                    {generalSettings.currency.name} ({generalSettings.currency.symbol})
                  </span>
                </div>
              )}
              {generalSettings.timeZone && (
                <div>
                  <span className="text-muted-foreground">Timezone: </span>
                  <span className="font-medium">{generalSettings.timeZone}</span>
                </div>
              )}
            </>
          )}
          {setting.name === "taxRate" && taxSettings && (
            <>
              {taxSettings.name && (
                <div>
                  <span className="text-muted-foreground">Name: </span>
                  <span className="font-medium">{taxSettings.name}</span>
                </div>
              )}
              {taxSettings.rate !== undefined && (
                <div>
                  <span className="text-muted-foreground">Rate: </span>
                  <span className="font-medium">{taxSettings.rate}%</span>
                </div>
              )}
            </>
          )}
          {setting.name === "invoice" && invoiceSettings && (
            <>
              {invoiceSettings.prefix && (
                <div>
                  <span className="text-muted-foreground">Prefix: </span>
                  <span className="font-medium">{invoiceSettings.prefix}</span>
                </div>
              )}
              {invoiceSettings.layout && (
                <div>
                  <span className="text-muted-foreground">Layout: </span>
                  <span className="font-medium uppercase">{invoiceSettings.layout}</span>
                </div>
              )}
            </>
          )}
          {setting.name === "businessConfig" && (
            <>
              <div>
                <span className="text-muted-foreground">Fuel Point Reducing: </span>
                <span className="font-medium">
                  {setting.configs?.showPointReducing ? "Enabled" : "Disabled"}
                </span>
              </div>
              {Boolean(setting.configs?.showPointReducing) && (
                <div>
                  <span className="text-muted-foreground">Reducing Amount/L: </span>
                  <span className="font-medium">
                    {String(setting.configs?.pointReducingAmountPerLiter ?? 0)}
                  </span>
                </div>
              )}
            </>
          )}
          {setting.name === "inventory" && (
            <>
              <div>
                <span className="text-muted-foreground">Expired Sales: </span>
                <span className="font-medium">
                  {setting.configs?.allowExpiredProductSales ? "Allowed" : "Blocked"}
                </span>
              </div>
            </>
          )}
          {setting.name === "email" && (
            <>
              <div>
                <span className="text-muted-foreground">Host: </span>
                <span className="font-medium">{String(setting.configs?.host || "Not configured")}</span>
              </div>
              {setting.configs?.port && (
                <div>
                  <span className="text-muted-foreground">Port: </span>
                  <span className="font-medium">{String(setting.configs?.port)}</span>
                </div>
              )}
              {setting.configs?.username && (
                <div>
                  <span className="text-muted-foreground">User: </span>
                  <span className="font-medium">{String(setting.configs?.username)}</span>
                </div>
              )}
            </>
          )}
          {setting.name === "sms" && (
            <>
              <div>
                <span className="text-muted-foreground">Provider: </span>
                <span className="font-medium uppercase">{String(setting.configs?.provider || "Not configured")}</span>
              </div>
              {setting.configs?.senderId && (
                <div>
                  <span className="text-muted-foreground">Sender ID: </span>
                  <span className="font-medium">{String(setting.configs?.senderId)}</span>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <PageLayout title={t("title")} description={t("description")} maxWidth="full">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>{t("title")}</CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonList count={5} />
          ) : (
            <div className="space-y-8">
              {/* Operational & Business Settings */}
              <div>
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-foreground">
                    Operational & Business Settings
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    General station preferences, tax rules, invoice layouts, and inventory settings
                  </p>
                </div>
                {operationalSettings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    No operational settings found
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {operationalSettings.map((setting) => renderSettingCard(setting, false))}
                  </div>
                )}
              </div>

              {/* System & Gateway Integrations (Owner Only) */}
              {isOwner && (
                <div className="pt-6 border-t">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-amber-500" />
                        <h3 className="text-base font-semibold text-foreground">
                          System & Gateway Integrations
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Sensitive SMTP server credentials and SMS gateway configurations (restricted to Business Owner only)
                      </p>
                    </div>
                    <Badge variant="outline" className="w-fit border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-xs py-0.5">
                      Business Owner Only
                    </Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {integrationSettings.map((setting) => renderSettingCard(setting, true))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>


      {/* Edit Setting Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit {editingSetting ? getSettingDisplayName(editingSetting.name) : "Setting"}
            </DialogTitle>
            <DialogDescription>
              {editingSetting ? getSettingDescription(editingSetting.name) : ""}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setting Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* General Settings */}
              {editingSetting?.name === "general" && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="configs.logoUrl"
                    render={({ field }) => {
                      const logoUrl = field.value || ""
                      return (
                        <FormItem>
                          <FormLabel>Logo</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              {logoUrl ? (
                                <div className="relative inline-block">
                                  <img
                                    src={logoUrl}
                                    alt="Logo"
                                    className="h-24 w-24 object-contain border rounded-lg p-2"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                    onClick={() => field.onChange("")}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="h-24 w-24 border-2 border-dashed rounded-lg flex items-center justify-center">
                                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setActiveMediaField("configs.logoUrl")}
                                className="w-full"
                              >
                                <ImageIcon className="h-4 w-4 mr-2" />
                                {logoUrl ? "Change Logo" : "Select Logo"}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="configs.companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company/Business Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your business name" value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="configs.secondaryLogoUrl"
                    render={({ field }) => {
                      const logoUrl = field.value || ""
                      return (
                        <FormItem>
                          <FormLabel>Secondary Logo (Right side on Receipt)</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              {logoUrl ? (
                                <div className="relative inline-block">
                                  <img
                                    src={logoUrl}
                                    alt="Secondary Logo"
                                    className="h-24 w-24 object-contain border rounded-lg p-2"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                    onClick={() => field.onChange("")}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="h-24 w-24 border-2 border-dashed rounded-lg flex items-center justify-center">
                                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setActiveMediaField("configs.secondaryLogoUrl")}
                                className="w-full"
                              >
                                <ImageIcon className="h-4 w-4 mr-2" />
                                {logoUrl ? "Change Secondary Logo" : "Select Secondary Logo"}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="configs.businessAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Address</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Enter your business address" value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="configs.officePhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Office Phone (অফিস)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. ০১৮০৫৪৫৬২১৭" value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="configs.counterPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Counter Phone (কাউন্টার)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. ০১৮০৫৪৫৬২১৯" value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="configs.binNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>BIN Number (for Mushak 6.3)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your VAT Registration/BIN number" value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="configs.currency.code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency Code</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="BDT" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="configs.currency.symbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency Symbol</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="৳" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="configs.currency.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Taka" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="configs.timeZone"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="flex items-center gap-1.5">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            Business Timezone
                          </FormLabel>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-primary gap-1 px-2"
                            onClick={() => {
                              const detected = detectDeviceTimeZone()
                              field.onChange(detected)
                            }}
                          >
                            <Locate className="h-3.5 w-3.5" />
                            Detect Device Timezone
                          </Button>
                        </div>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || DEFAULT_TIMEZONE}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select business timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            {COMMON_TIMEZONES.map((tz) => (
                              <SelectItem key={tz.value} value={tz.value}>
                                <div className="flex items-center justify-between gap-3 w-full">
                                  <span>{tz.label}</span>
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {tz.offset}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="configs.currencySymbolPlacement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency Symbol Placement</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "before-amount"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="before-amount">Before Amount</SelectItem>
                            <SelectItem value="after-amount">After Amount</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Tax Rate Settings */}
              {editingSetting?.name === "taxRate" && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="configs.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="VAT" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="configs.rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Invoice Settings */}
              {editingSetting?.name === "invoice" && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="configs.prefix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Prefix</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="INV" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="configs.startNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Number</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1000)}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="configs.layout"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Layout</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "pos-80mm"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pos-58mm">POS 58mm</SelectItem>
                            <SelectItem value="pos-80mm">POS 80mm</SelectItem>
                            <SelectItem value="pos-a4">A4</SelectItem>
                            <SelectItem value="a5">A5</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="configs.footer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Footer Text</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Thank you for your business!" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Email Settings */}
              {editingSetting?.name === "email" && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="configs.mailDriver"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mail Driver</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "smtp"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="smtp">SMTP</SelectItem>
                            <SelectItem value="mailgun">Mailgun</SelectItem>
                            <SelectItem value="ses">Amazon SES</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="configs.host"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Host</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="smtp.gmail.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="configs.port"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Port</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="587" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="configs.username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="your-email@gmail.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="configs.password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} placeholder="••••••••" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="configs.encryption"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Encryption</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "tls"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="tls">TLS</SelectItem>
                            <SelectItem value="ssl">SSL</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="configs.fromAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Address</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="noreply@example.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="configs.fromName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Your Business" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* SMS Settings */}
              {editingSetting?.name === "sms" && (
                <div className="space-y-4">
                  <Label>SMS Provider</Label>
                  <div className="space-y-4 border rounded-lg p-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Nexmo</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="configs.nexmo.apiKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>API Key</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="API Key" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="configs.nexmo.apiSecret"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>API Secret</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} placeholder="API Secret" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="configs.nexmo.fromNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="+1234567890" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="border-t pt-4">
                      <Label className="text-sm font-medium mb-2 block">Twilio</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="configs.twilio.accountSid"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account SID</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Account SID" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="configs.twilio.authToken"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Auth Token</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} placeholder="Auth Token" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="configs.twilio.fromNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="+1234567890" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Business Config Settings */}
              {editingSetting?.name === "businessConfig" && (
                <div className="space-y-4">
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
                      checked={businessConfig.showPointReducing}
                      onCheckedChange={(checked) => {
                        setBusinessConfig((prev) => ({ ...prev, showPointReducing: checked }))
                        setBusinessConfigHasChanges(true)
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
                        value={businessConfig.pointReducingAmountPerLiter}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0
                          setBusinessConfig((prev) => ({ ...prev, pointReducingAmountPerLiter: val }))
                          setBusinessConfigHasChanges(true)
                        }}
                        className="w-[140px]"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">ml / liter</span>
                    </div>
                    {businessConfig.pointReducingAmountPerLiter > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-md">
                        ⚡ Each liter sold will actually dispense{" "}
                        <strong>{(1000 - businessConfig.pointReducingAmountPerLiter).toFixed(0)} ml</strong>{" "}
                        ({((1000 - businessConfig.pointReducingAmountPerLiter) / 1000 * 100).toFixed(1)}% of 1L)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Inventory Settings */}
              {editingSetting?.name === "inventory" && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="configs.allowExpiredProductSales"
                    render={({ field }) => (
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                        <div className="space-y-1 pr-4">
                          <Label htmlFor="allowExpiredProductSales" className="text-sm font-medium">
                            Allow Expired Product Sales
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            When enabled, you can sell products even if their stock has passed its expiry date.
                          </p>
                        </div>
                        <Switch
                          id="allowExpiredProductSales"
                          checked={field.value === true}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    )}
                  />
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setEditingSetting(null)
                    form.reset()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Media Dialog for Logo Selection */}
      <MediaDialog
        open={activeMediaField !== null}
        onOpenChange={(open) => !open && setActiveMediaField(null)}
        type="image"
        multiple={false}
        onSelect={(media) => {
          const selectedMedia = Array.isArray(media) ? media[0] : media
          const logoUrl = selectedMedia.secureUrl || selectedMedia.url
          if (activeMediaField) {
            form.setValue(activeMediaField, logoUrl)
          }
          setActiveMediaField(null)
        }}
      />
    </PageLayout>
  )
}
