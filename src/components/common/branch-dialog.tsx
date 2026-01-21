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
import { Input } from "@/components/ui/input"
import { useCreateBranch, useUpdateBranch } from "@/lib/hooks/use-branches"
import {
  createBranchSchema,
  type CreateBranchInput,
  type UpdateBranchInput,
  updateBranchSchema,
} from "@/lib/validations/branches"
import { Branch } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

interface BranchDialogProps {
  branch: Branch | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BranchDialog({ branch, open, onOpenChange }: BranchDialogProps) {
  const tCommon = useTranslations("common")
  const createBranchMutation = useCreateBranch()
  const updateBranchMutation = useUpdateBranch()

  const isEdit = !!branch
  const form = useForm<CreateBranchInput | UpdateBranchInput>({
    resolver: zodResolver(isEdit ? updateBranchSchema : createBranchSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
    },
  })

  // Update form when branch changes
  useEffect(() => {
    if (branch) {
      form.reset({
        name: branch.name || "",
        address: branch.address || "",
        phone: branch.phone || "",
      })
    } else {
      form.reset({
        name: "",
        address: "",
        phone: "",
      })
    }
  }, [branch, form])

  const onSubmit = (data: CreateBranchInput | UpdateBranchInput) => {
    if (isEdit && branch) {
      updateBranchMutation.mutate(
        {
          id: branch.id,
          data: data as UpdateBranchInput,
        },
        {
          onSuccess: () => {
            onOpenChange(false)
            form.reset()
          },
        }
      )
    } else {
      createBranchMutation.mutate(data as CreateBranchInput, {
        onSuccess: () => {
          onOpenChange(false)
          form.reset()
        },
      })
    }
  }

  const isLoading = createBranchMutation.isPending || updateBranchMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{isEdit ? "Edit Branch" : "Create Branch"}</DialogTitle>
              <DialogDescription>
                {isEdit
                  ? "Update branch details"
                  : "Create a new branch for your business"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Branch Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter branch name"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter branch address"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter phone number"
                      disabled={isLoading}
                    />
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
                  isEdit ? "Update Branch" : "Create Branch"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
