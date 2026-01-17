"use client"

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
import { useResetPassword } from "@/lib/hooks/use-auth"
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, CheckCircle2, KeyRound, Lock } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

export default function ResetPasswordPage() {
  const t = useTranslations("auth")
  const tCommon = useTranslations("common")
  const searchParams = useSearchParams()
  const params = useParams()
  const locale = params.locale as string
  const resetPasswordMutation = useResetPassword()

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
      token: "",
    },
  })

  // Get token from URL query parameter
  useEffect(() => {
    const token = searchParams.get("token")
    if (token) {
      form.setValue("token", token)
    }
  }, [searchParams, form])

  const onSubmit = (data: ResetPasswordInput) => {
    resetPasswordMutation.mutate(data)
  }

  const token = searchParams.get("token")

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="w-full max-w-md">
          <Card className="border-2 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-4 mx-auto">
                <KeyRound className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold text-center">
                Invalid Link
              </CardTitle>
              <CardDescription className="text-center">
                The reset password link is invalid or missing a token.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href={`/${locale}/forgot-password`} className="w-full">
                <Button variant="outline" className="w-full h-11">
                  Request New Link
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-4 shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">New Password</h1>
          <p className="text-muted-foreground mt-2">
            Enter your new password below
          </p>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center">
              Reset Password
            </CardTitle>
            <CardDescription className="text-center">
              Choose a strong password for your account
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} suppressHydrationWarning>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        {t("password")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="h-11"
                          {...field}
                          disabled={resetPasswordMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        {t("confirmPassword")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="h-11"
                          {...field}
                          disabled={resetPasswordMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pt-4">
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-shadow"
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      {tCommon("loading")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Reset Password
                    </span>
                  )}
                </Button>
                <Link
                  href={`/${locale}/login`}
                  className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Link>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  )
}
