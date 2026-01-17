"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { useSelectApps } from "@/lib/hooks/use-apps"
import { selectAppsSchema, type SelectAppsInput } from "@/lib/validations/apps"
import { zodResolver } from "@hookform/resolvers/zod"
import { availableApps } from "@/constants/apps"
import { ArrowRight, Check, Grid3x3 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { cn } from "@/lib/utils"

export default function SelectAppsPage() {
  const params = useParams()
  const locale = params?.locale || "en"

  return (
    <ProtectedRoute redirectTo={`/${locale}/login`}>
      <SelectAppsContent />
    </ProtectedRoute>
  )
}

function SelectAppsContent() {
  const t = useTranslations("apps")
  const tCommon = useTranslations("common")
  const selectAppsMutation = useSelectApps()

  const form = useForm<SelectAppsInput>({
    resolver: zodResolver(selectAppsSchema),
    defaultValues: {
      apps: [],
    },
  })

  const selectedApps = form.watch("apps")

  const toggleApp = (appId: string) => {
    const currentApps = form.getValues("apps")
    if (currentApps.includes(appId)) {
      form.setValue(
        "apps",
        currentApps.filter((id) => id !== appId)
      )
    } else {
      form.setValue("apps", [...currentApps, appId])
    }
  }

  const onSubmit = (data: SelectAppsInput) => {
    selectAppsMutation.mutate(data)
  }

  // Group apps by category
  const appsByCategory = {
    management: availableApps.filter((app) => app.category === "management"),
    modules: availableApps.filter((app) => app.category === "modules"),
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-4 shadow-lg">
            <Grid3x3 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("selectApps")}
          </h1>
          <p className="text-muted-foreground mt-2">{t("selectAppsDescription")}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} suppressHydrationWarning>
            <div className="space-y-8">
              {/* Management Apps */}
              {appsByCategory.management.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">
                    {t("managementApps")}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {appsByCategory.management.map((app) => {
                      const Icon = app.icon
                      const isSelected = selectedApps.includes(app.id)
                      return (
                        <Card
                          key={app.id}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-lg border-2",
                            isSelected
                              ? "border-primary bg-primary/5 shadow-md"
                              : "border-border hover:border-primary/50"
                          )}
                          onClick={() => toggleApp(app.id)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "p-2 rounded-lg",
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted"
                                  )}
                                >
                                  <Icon className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-lg">
                                  {app.name}
                                </CardTitle>
                              </div>
                              {isSelected && (
                                <div className="flex-shrink-0">
                                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="h-4 w-4 text-primary-foreground" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <CardDescription className="text-sm">
                              {app.description}
                            </CardDescription>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Module Apps */}
              {appsByCategory.modules.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">
                    {t("moduleApps")}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {appsByCategory.modules.map((app) => {
                      const Icon = app.icon
                      const isSelected = selectedApps.includes(app.id)
                      return (
                        <Card
                          key={app.id}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-lg border-2",
                            isSelected
                              ? "border-primary bg-primary/5 shadow-md"
                              : "border-border hover:border-primary/50"
                          )}
                          onClick={() => toggleApp(app.id)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "p-2 rounded-lg",
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted"
                                  )}
                                >
                                  <Icon className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-lg">
                                  {app.name}
                                </CardTitle>
                              </div>
                              {isSelected && (
                                <div className="flex-shrink-0">
                                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="h-4 w-4 text-primary-foreground" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <CardDescription className="text-sm">
                              {app.description}
                            </CardDescription>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Validation error message */}
              <FormField
                control={form.control}
                name="apps"
                render={() => (
                  <FormItem>
                    <FormMessage className="text-center" />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <Button
                  type="submit"
                  className="min-w-[200px] h-11 text-base font-semibold shadow-md hover:shadow-lg transition-shadow"
                  disabled={selectAppsMutation.isPending}
                >
                  {selectAppsMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      {tCommon("loading")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {t("continueToDashboard")}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
