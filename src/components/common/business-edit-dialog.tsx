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
import { moduleDescriptions, moduleNames, modules } from "@/constants/modules"
import { useUpdateBusiness } from "@/lib/hooks/use-business"
import { cn } from "@/lib/utils"
import { updateBusinessSchema, type UpdateBusinessInput } from "@/lib/validations/business"
import { Business } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, Check, Grid3x3, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

interface BusinessEditDialogProps {
  business: Business | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BusinessEditDialog({
  business,
  open,
  onOpenChange,
}: BusinessEditDialogProps) {
  const t = useTranslations("common")
  const tModules = useTranslations("modules")
  const updateBusinessMutation = useUpdateBusiness()

  const form = useForm<UpdateBusinessInput>({
    resolver: zodResolver(updateBusinessSchema),
    defaultValues: {
      name: "",
      modules: [],
    },
  })

  // Update form when business changes
  useEffect(() => {
    if (business) {
      form.reset({
        name: business.name || "",
        modules: business.modules || [],
      })
    }
  }, [business, form])

  const selectedModules = form.watch("modules")

  const toggleModule = (moduleId: string) => {
    const currentModules = form.getValues("modules") || []
    if (currentModules.includes(moduleId)) {
      form.setValue(
        "modules",
        currentModules.filter((id) => id !== moduleId)
      )
    } else {
      form.setValue("modules", [...currentModules, moduleId])
    }
  }

  const onSubmit = (data: UpdateBusinessInput) => {
    if (!business?.id) return

    updateBusinessMutation.mutate(
      {
        id: business.id,
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

  if (!business) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Edit Business</DialogTitle>
              <DialogDescription>
                Update your business name and modules
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Business Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter business name"
                      disabled={updateBusinessMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Modules Selection */}
            <FormField
              control={form.control}
              name="modules"
              render={() => (
                <FormItem>
                  <div className="flex items-center gap-2 mb-2">
                    <Grid3x3 className="h-4 w-4 text-muted-foreground" />
                    <FormLabel>Modules</FormLabel>
                  </div>
                  <FormControl>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {modules.map((moduleId) => {
                        const isSelected = selectedModules?.includes(moduleId) || false
                        const moduleName = moduleNames[moduleId] || moduleId
                        const moduleDescription =
                          moduleDescriptions[moduleId] || ""

                        return (
                          <button
                            key={moduleId}
                            type="button"
                            onClick={() => toggleModule(moduleId)}
                            disabled={updateBusinessMutation.isPending}
                            className={cn(
                              "relative flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all hover:bg-accent",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border"
                            )}
                          >
                            <div className="flex w-full items-center justify-between">
                              <div className="flex-1">
                                <div className="font-semibold">{moduleName}</div>
                                {moduleDescription && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {moduleDescription}
                                  </div>
                                )}
                              </div>
                              {isSelected && (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                  <Check className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
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
                disabled={updateBusinessMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateBusinessMutation.isPending || !form.formState.isDirty}
              >
                {updateBusinessMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
