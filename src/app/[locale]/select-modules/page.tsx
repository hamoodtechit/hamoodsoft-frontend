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
} from "@/components/ui/form"
import { moduleDescriptions, moduleNames, modules } from "@/constants/modules"
import { useCreateBusiness } from "@/lib/hooks/use-business"
import { cn } from "@/lib/utils"
import { selectModulesSchema, type SelectModulesInput } from "@/lib/validations/modules"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Check, Grid3x3, Loader2, SkipForward } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"

export default function SelectModulesPage() {
  const params = useParams()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale || "en"

  return (
    <ProtectedRoute redirectTo={`/${locale}/login`}>
      <SelectModulesContent />
    </ProtectedRoute>
  )
}

function SelectModulesContent() {
  const t = useTranslations("modules")
  const tCommon = useTranslations("common")
  const params = useParams()
  const router = useRouter()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale || "en"
  const createBusinessMutation = useCreateBusiness()
  const [businessName, setBusinessName] = useState<string>("")
  const hasCheckedRef = useRef(false)

  // Get business name from sessionStorage (set in register-business page)
  useEffect(() => {
    if (typeof window !== "undefined" && !hasCheckedRef.current) {
      hasCheckedRef.current = true
      
      // Check for business name in sessionStorage
      const name = sessionStorage.getItem("pendingBusinessName")
      if (name) {
        setBusinessName(name)
        // Don't clear it here - clear it after business is created successfully
      } else {
        // If no name found, redirect back to register-business
        // Add a small delay to handle navigation timing
        setTimeout(() => {
          const retryName = sessionStorage.getItem("pendingBusinessName")
          if (!retryName) {
            router.push(`/${locale}/register-business`)
          } else {
            setBusinessName(retryName)
          }
        }, 50)
      }
    }
  }, [locale, router])

  const form = useForm<SelectModulesInput>({
    resolver: zodResolver(selectModulesSchema),
    defaultValues: {
      modules: [],
    },
  })

  const selectedModules = form.watch("modules")

  const toggleModule = (moduleId: string) => {
    const currentModules = form.getValues("modules")
    if (currentModules.includes(moduleId)) {
      form.setValue(
        "modules",
        currentModules.filter((id) => id !== moduleId)
      )
    } else {
      form.setValue("modules", [...currentModules, moduleId])
    }
  }

  const handleSkip = () => {
    // Clear any selected modules before creating business
    form.setValue("modules", [])
    // Create business with empty modules array (default modules will be used)
    createBusinessMutation.mutate({
      name: businessName,
      modules: [],
    })
  }

  const onSubmit = (data: SelectModulesInput) => {
    // Create business with selected modules
    createBusinessMutation.mutate({
      name: businessName,
      modules: data.modules || [],
    })
  }

  // Clear sessionStorage after business is created successfully
  useEffect(() => {
    if (createBusinessMutation.isSuccess) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("pendingBusinessName")
      }
    }
  }, [createBusinessMutation.isSuccess])

  // Show loading if business name not loaded yet
  if (!businessName) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">⏳</div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const isCreating = createBusinessMutation.isPending

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20 relative">
      {/* Loading Overlay */}
      {isCreating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{t("creatingBusiness")}</h3>
                <p className="text-muted-foreground text-sm">
                  {t("creatingBusinessDescription")}
                </p>
              </div>
              <div className="pt-4 space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t("settingUpModules")}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t("configuringSystem")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-4 shadow-lg">
            <Grid3x3 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("selectModules")}
          </h1>
          <p className="text-muted-foreground mt-2">{t("selectModulesDescription")}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} suppressHydrationWarning>
            <div className="space-y-8">
              {/* Modules Grid */}
              <div className={cn(
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
                isCreating && "opacity-50 pointer-events-none"
              )}>
                {modules.map((moduleId) => {
                  const isSelected = selectedModules.includes(moduleId)
                  return (
                    <Card
                      key={moduleId}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-lg border-2",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => toggleModule(moduleId)}
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
                              <Grid3x3 className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg">
                              {moduleNames[moduleId]}
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
                          {moduleDescriptions[moduleId]}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4 pt-4">
                {/* Skip Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="min-w-[150px] h-11 text-base font-semibold"
                  onClick={handleSkip}
                  disabled={createBusinessMutation.isPending}
                >
                  {createBusinessMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      {tCommon("loading")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <SkipForward className="w-4 h-4" />
                      {t("skip")}
                    </span>
                  )}
                </Button>

                {/* Continue Button */}
                <Button
                  type="submit"
                  className="min-w-[200px] h-11 text-base font-semibold shadow-md hover:shadow-lg transition-shadow"
                  disabled={createBusinessMutation.isPending}
                >
                  {createBusinessMutation.isPending ? (
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
