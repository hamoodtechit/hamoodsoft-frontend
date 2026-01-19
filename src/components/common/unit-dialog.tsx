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
import { useCreateUnit, useUpdateUnit } from "@/lib/hooks/use-units"
import {
  createUnitSchema,
  type CreateUnitInput,
  type UpdateUnitInput,
  updateUnitSchema,
} from "@/lib/validations/units"
import { Unit } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Ruler } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

interface UnitDialogProps {
  unit: Unit | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UnitDialog({ unit, open, onOpenChange }: UnitDialogProps) {
  const createUnitMutation = useCreateUnit()
  const updateUnitMutation = useUpdateUnit()

  const isEdit = !!unit
  const form = useForm<CreateUnitInput | UpdateUnitInput>({
    resolver: zodResolver(isEdit ? updateUnitSchema : createUnitSchema),
    defaultValues: {
      name: "",
      suffix: "",
    },
  })

  // Update form when unit changes
  useEffect(() => {
    if (unit) {
      form.reset({
        name: unit.name || "",
        suffix: unit.suffix || "",
      })
    } else {
      form.reset({
        name: "",
        suffix: "",
      })
    }
  }, [unit, form])

  const onSubmit = (data: CreateUnitInput | UpdateUnitInput) => {
    if (isEdit && unit) {
      updateUnitMutation.mutate(
        {
          id: unit.id,
          data: data as UpdateUnitInput,
        },
        {
          onSuccess: () => {
            onOpenChange(false)
            form.reset()
          },
        }
      )
    } else {
      createUnitMutation.mutate(data as CreateUnitInput, {
        onSuccess: () => {
          onOpenChange(false)
          form.reset()
        },
      })
    }
  }

  const isLoading = createUnitMutation.isPending || updateUnitMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Ruler className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{isEdit ? "Edit Unit" : "Create Unit"}</DialogTitle>
              <DialogDescription>
                {isEdit ? "Update unit details" : "Create a new measurement unit"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Unit Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Kilogram"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Unit Suffix */}
            <FormField
              control={form.control}
              name="suffix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Suffix</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., kg"
                      disabled={isLoading}
                      maxLength={10}
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
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEdit ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  isEdit ? "Update Unit" : "Create Unit"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
