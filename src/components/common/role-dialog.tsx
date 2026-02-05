"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { permissionGroups } from "@/constants/permissions"
import { useBranches } from "@/lib/hooks/use-branches"
import { useCreateRole, useUpdateRole } from "@/lib/hooks/use-roles"
import {
  createRoleSchema,
  type CreateRoleInput,
  normalizePermission,
  type UpdateRoleInput,
  updateRoleSchema,
} from "@/lib/validations/roles"
import { Role } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { Shield } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

interface RoleDialogProps {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RoleDialog({ role, open, onOpenChange }: RoleDialogProps) {
  const tCommon = useTranslations("common")
  const createRoleMutation = useCreateRole()
  const updateRoleMutation = useUpdateRole()
  const { data: branches = [] } = useBranches()

  const isEdit = !!role
  const form = useForm<CreateRoleInput | UpdateRoleInput>({
    resolver: zodResolver(isEdit ? updateRoleSchema : createRoleSchema),
    defaultValues: {
      name: "",
      permissions: [],
      allowedBranchIds: [],
    },
  })

  // Permission pattern for validation
  const permissionPattern = /^[a-z_]+:[a-z_]+$/

  // Update form when role changes
  useEffect(() => {
    if (role) {
      // Normalize permissions when loading role for editing
      const normalizedPermissions = (role.permissions || [])
        .map(normalizePermission)
        .filter((p) => permissionPattern.test(p))
        .filter((p, index, arr) => arr.indexOf(p) === index) // Remove duplicates
      
      form.reset({
        name: role.name || "",
        permissions: normalizedPermissions,
        allowedBranchIds: role.allowedBranchIds || [],
      })
    } else {
      form.reset({
        name: "",
        permissions: [],
        allowedBranchIds: [],
      })
    }
  }, [role, form])

  const onSubmit = (data: CreateRoleInput | UpdateRoleInput) => {
    // Permissions are already normalized by zod schema transform
    // But we ensure they're clean here as well
    const normalizedData = {
      ...data,
      permissions: (data.permissions || [])
        .filter((p) => typeof p === "string" && p.length > 0)
        .filter((p, index, arr) => arr.indexOf(p) === index), // Remove duplicates
    }
    
    if (isEdit && role) {
      updateRoleMutation.mutate(
        {
          id: role.id,
          data: normalizedData as UpdateRoleInput,
        },
        {
          onSuccess: () => {
            onOpenChange(false)
            form.reset()
          },
        }
      )
    } else {
      createRoleMutation.mutate(normalizedData as CreateRoleInput, {
        onSuccess: () => {
          onOpenChange(false)
          form.reset()
        },
      })
    }
  }

  const isLoading = createRoleMutation.isPending || updateRoleMutation.isPending

  const selectedPermissions = form.watch("permissions") || []
  const selectedBranchIds = form.watch("allowedBranchIds") || []

  const togglePermission = (permission: string) => {
    const current = selectedPermissions
    const newPermissions = current.includes(permission)
      ? current.filter((p) => p !== permission)
      : [...current, permission]
    form.setValue("permissions", newPermissions as any)
  }

  const toggleBranch = (branchId: string) => {
    const current = selectedBranchIds
    const newBranchIds = current.includes(branchId)
      ? current.filter((id) => id !== branchId)
      : [...current, branchId]
    form.setValue("allowedBranchIds", newBranchIds)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{isEdit ? "Edit Role" : "Create Role"}</DialogTitle>
              <DialogDescription>
                {isEdit ? "Update role and permissions" : "Create a new role with permissions"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Role Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Manager, Supervisor"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Allowed Branches */}
            <FormField
              control={form.control}
              name="allowedBranchIds"
              render={() => (
                <FormItem>
                  <FormLabel>Allowed Branches (Optional)</FormLabel>
                  <FormControl>
                    <div className="rounded-md border p-3">
                      {branches.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">No branches available</p>
                      ) : (
                        <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2">
                          {branches.map((branch) => (
                            <div
                              key={branch.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`branch-${branch.id}`}
                                checked={selectedBranchIds.includes(branch.id)}
                                onCheckedChange={() => toggleBranch(branch.id)}
                                disabled={isLoading}
                              />
                              <label
                                htmlFor={`branch-${branch.id}`}
                                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {branch.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to allow access to all branches. Select specific branches to restrict access.
                  </p>
                </FormItem>
              )}
            />

            {/* Permissions */}
            <FormField
              control={form.control}
              name="permissions"
              render={() => (
                <FormItem>
                  <FormLabel>Permissions</FormLabel>
                  <FormControl>
                    <ScrollArea className="h-[300px] rounded-md border p-4">
                      <div className="space-y-4">
                        {Object.entries(permissionGroups).map(([key, group]) => (
                          <div key={key} className="space-y-2">
                            <h4 className="text-sm font-medium">{group.label}</h4>
                            <div className="space-y-2 pl-4">
                              {group.permissions.map((permission) => (
                                <div
                                  key={permission.value}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={permission.value}
                                    checked={selectedPermissions.includes(permission.value)}
                                    onCheckedChange={() => togglePermission(permission.value)}
                                    disabled={isLoading}
                                  />
                                  <label
                                    htmlFor={permission.value}
                                    className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                  >
                                    {permission.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    {tCommon("loading")}
                  </span>
                ) : (
                  isEdit ? "Update Role" : "Create Role"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
