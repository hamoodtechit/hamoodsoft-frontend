"use client"

import { CreateUserDialog } from "@/components/common/create-user-dialog"
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog"
import { EditUserDialog } from "@/components/common/edit-user-dialog"
import { PageLayout } from "@/components/common/page-layout"
import { PermissionGuard } from "@/components/common/permission-guard"
import { ResetPasswordDialog } from "@/components/common/reset-password-dialog"
import { SkeletonList } from "@/components/skeletons/skeleton-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { useRemoveUser, useUsers } from "@/lib/hooks/use-users"
import { User } from "@/types"
import { KeyRound, MoreVertical, Pencil, Plus, Trash2, Users } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function TeamPage() {
  const t = useTranslations("team")
  const tCommon = useTranslations("common")
  const tSettings = useTranslations("settings")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const currentBusiness = useCurrentBusiness()
  const { data: users = [], isLoading } = useUsers()
  const removeUserMutation = useRemoveUser()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userToRemove, setUserToRemove] = useState<User | null>(null)

  // Check if user has a business
  useEffect(() => {
    if (!currentBusiness) {
      router.push(`/${locale}/dashboard`)
    }
  }, [currentBusiness, locale, router])

  if (!currentBusiness) {
    return (
      <PageLayout title={tSettings("accessDenied")} description={tSettings("selectBusiness")}>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              {tSettings("selectBusinessDescription")}
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  const isOwner = (user: User) => currentBusiness.ownerId === user.id

  const handleCreate = () => {
    setIsCreateDialogOpen(true)
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setIsEditDialogOpen(true)
  }

  const handleResetPassword = (user: User) => {
    setSelectedUser(user)
    setIsResetPasswordDialogOpen(true)
  }

  const handleRemove = (user: User) => {
    setUserToRemove(user)
    setIsRemoveDialogOpen(true)
  }

  const confirmRemove = () => {
    if (userToRemove) {
      removeUserMutation.mutate(userToRemove.id, {
        onSuccess: () => {
          setIsRemoveDialogOpen(false)
          setUserToRemove(null)
        },
      })
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <PermissionGuard
      permission="user:manage"
      fallback={
        <PageLayout title={tSettings("accessDenied")} description={tSettings("selectBusiness")}>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                {tSettings("selectBusinessDescription")}
              </p>
            </CardContent>
          </Card>
        </PageLayout>
      }
    >
    <PageLayout
      title={t("title")}
      description={t("description")}
      maxWidth="full"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>{t("title")}</CardTitle>
                <CardDescription>
                  {users.length > 0
                    ? users.length === 1
                      ? t("memberCount", { count: users.length })
                      : t("memberCountPlural", { count: users.length })
                    : t("description")}
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t("addMember")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonList count={5} />
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("noMembers")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("noMembersDescription")}
              </p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t("addMember")}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                      {member.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{member.name}</p>
                        {isOwner(member) && (
                          <Badge variant="default" className="text-xs shrink-0">
                            {t("owner")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                    </div>

                    {/* Role */}
                    <div className="hidden sm:block shrink-0">
                      {member.role ? (
                        <Badge variant="secondary" className="text-xs">
                          {member.role.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t("noRole")}</span>
                      )}
                    </div>

                    {/* Joined */}
                    <div className="hidden md:block shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {t("joinedDate")}: {formatDate(member.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 ml-2">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(member)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {tCommon("edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleResetPassword(member)}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        {t("resetPassword")}
                      </DropdownMenuItem>
                      {!isOwner(member) && (
                        <DropdownMenuItem
                          onClick={() => handleRemove(member)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("removeMember")}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      <EditUserDialog
        user={selectedUser}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        isOwner={selectedUser ? isOwner(selectedUser) : false}
      />

      <ResetPasswordDialog
        user={selectedUser}
        open={isResetPasswordDialogOpen}
        onOpenChange={setIsResetPasswordDialogOpen}
      />

      <DeleteConfirmationDialog
        open={isRemoveDialogOpen}
        onOpenChange={setIsRemoveDialogOpen}
        onConfirm={confirmRemove}
        title={t("removeConfirmTitle")}
        description={t("removeConfirmDescription", { name: userToRemove?.name || "" })}
        isLoading={removeUserMutation.isPending}
      />
    </PageLayout>
    </PermissionGuard>
  )
}
