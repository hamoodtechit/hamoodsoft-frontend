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
import { Switch } from "@/components/ui/switch"
import { useCreateFuelType, useUpdateFuelType } from "@/lib/hooks/use-fuel-types"
import { FuelType } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.preprocess((val) => Number(val), z.number().min(0, "Price must be positive")),
  costPrice: z.preprocess((val) => Number(val), z.number().min(0, "Cost price must be positive")),
})

interface FuelTypeDialogProps {
  fuelType?: FuelType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FuelTypeDialog({ fuelType, open, onOpenChange }: FuelTypeDialogProps) {
  const isEditing = !!fuelType
  const createMutation = useCreateFuelType()
  const updateMutation = useUpdateFuelType()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price: 0,
      costPrice: 0,
    },
  })

  useEffect(() => {
    if (fuelType) {
      form.reset({
        name: fuelType.name,
        price: fuelType.price,
        costPrice: fuelType.costPrice ?? 0,
      })
    } else {
      form.reset({
        name: "",
        price: 0,
        costPrice: 0,
      })
    }
  }, [fuelType, form, open])

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditing && fuelType) {
      updateMutation.mutate({ id: fuelType.id, data: values }, {
        onSuccess: () => {
          onOpenChange(false)
        },
      })
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Fuel Type" : "Create Fuel Type"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of your fuel type."
              : "Add a new fuel type to your station."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Diesel, Petrol, Octane" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selling Price per Liter</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="costPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost/Purchase Price per Liter</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
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
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

