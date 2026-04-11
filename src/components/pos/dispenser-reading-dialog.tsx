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
import { useDispensers } from "@/lib/hooks/use-dispensers"
import { useCreateDispenserReading } from "@/lib/hooks/use-dispenser-readings"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"
import * as z from "zod"

function getCurrentDateTimeLocal() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const local = new Date(now.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

const formSchema = z.object({
  dispenserId: z.string().min(1, "Dispenser is required"),
  tankerId: z.string().min(1, "Tanker is required"),
  branchId: z.string().min(1, "Branch is required"),
  openingReading: z.preprocess((val) => Number(val), z.number().min(0, "Opening reading must be 0 or greater")),
  closingReading: z.preprocess((val) => Number(val), z.number().min(0, "Closing reading must be 0 or greater")),
  readingDate: z.string().optional(),
}).refine((data) => data.closingReading >= data.openingReading, {
  message: "Closing reading must be >= opening reading",
  path: ["closingReading"],
})

interface DispenserReadingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DispenserReadingDialog({ open, onOpenChange }: DispenserReadingDialogProps) {
  const createMutation = useCreateDispenserReading()
  const { data: dispensersData = { items: [] } } = useDispensers({ limit: 100 })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dispenserId: "",
      tankerId: "",
      branchId: "",
      openingReading: 0,
      closingReading: 0,
      readingDate: getCurrentDateTimeLocal(),
    },
  })

  const selectedDispenserId = useWatch({ control: form.control, name: "dispenserId" })
  const openingReading = useWatch({ control: form.control, name: "openingReading" })
  const closingReading = useWatch({ control: form.control, name: "closingReading" })

  const volumePreview = useMemo(() => {
    const opening = Number(openingReading) || 0
    const closing = Number(closingReading) || 0
    return closing >= opening ? closing - opening : 0
  }, [openingReading, closingReading])

  // Auto-populate tanker and branch when dispenser is selected
  useEffect(() => {
    if (selectedDispenserId) {
      const dispenser = dispensersData.items.find((d) => d.id === selectedDispenserId)
      if (dispenser) {
        form.setValue("tankerId", dispenser.tankerId)
        form.setValue("branchId", dispenser.branchId)
      }
    }
  }, [selectedDispenserId, dispensersData.items, form])

  useEffect(() => {
    if (!open) {
      form.reset({
        dispenserId: "",
        tankerId: "",
        branchId: "",
        openingReading: 0,
        closingReading: 0,
        readingDate: getCurrentDateTimeLocal(),
      })
    }
  }, [open, form])

  function onSubmit(values: z.infer<typeof formSchema>) {
    const payload = {
      ...values,
      readingDate: values.readingDate || undefined,
    }
    createMutation.mutate(payload, {
      onSuccess: () => {
        onOpenChange(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Dispenser Reading</DialogTitle>
          <DialogDescription>
            Enter the opening and closing meter readings for a dispenser.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="dispenserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dispenser</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select dispenser" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {dispensersData.items
                        .filter((d) => d.status === "ACTIVE")
                        .map((dispenser) => (
                          <SelectItem key={dispenser.id} value={dispenser.id}>
                            {dispenser.name} — {dispenser.tanker?.name || "Unknown Tank"}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="openingReading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opening Reading</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="closingReading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Closing Reading</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {volumePreview > 0 && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">
                  Volume Dispensed: <span className="font-semibold text-foreground">{volumePreview.toFixed(2)} L</span>
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="readingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reading Date</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
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
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Recording..." : "Record Reading"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
