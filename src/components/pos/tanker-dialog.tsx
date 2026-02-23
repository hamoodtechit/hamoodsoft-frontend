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
import { useFuelTypes } from "@/lib/hooks/use-fuel-types"
import { useCreateTanker, useUpdateTanker } from "@/lib/hooks/use-tankers"
import { Tanker } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  capacity: z.preprocess((val) => Number(val), z.number().min(0, "Capacity must be positive")),
  fuelTypeId: z.string().min(1, "Fuel type is required"),
  tankerNumber: z.string().min(1, "Tanker number is required"),
  currentFuel: z.preprocess((val) => Number(val), z.number().min(0, "Current fuel must be positive")),
  pressure: z.preprocess((val) => Number(val), z.number()),
  temperature: z.preprocess((val) => Number(val), z.number()),
  location: z.string().min(1, "Location is required"),
})

interface TankerDialogProps {
  tanker?: Tanker | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TankerDialog({ tanker, open, onOpenChange }: TankerDialogProps) {
  const isEditing = !!tanker
  const createMutation = useCreateTanker()
  const updateMutation = useUpdateTanker()
  const { data: fuelTypes = { items: [] } } = useFuelTypes({ limit: 100 })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      capacity: 0,
      fuelTypeId: "",
      tankerNumber: "",
      currentFuel: 0,
      pressure: 0,
      temperature: 0,
      location: "",
    },
  })

  useEffect(() => {
    if (tanker) {
      form.reset({
        name: tanker.name,
        capacity: tanker.capacity,
        fuelTypeId: tanker.fuelTypeId,
        tankerNumber: tanker.tankerNumber,
        currentFuel: tanker.currentFuel,
        pressure: tanker.pressure,
        temperature: tanker.temperature,
        location: tanker.location,
      })
    } else {
      form.reset({
        name: "",
        capacity: 0,
        fuelTypeId: "",
        tankerNumber: "",
        currentFuel: 0,
        pressure: 0,
        temperature: 0,
        location: "",
      })
    }
  }, [tanker, form, open])

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditing) {
      updateMutation.mutate(
        { id: tanker.id, data: values },
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
          <DialogTitle>{isEditing ? "Edit Tanker" : "Create Tanker"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of your fuel tanker."
              : "Add a new fuel tanker to your station."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanker Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Main Diesel Tank" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tankerNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanker Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fuelTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fuel type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fuelTypes.items.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
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
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. North Side" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity (Liters)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentFuel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Level (Liters)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pressure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pressure (PSI)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature (°C)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
