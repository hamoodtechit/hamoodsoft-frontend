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
import { Textarea } from "@/components/ui/textarea"
import { useUpdateSetting } from "@/lib/hooks/use-settings"
import { useAppSettings } from "@/lib/providers/settings-provider"
import { UpdateSettingInput } from "@/lib/validations/settings"
import { Setting } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { Edit, Image as ImageIcon, Settings, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"

export default function BusinessSettingsPage() {
  const t = useTranslations("settings")
  const { settings, isLoading, generalSettings, taxSettings, invoiceSettings } = useAppSettings()
  const updateMutation = useUpdateSetting()
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false)

  const form = useForm<UpdateSettingInput>({
    resolver: zodResolver(require("@/lib/validations/settings").updateSettingSchema),
    defaultValues: {
      name: "",
      configs: {},
    },
  })

  const handleEdit = (setting: Setting) => {
    setEditingSetting(setting)
    form.reset({
      name: setting.name,
      configs: setting.configs || {},
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = (data: UpdateSettingInput) => {
    if (!editingSetting) return

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
    }
    return descriptions[name] || "Configure this setting"
  }

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
          ) : settings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No settings found
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {settings.map((setting) => (
                <Card key={setting.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {getSettingDisplayName(setting.name)}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {getSettingDescription(setting.name)}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(setting)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {setting.name === "general" && generalSettings && (
                        <>
                          {generalSettings.logoUrl && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Logo:</span>
                              <img
                                src={generalSettings.logoUrl}
                                alt="Logo"
                                className="h-8 w-8 object-contain"
                              />
                            </div>
                          )}
                          {generalSettings.currency && (
                            <div>
                              <span className="text-muted-foreground">Currency: </span>
                              <span className="font-medium">
                                {generalSettings.currency.symbol} ({generalSettings.currency.code})
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
                              <span className="text-muted-foreground">Tax Name: </span>
                              <span className="font-medium">{taxSettings.name}</span>
                            </div>
                          )}
                          {taxSettings.rate !== undefined && (
                            <div>
                              <span className="text-muted-foreground">Tax Rate: </span>
                              <span className="font-medium">{taxSettings.rate}%</span>
                            </div>
                          )}
                        </>
                      )}
                      {setting.name === "invoice" && invoiceSettings && (
                        <>
                          <div>
                            <span className="text-muted-foreground">Prefix: </span>
                            <span className="font-medium">{invoiceSettings.prefix}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Start Number: </span>
                            <span className="font-medium">{invoiceSettings.startNumber}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Layout: </span>
                            <span className="font-medium">{invoiceSettings.layout}</span>
                          </div>
                        </>
                      )}
                      {(setting.name === "email" || setting.name === "sms") && (
                        <div className="text-muted-foreground">
                          Click edit to configure
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                                onClick={() => setIsMediaDialogOpen(true)}
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
                  <div className="grid grid-cols-2 gap-4">
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
                        <FormLabel>Timezone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Asia/Kolkata" />
                        </FormControl>
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
                            <SelectItem value="pos-80mm">POS 80mm</SelectItem>
                            <SelectItem value="pos-a4">A4</SelectItem>
                            <SelectItem value="pos-58mm">58mm</SelectItem>
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
                  <div className="grid grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-2 gap-4">
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
                      <div className="grid grid-cols-2 gap-4">
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
                      <div className="grid grid-cols-2 gap-4">
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
        open={isMediaDialogOpen}
        onOpenChange={setIsMediaDialogOpen}
        type="image"
        multiple={false}
        onSelect={(media) => {
          const selectedMedia = Array.isArray(media) ? media[0] : media
          const logoUrl = selectedMedia.secureUrl || selectedMedia.url
          form.setValue("configs.logoUrl", logoUrl)
          setIsMediaDialogOpen(false)
        }}
      />
    </PageLayout>
  )
}
