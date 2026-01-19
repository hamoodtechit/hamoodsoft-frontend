"use client"

import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAssignUserToRole } from "@/lib/hooks/use-roles"
import { assignUserToRoleSchema, type AssignUserToRoleInput } from "@/lib/validations/roles"
import { Role, User } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, UserPlus } from "lucide-react"
import { useForm } from "react-hook-form"

interface AssignUserDialogProps {
  role: Role | null
  users: User[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssignUserDialog({
  role,
  users = [],
  open,
  onOpenChange,
}: AssignUserDialogProps) {
  const assignUserMutation = useAssignUserToRole()

  const form = useForm<AssignUserToRoleInput>({
    resolver: zodResolver(assignUserToRoleSchema),
    defaultValues: {
      userId: "",
    },
  })

  const onSubmit = (data: AssignUserToRoleInput) => {
    if (role) {
      assignUserMutation.mutate(
        {
          roleId: role.id,
          data,
        },
        {
          onSuccess: () => {
            onOpenChange(false)
            form.reset()
          },
        }
      )
    }
  }

  const isLoading = assignUserMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Assign User to Role</DialogTitle>
              <DialogDescription>
                Assign a user to the role "{role?.name}"
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(users) && users.length > 0 ? (
                        users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-users" disabled>
                          No users available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
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
                    Assigning...
                  </>
                ) : (
                  "Assign User"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
