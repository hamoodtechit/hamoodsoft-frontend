"use client"

import { PageLayout } from "@/components/common/page-layout"
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
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/hooks/use-auth"
import { useUpdateUser } from "@/lib/hooks/use-users"
import { updateUserSchema, type UpdateUserInput } from "@/lib/validations/users"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Mail, Save, User } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

export default function ProfilePage() {
  const t = useTranslations("common")
  const tProfile = useTranslations("profile")
  const { user, isLoading: isLoadingUser } = useAuth()
  const updateUserMutation = useUpdateUser()

  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: "",
    },
  })

  // Update form when user data loads
  useEffect(() => {
    if (user?.name) {
      form.reset({
        name: user.name,
      })
    }
  }, [user, form])

  const onSubmit = (data: UpdateUserInput) => {
    updateUserMutation.mutate(data)
  }

  if (isLoadingUser) {
    return (
      <PageLayout
        title={tProfile("title")}
        description={tProfile("description")}
      >
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={tProfile("title")}
      description={tProfile("description")}
    >
      <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>{tProfile("profileInformation")}</CardTitle>
                <CardDescription>
                  {tProfile("updateProfileDescription")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Name Field */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tProfile("name")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            placeholder={tProfile("namePlaceholder")}
                            className="pl-9"
                            disabled={updateUserMutation.isPending}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email Field (Read-only) */}
                <div className="space-y-2">
                  <Label>{tProfile("email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={user?.email || ""}
                      disabled
                      className="pl-9 bg-muted cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tProfile("emailCannotBeChanged")}
                  </p>
                </div>

                {/* User ID (Read-only) */}
                <div className="space-y-2">
                  <Label>{tProfile("userId")}</Label>
                  <Input
                    value={user?.id || ""}
                    disabled
                    className="bg-muted cursor-not-allowed font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {tProfile("userIdDescription")}
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={updateUserMutation.isPending || !form.formState.isDirty}
                    className="min-w-32"
                  >
                    {updateUserMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {tProfile("saving")}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {tProfile("saveChanges")}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
    </PageLayout>
  )
}
