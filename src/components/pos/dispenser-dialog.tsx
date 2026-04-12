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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useTankers } from "@/lib/hooks/use-tankers"
import { useCreateDispenser, useUpdateDispenser } from "@/lib/hooks/use-dispensers"
import { Dispenser } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  branchId: z.string().min(1, "Branch is required"),
  tankerId: z.string().min(1, "Tanker is required"),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]).default("ACTIVE"),
})

interface DispenserDialogProps {
  dispenser?: Dispenser | null
  open: boolean
  onOpenChange: (open: boolean) => void
  branches: { id: string; name: string }[]
}

export function DispenserDialog({ dispenser, open, onOpenChange, branches }: DispenserDialogProps) {
  const isEditing = !!dispenser
  const createMutation = useCreateDispenser()
  const updateMutation = useUpdateDispenser()
  const { data: tankersData = { items: [] } } = useTankers({ limit: 100 })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      branchId: "",
      tankerId: "",
      status: "ACTIVE",
    },
  })

  useEffect(() => {
    if (dispenser) {
      form.reset({
        name: dispenser.name,
        branchId: dispenser.branchId,
        tankerId: dispenser.tankerId,
        status: dispenser.status,
      })
    } else {
      form.reset({
        name: "",
        branchId: "",
        tankerId: "",
        status: "ACTIVE",
      })
    }
  }, [dispenser, form, open])

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditing) {
      updateMutation.mutate(
        { id: dispenser.id, data: values },
        {
          onSuccess: () => {
            onOpenChange(false)
          },
        }
      )
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          onOpenChange(false)
        },
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Dispenser" : "Create Dispenser"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of your fuel dispenser."
              : "Add a new fuel dispenser to your station."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dispenser Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Pump 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tankerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanker</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tanker" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tankersData.items.map((tanker) => (
                          <SelectItem key={tanker.id} value={tanker.id}>
                            {tanker.name} ({tanker.fuelType?.name || "Unknown"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
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
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
