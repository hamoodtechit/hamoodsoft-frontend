"use client"

import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog"
import { PageLayout } from "@/components/common/page-layout"
import { UnitDialog } from "@/components/common/unit-dialog"
import { SkeletonList } from "@/components/skeletons/skeleton-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/hooks/use-auth"
import { useBranchSelection } from "@/lib/hooks/use-branch-selection"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { useDeleteUnit, useUnits } from "@/lib/hooks/use-units"
import { Unit } from "@/types"
import { MoreVertical, Pencil, Plus, Ruler, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function UnitsPage() {
  const t = useTranslations("units")
  const tCommon = useTranslations("common")
  const tModules = useTranslations("modulesPages.inventory")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const { user } = useAuth()
  const currentBusiness = useCurrentBusiness()
  const { selectedBranchId } = useBranchSelection()
  const { data: units = [], isLoading } = useUnits(selectedBranchId || undefined)
  const deleteUnitMutation = useDeleteUnit()
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null)

  // Check if user has access to inventory module
  useEffect(() => {
    if (currentBusiness && !currentBusiness.modules?.includes("inventory")) {
      router.push(`/${locale}/dashboard`)
    }
  }, [currentBusiness, locale, router])

  if (!currentBusiness?.modules?.includes("inventory")) {
    return (
      <PageLayout title={tModules("accessDenied")} description={tModules("noAccess")}>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              {tModules("noAccessDescription")}
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  const handleCreate = () => {
    setSelectedUnit(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (unit: Unit) => {
    setSelectedUnit(unit)
    setIsDialogOpen(true)
  }

  const handleDelete = (unit: Unit) => {
    setUnitToDelete(unit)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (unitToDelete) {
      deleteUnitMutation.mutate(unitToDelete.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false)
          setUnitToDelete(null)
        },
      })
    }
  }

  return (
    <PageLayout
      title={t("title")}
      description={t("description")}
      maxWidth="full"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Ruler className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>{t("title")}</CardTitle>
                <CardDescription>
                  {t("description")}
                  {selectedBranchId && (
                    <span className="ml-2 text-xs">
                      ({t("filteredByBranch")})
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t("createUnit")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonList count={5} />
          ) : units.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Ruler className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("noUnits")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("noUnitsDescription")}
              </p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createUnit")}
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {units.map((unit) => (
                <Card key={unit.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{unit.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {t("suffix")}: <span className="font-mono font-medium">{unit.suffix}</span>
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(unit)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {tCommon("edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(unit)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {tCommon("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <UnitDialog
        unit={selectedUnit}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDescription", { name: unitToDelete?.name || "" })}
        isLoading={deleteUnitMutation.isPending}
      />
    </PageLayout>
  )
}
