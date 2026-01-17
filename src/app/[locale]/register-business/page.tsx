"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useBusinesses } from "@/lib/hooks/use-business"
import { useAuthStore } from "@/store"
import { useRouter } from "next/navigation"
import {
  createBusinessSchema,
  type CreateBusinessInput,
} from "@/lib/validations/business"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Building2 } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useForm } from "react-hook-form"

export default function RegisterBusinessPage() {
  const params = useParams()
  const locale = params?.locale || "en"

  return (
    <ProtectedRoute redirectTo={`/${locale}/login`}>
      <RegisterBusinessContent />
    </ProtectedRoute>
  )
}

function RegisterBusinessContent() {
  const t = useTranslations("business")
  const tCommon = useTranslations("common")
  const params = useParams()
  const router = useRouter()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale || "en"
  const { user } = useAuthStore()
  const { data: businesses } = useBusinesses()
  const hasExistingBusinesses = businesses && businesses.length > 0

  const form = useForm<CreateBusinessInput>({
    resolver: zodResolver(createBusinessSchema),
    defaultValues: {
      name: "",
    },
  })

  const onSubmit = (data: CreateBusinessInput) => {
    // Store business name in sessionStorage to pass to select-modules page
    // sessionStorage is synchronous, so it's safe to navigate immediately
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pendingBusinessName", data.name)
    }
    // Redirect to select-modules page
    router.push(`/${locale}/select-modules`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full max-w-md">
        {/* Back to Dashboard Link (if user has existing businesses) */}
        {hasExistingBusinesses && (
          <div className="mb-4">
            <Link
              href={`/${locale}/dashboard`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
              Back to Dashboard
            </Link>
          </div>
        )}
        
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {hasExistingBusinesses ? t("createNewBusiness") : t("registerBusiness")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {hasExistingBusinesses 
              ? t("createNewBusinessDescription") 
              : t("registerDescription")}
          </p>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center">
              {t("businessInformation")}
            </CardTitle>
            <CardDescription className="text-center">
              {t("businessDescription")}
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              suppressHydrationWarning
            >
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {t("businessName")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("businessNamePlaceholder")}
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="pt-4">
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-shadow"
                >
                  <span className="flex items-center gap-2">
                    {t("continue")}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  )
}
