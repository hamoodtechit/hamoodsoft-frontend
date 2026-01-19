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
import { useCreateRole, useUpdateRole } from "@/lib/hooks/use-roles"
import {
  createRoleSchema,
  type CreateRoleInput,
  type UpdateRoleInput,
  updateRoleSchema,
} from "@/lib/validations/roles"
import { Role } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Shield } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

interface RoleDialogProps {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RoleDialog({ role, open, onOpenChange }: RoleDialogProps) {
  const createRoleMutation = useCreateRole()
  const updateRoleMutation = useUpdateRole()

  const isEdit = !!role
  const form = useForm<CreateRoleInput | UpdateRoleInput>({
    resolver: zodResolver(isEdit ? updateRoleSchema : createRoleSchema),
    defaultValues: {
      name: "",
      permissions: [],
    },
  })

  // Update form when role changes
  useEffect(() => {
    if (role) {
      form.reset({
        name: role.name || "",
        permissions: role.permissions || [],
      })
    } else {
      form.reset({
        name: "",
        permissions: [],
      })
    }
  }, [role, form])

  const onSubmit = (data: CreateRoleInput | UpdateRoleInput) => {
    if (isEdit && role) {
      updateRoleMutation.mutate(
        {
          id: role.id,
          data: data as UpdateRoleInput,
        },
        {
          onSuccess: () => {
            onOpenChange(false)
            form.reset()
          },
        }
      )
    } else {
      createRoleMutation.mutate(data as CreateRoleInput, {
        onSuccess: () => {
          onOpenChange(false)
          form.reset()
        },
      })
    }
  }

  const isLoading = createRoleMutation.isPending || updateRoleMutation.isPending

  const selectedPermissions = form.watch("permissions") || []

  const togglePermission = (permission: string) => {
    const current = selectedPermissions
    const newPermissions = current.includes(permission)
      ? current.filter((p) => p !== permission)
      : [...current, permission]
    form.setValue("permissions", newPermissions as any)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
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
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEdit ? "Updating..." : "Creating..."}
                  </>
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
