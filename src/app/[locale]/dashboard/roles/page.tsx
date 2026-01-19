"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RoleDialog } from "@/components/common/role-dialog"
import { AssignUserDialog } from "@/components/common/assign-user-dialog"
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageLayout } from "@/components/common/page-layout"
import { SkeletonList } from "@/components/skeletons/skeleton-list"
import { useRoles, useDeleteRole } from "@/lib/hooks/use-roles"
import { useUsers } from "@/lib/hooks/use-users"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { Role } from "@/types"
import { Shield, MoreVertical, Plus, Trash2, Pencil, UserPlus } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

export default function RolesPage() {
  const t = useTranslations("roles")
  const tCommon = useTranslations("common")
  const tSettings = useTranslations("settings")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const currentBusiness = useCurrentBusiness()
  const { data: roles = [], isLoading } = useRoles()
  const { data: users = [] } = useUsers()
  const deleteRoleMutation = useDeleteRole()
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)

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

  const handleCreate = () => {
    setSelectedRole(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (role: Role) => {
    setSelectedRole(role)
    setIsDialogOpen(true)
  }

  const handleAssignUser = (role: Role) => {
    setSelectedRole(role)
    setIsAssignDialogOpen(true)
  }

  const handleDelete = (role: Role) => {
    setRoleToDelete(role)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (roleToDelete) {
      deleteRoleMutation.mutate(roleToDelete.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false)
          setRoleToDelete(null)
        },
      })
    }
  }

  return (
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
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>{t("title")}</CardTitle>
                <CardDescription>
                  {t("description")}
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t("createRole")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonList count={5} />
          ) : roles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("noRoles")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("noRolesDescription")}
              </p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createRole")}
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => (
                <Card key={role.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{role.name}</CardTitle>
                        <CardDescription className="mt-2">
                          {role.permissions && role.permissions.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {role.permissions.length === 1 
                                  ? t("permissionsCount", { count: role.permissions.length })
                                  : t("permissionsCountPlural", { count: role.permissions.length })}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">{t("noPermissions")}</span>
                          )}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(role)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {tCommon("edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAssignUser(role)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            {t("assignUser")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(role)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {tCommon("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  {role.permissions && role.permissions.length > 0 && (
                    <CardContent>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          {t("permissions")}:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 5).map((permission) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                          {role.permissions.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              {t("morePermissions", { count: role.permissions.length - 5 })}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RoleDialog
        role={selectedRole}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

      <AssignUserDialog
        role={selectedRole}
        users={users || []}
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
      />

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDescription", { name: roleToDelete?.name || "" })}
        isLoading={deleteRoleMutation.isPending}
      />
    </PageLayout>
  )
}
