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
import { Camera, Loader2, Mail, Save, Shield, User } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"

export default function ProfilePage() {
  const t = useTranslations("common")
  const tProfile = useTranslations("profile")
  const { user, isLoading: isLoadingUser } = useAuth()
  const updateUserMutation = useUpdateUser()
  
  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  
  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [isLoading2FA, setIsLoading2FA] = useState(false)

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
    // Set avatar preview if user has avatar
    if (user?.avatar) {
      setAvatarPreview(user.avatar)
    }
  }, [user, form])

  const onSubmit = (data: UpdateUserInput) => {
    updateUserMutation.mutate(data)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // TODO: Integrate with backend API when ready
      // For now, just show preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setIsUploadingAvatar(true)
      
      // Simulate API call - replace with actual API integration
      setTimeout(() => {
        setIsUploadingAvatar(false)
        // TODO: Call API to upload avatar
        // await usersApi.uploadAvatar(file)
      }, 1000)
    }
  }

  const handleToggle2FA = async () => {
    // TODO: Integrate with backend API when ready
    setIsLoading2FA(true)
    try {
      // await authApi.toggleTwoFactor(!twoFactorEnabled)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setTwoFactorEnabled(!twoFactorEnabled)
    } catch (error) {
      console.error("Failed to toggle 2FA:", error)
    } finally {
      setIsLoading2FA(false)
    }
  }

  if (isLoadingUser) {
    return (
      <PageLayout
        title={tProfile("title")}
        description={tProfile("description")}
        maxWidth="full"
      >
        <div className="space-y-6 w-full">
          {/* Profile Information Card Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Profile Picture Section Skeleton */}
              <div className="flex items-center gap-6 pb-6 mb-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-10 w-40" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>

              {/* Form Fields Skeleton */}
              <div className="space-y-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-3 w-40" />
                </div>

                {/* User ID Field */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-3 w-48" />
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication Card Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-56" />
                  <Skeleton className="h-4 w-72" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-80 mt-2" />
                </div>
                <Skeleton className="h-10 w-32" />
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={tProfile("title")}
      description={tProfile("description")}
      maxWidth="full"
    >
      <div className="space-y-6 w-full">
        {/* Profile Information Card */}
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
            {/* Profile Picture Section */}
            <div className="flex items-center gap-6 pb-6 mb-6">
              {/* Avatar Preview */}
              <div className="relative group">
                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-2 ring-primary/20">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
                {/* Camera Icon Overlay on Hover */}
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="h-6 w-6 text-white" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={isUploadingAvatar}
                />
              </div>

              {/* Upload Button */}
              <div className="flex-1">
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploadingAvatar}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {avatarPreview ? tProfile("changePicture") : tProfile("uploadPicture")}
                  </Button>
                </Label>
                <p className="text-xs text-muted-foreground mt-2">
                  {tProfile("avatarUploadHint")}
                </p>
                <p className="text-xs text-muted-foreground text-blue-600 dark:text-blue-400 mt-1">
                  {tProfile("apiPending")}
                </p>
              </div>
            </div>

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
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span>
                        {t("loading")}
                      </span>
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

        {/* Two-Factor Authentication Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <CardTitle>{tProfile("twoFactorAuth")}</CardTitle>
                <CardDescription>
                  {tProfile("twoFactorDescription")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {twoFactorEnabled ? tProfile("twoFactorEnabled") : tProfile("twoFactorDisabled")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {twoFactorEnabled
                    ? tProfile("twoFactorEnabledDescription")
                    : tProfile("twoFactorDisabledDescription")}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  {tProfile("apiPending")}
                </p>
              </div>
              <Button
                type="button"
                variant={twoFactorEnabled ? "destructive" : "default"}
                onClick={handleToggle2FA}
                disabled={isLoading2FA}
              >
                {isLoading2FA ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    {t("loading")}
                  </span>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    {twoFactorEnabled ? tProfile("disable2FA") : tProfile("enable2FA")}
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
