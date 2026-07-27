"use client"

import { DataTable, type Column } from "@/components/common/data-table"
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog"
import { PageLayout } from "@/components/common/page-layout"
import { PermissionGuard } from "@/components/common/permission-guard"
import { FuelTypeDialog } from "@/components/pos/fuel-type-dialog"
import { FuelStockHistoryDialog } from "@/components/pos/fuel-stock-history-dialog"
import { TankerDialog } from "@/components/pos/tanker-dialog"
import { DispenserDialog } from "@/components/pos/dispenser-dialog"
import { DispenserReadingDialog } from "@/components/pos/dispenser-reading-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCurrentBusiness } from "@/lib/hooks/use-business"
import { useBranches } from "@/lib/hooks/use-branches"
import { useDeleteFuelType, useFuelTypes } from "@/lib/hooks/use-fuel-types"
import { useDeleteTanker, useTankers } from "@/lib/hooks/use-tankers"
import { useDeleteDispenser, useDispensers } from "@/lib/hooks/use-dispensers"
import { useDeleteDispenserReading, useDispenserReadings } from "@/lib/hooks/use-dispenser-readings"
import { Dispenser, DispenserReading, FuelType, Tanker } from "@/types"
import { Container, Droplets, Fuel, Gauge, History, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

export default function OilFillingStationPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const currentBusiness = useCurrentBusiness()

  const [activeTab, setActiveTab] = useState("dashboard")
  
  // Fuel Types State
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType | null>(null)
  const [isFuelDialogOpen, setIsFuelDialogOpen] = useState(false)
  const [isFuelDeleteDialogOpen, setIsFuelDeleteDialogOpen] = useState(false)
  const [fuelTypeToDelete, setFuelTypeToDelete] = useState<FuelType | null>(null)
  const [isFuelHistoryOpen, setIsFuelHistoryOpen] = useState(false)
  
  // Tankers State
  const [selectedTanker, setSelectedTanker] = useState<Tanker | null>(null)
  const [isTankerDialogOpen, setIsTankerDialogOpen] = useState(false)
  const [isTankerDeleteDialogOpen, setIsTankerDeleteDialogOpen] = useState(false)
  const [tankerToDelete, setTankerToDelete] = useState<Tanker | null>(null)

  // Dispensers State
  const [selectedDispenser, setSelectedDispenser] = useState<Dispenser | null>(null)
  const [isDispenserDialogOpen, setIsDispenserDialogOpen] = useState(false)
  const [isDispenserDeleteDialogOpen, setIsDispenserDeleteDialogOpen] = useState(false)
  const [dispenserToDelete, setDispenserToDelete] = useState<Dispenser | null>(null)

  // Readings State
  const [isReadingDialogOpen, setIsReadingDialogOpen] = useState(false)
  const [isReadingDeleteDialogOpen, setIsReadingDeleteDialogOpen] = useState(false)
  const [readingToDelete, setReadingToDelete] = useState<DispenserReading | null>(null)

  const { data: fuelTypesData, isLoading: isLoadingFuelTypes } = useFuelTypes()
  const { data: tankersData, isLoading: isLoadingTankers } = useTankers()
  const { data: dispensersData, isLoading: isLoadingDispensers } = useDispensers()
  const { data: readingsData, isLoading: isLoadingReadings } = useDispenserReadings()
  const { data: branchesData } = useBranches()
  
  const deleteFuelMutation = useDeleteFuelType()
  const deleteTankerMutation = useDeleteTanker()
  const deleteDispenserMutation = useDeleteDispenser()
  const deleteReadingMutation = useDeleteDispenserReading()

  const branches = useMemo(() => {
    if (!branchesData) return []
    const items = Array.isArray(branchesData) ? branchesData : (branchesData as any)?.items || []
    return items.map((b: any) => ({ id: b.id, name: b.name }))
  }, [branchesData])

  // Check if user has access to oil-filling-station module
  useEffect(() => {
    if (currentBusiness && !currentBusiness.modules?.includes("oil-filling-station")) {
      router.push(`/${locale}/dashboard`)
    }
  }, [currentBusiness, locale, router])

  const fuelTypeColumns: Column<FuelType>[] = useMemo(() => [
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      sortable: true,
    },
    {
      id: "price",
      header: "Selling Price/Liter",
      cell: (row) => `${row.price.toFixed(2)}`,
      sortable: true,
    },
    {
      id: "costPrice",
      header: "Cost Price/Liter",
      cell: (row) => `${(row.costPrice ?? 0).toFixed(2)}`,
      sortable: true,
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              setSelectedFuelType(row)
              setIsFuelHistoryOpen(true)
            }}>
              <History className="mr-2 h-4 w-4" /> History
            </DropdownMenuItem>
            <PermissionGuard permission="fuel_types:update">
              <DropdownMenuItem onClick={() => {
                setSelectedFuelType(row)
                setIsFuelDialogOpen(true)
              }}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            </PermissionGuard>
            <PermissionGuard permission="fuel_types:delete">
              <DropdownMenuItem 
                onClick={() => {
                  setFuelTypeToDelete(row)
                  setIsFuelDeleteDialogOpen(true)
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </PermissionGuard>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }
  ], [])

  const tankerColumns: Column<Tanker>[] = useMemo(() => [
    {
      id: "tankerNumber",
      header: "No.",
      accessorKey: "tankerNumber",
    },
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
    },
    {
      id: "fuelType",
      header: "Fuel Type",
      cell: (row) => row.fuelType?.name || "-",
    },
    {
      id: "capacity",
      header: "Capacity",
      cell: (row) => `${row.capacity}L`,
    },
    {
      id: "currentFuel",
      header: "Current Level",
      cell: (row) => {
        const current = Number(row.currentFuel || 0);
        const capacity = Number(row.capacity || 0);
        return (
          <div className="flex flex-col gap-1">
            <span className="text-xs">{current.toFixed(2)}L / {capacity.toFixed(2)}L</span>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full ${capacity > 0 && current / capacity < 0.2 ? 'bg-destructive' : 'bg-primary'}`}
                style={{ width: capacity > 0 ? `${(current / capacity) * 100}%` : '0%' }}
              />
            </div>
          </div>
        );
      },
    },
    {
      id: "location",
      header: "Location",
      accessorKey: "location",
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <PermissionGuard permission="tankers:update">
              <DropdownMenuItem onClick={() => {
                setSelectedTanker(row)
                setIsTankerDialogOpen(true)
              }}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            </PermissionGuard>
            <PermissionGuard permission="tankers:delete">
              <DropdownMenuItem 
                onClick={() => {
                  setTankerToDelete(row)
                  setIsTankerDeleteDialogOpen(true)
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </PermissionGuard>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }
  ], [])

  const dispenserColumns: Column<Dispenser>[] = useMemo(() => [
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      sortable: true,
    },
    {
      id: "tanker",
      header: "Tanker",
      cell: (row) => row.tanker?.name || "-",
    },
    {
      id: "fuelType",
      header: "Fuel Type",
      cell: (row) => (row.tanker as any)?.fuelType?.name || "-",
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => {
        const variant = row.status === "ACTIVE" ? "default" : row.status === "MAINTENANCE" ? "outline" : "secondary"
        return <Badge variant={variant}>{row.status}</Badge>
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <PermissionGuard permission="dispensers:update">
              <DropdownMenuItem onClick={() => {
                setSelectedDispenser(row)
                setIsDispenserDialogOpen(true)
              }}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            </PermissionGuard>
            <PermissionGuard permission="dispensers:delete">
              <DropdownMenuItem 
                onClick={() => {
                  setDispenserToDelete(row)
                  setIsDispenserDeleteDialogOpen(true)
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </PermissionGuard>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }
  ], [])

  const readingColumns: Column<DispenserReading>[] = useMemo(() => [
    {
      id: "dispenser",
      header: "Dispenser",
      cell: (row) => row.dispenser?.name || "-",
    },
    {
      id: "tanker",
      header: "Tanker",
      cell: (row) => row.tanker?.name || "-",
    },
    {
      id: "fuelType",
      header: "Fuel Type",
      cell: (row) => (row.tanker as any)?.fuelType?.name || "-",
    },
    {
      id: "openingReading",
      header: "Opening",
      cell: (row) => row.openingReading.toFixed(2),
    },
    {
      id: "closingReading",
      header: "Closing",
      cell: (row) => row.closingReading.toFixed(2),
    },
    {
      id: "volumeDispensed",
      header: "Volume (L)",
      cell: (row) => (
        <span className="font-medium">{row.volumeDispensed.toFixed(2)}</span>
      ),
    },
    {
      id: "readingDate",
      header: "Date",
      cell: (row) => new Date(row.readingDate).toLocaleDateString(),
      sortable: true,
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <PermissionGuard permission="dispenser_readings:delete">
              <DropdownMenuItem 
                onClick={() => {
                  setReadingToDelete(row)
                  setIsReadingDeleteDialogOpen(true)
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </PermissionGuard>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }
  ], [])

  if (!currentBusiness?.modules?.includes("oil-filling-station")) {
    return (
      <PageLayout title="Access Denied" description="You don't have access to this module">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              You don't have access to the Oil Filling Station module. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Oil Filling Station"
      description="Manage fuel sales, tankers, dispensers, and readings"
      maxWidth="full"
    >
      <Tabs defaultValue="dashboard" className="space-y-4" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <PermissionGuard permission="fuel_types:read">
              <TabsTrigger value="fuel-types">Fuel Types</TabsTrigger>
            </PermissionGuard>
            <PermissionGuard permission="tankers:read">
              <TabsTrigger value="tankers">Tankers</TabsTrigger>
            </PermissionGuard>
            <PermissionGuard permission="dispensers:read">
              <TabsTrigger value="dispensers">Dispensers</TabsTrigger>
            </PermissionGuard>
            {/* TODO: Re-enable when readings feature is ready */}
            {/* <TabsTrigger value="readings">Readings</TabsTrigger> */}
          </TabsList>
          
          <div className="flex items-center gap-2">
            {activeTab === "fuel-types" && (
              <PermissionGuard permission="fuel_types:create">
                <Button onClick={() => {
                  setSelectedFuelType(null)
                  setIsFuelDialogOpen(true)
                }}>
                  <Plus className="mr-2 h-4 w-4" /> Add Fuel Type
                </Button>
              </PermissionGuard>
            )}
            {activeTab === "tankers" && (
              <PermissionGuard permission="tankers:create">
                <Button onClick={() => {
                  setSelectedTanker(null)
                  setIsTankerDialogOpen(true)
                }}>
                  <Plus className="mr-2 h-4 w-4" /> Add Tanker
                </Button>
              </PermissionGuard>
            )}
            {activeTab === "dispensers" && (
              <PermissionGuard permission="dispensers:create">
                <Button onClick={() => {
                  setSelectedDispenser(null)
                  setIsDispenserDialogOpen(true)
                }}>
                  <Plus className="mr-2 h-4 w-4" /> Add Dispenser
                </Button>
              </PermissionGuard>
            )}
            {/* TODO: Re-enable when readings feature is ready */}
            {/* {activeTab === "readings" && (
              <Button onClick={() => setIsReadingDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Record Reading
              </Button>
            )} */}
          </div>
        </div>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
            <PermissionGuard permission="tankers:read">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Tankers</CardTitle>
                  <Container className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tankersData?.meta.total || 0}</div>
                </CardContent>
              </Card>
            </PermissionGuard>
            <PermissionGuard permission="fuel_types:read">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fuel Types</CardTitle>
                  <Droplets className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{fuelTypesData?.meta.total || 0}</div>
                </CardContent>
              </Card>
            </PermissionGuard>
            <PermissionGuard permission="dispensers:read">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Dispensers</CardTitle>
                  <Fuel className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dispensersData?.meta.total || 0}</div>
                </CardContent>
              </Card>
            </PermissionGuard>
            {/* <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Readings</CardTitle>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{readingsData?.meta.total || 0}</div>
              </CardContent>
            </Card> */}
          </div>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Fuel className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Oil Filling Station Overview</CardTitle>
                  <CardDescription>
                    Manage fuel sales, inventory, and station operations
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Welcome to the Petrol Pump management dashboard. Here you can configure your tankers, dispensers, and track fuel readings.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
                  <PermissionGuard permission="fuel_types:read">
                    <div className="p-4 border rounded-lg space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Droplets className="h-4 w-4" /> Fuel Types
                      </h3>
                      <p className="text-sm text-muted-foreground">Define fuels like Diesel, Octane, or Petrol and set their price.</p>
                      <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("fuel-types")}>Manage Fuel Types &rarr;</Button>
                    </div>
                  </PermissionGuard>
                  <PermissionGuard permission="tankers:read">
                    <div className="p-4 border rounded-lg space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Container className="h-4 w-4" /> Tankers
                      </h3>
                      <p className="text-sm text-muted-foreground">Track underground tanks, capacity, and fuel levels.</p>
                      <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("tankers")}>Manage Tankers &rarr;</Button>
                    </div>
                  </PermissionGuard>
                  <PermissionGuard permission="dispensers:read">
                    <div className="p-4 border rounded-lg space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Fuel className="h-4 w-4" /> Dispensers
                      </h3>
                      <p className="text-sm text-muted-foreground">Manage fuel pumps connected to your tankers.</p>
                      <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("dispensers")}>Manage Dispensers &rarr;</Button>
                    </div>
                  </PermissionGuard>
                  {/* <div className="p-4 border rounded-lg space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Gauge className="h-4 w-4" /> Readings
                    </h3>
                    <p className="text-sm text-muted-foreground">Record and track daily meter readings per dispenser.</p>
                    <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("readings")}>View Readings &rarr;</Button>
                  </div> */}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fuel-types">
          <Card>
            <CardContent className="pt-6">
              <DataTable
                columns={fuelTypeColumns}
                data={fuelTypesData?.items || []}
                isLoading={isLoadingFuelTypes}
                emptyMessage="No fuel types found. Add your first fuel type to start."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tankers">
          <Card>
            <CardContent className="pt-6">
              <DataTable
                columns={tankerColumns}
                data={tankersData?.items || []}
                isLoading={isLoadingTankers}
                emptyMessage="No tankers found. Add your first tanker to start."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dispensers">
          <Card>
            <CardContent className="pt-6">
              <DataTable
                columns={dispenserColumns}
                data={dispensersData?.items || []}
                isLoading={isLoadingDispensers}
                emptyMessage="No dispensers found. Add your first dispenser to start."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TODO: Re-enable when readings feature is ready */}
        {/* <TabsContent value="readings">
          <Card>
            <CardContent className="pt-6">
              <DataTable
                columns={readingColumns}
                data={readingsData?.items || []}
                isLoading={isLoadingReadings}
                emptyMessage="No readings found. Record your first dispenser reading."
              />
            </CardContent>
          </Card>
        </TabsContent> */}
      </Tabs>

      <FuelStockHistoryDialog
        fuelType={selectedFuelType}
        open={isFuelHistoryOpen}
        onOpenChange={setIsFuelHistoryOpen}
      />

      <FuelTypeDialog
        fuelType={selectedFuelType}
        open={isFuelDialogOpen}
        onOpenChange={setIsFuelDialogOpen}
      />

      <TankerDialog
        tanker={selectedTanker}
        open={isTankerDialogOpen}
        onOpenChange={setIsTankerDialogOpen}
      />

      <DispenserDialog
        dispenser={selectedDispenser}
        open={isDispenserDialogOpen}
        onOpenChange={setIsDispenserDialogOpen}
        branches={branches}
      />

      <DispenserReadingDialog
        open={isReadingDialogOpen}
        onOpenChange={setIsReadingDialogOpen}
      />

      <DeleteConfirmationDialog
        open={isFuelDeleteDialogOpen}
        onOpenChange={setIsFuelDeleteDialogOpen}
        onConfirm={() => {
          if (fuelTypeToDelete) {
            deleteFuelMutation.mutate(fuelTypeToDelete.id, {
              onSuccess: () => setIsFuelDeleteDialogOpen(false)
            })
          }
        }}
        title="Delete Fuel Type"
        description={`Are you sure you want to delete ${fuelTypeToDelete?.name}? this action cannot be undone.`}
        isLoading={deleteFuelMutation.isPending}
      />

      <DeleteConfirmationDialog
        open={isTankerDeleteDialogOpen}
        onOpenChange={setIsTankerDeleteDialogOpen}
        onConfirm={() => {
          if (tankerToDelete) {
            deleteTankerMutation.mutate(tankerToDelete.id, {
              onSuccess: () => setIsTankerDeleteDialogOpen(false)
            })
          }
        }}
        title="Delete Tanker"
        description={`Are you sure you want to delete ${tankerToDelete?.name}? this action cannot be undone.`}
        isLoading={deleteTankerMutation.isPending}
      />

      <DeleteConfirmationDialog
        open={isDispenserDeleteDialogOpen}
        onOpenChange={setIsDispenserDeleteDialogOpen}
        onConfirm={() => {
          if (dispenserToDelete) {
            deleteDispenserMutation.mutate(dispenserToDelete.id, {
              onSuccess: () => setIsDispenserDeleteDialogOpen(false)
            })
          }
        }}
        title="Delete Dispenser"
        description={`Are you sure you want to delete ${dispenserToDelete?.name}? this action cannot be undone.`}
        isLoading={deleteDispenserMutation.isPending}
      />

      <DeleteConfirmationDialog
        open={isReadingDeleteDialogOpen}
        onOpenChange={setIsReadingDeleteDialogOpen}
        onConfirm={() => {
          if (readingToDelete) {
            deleteReadingMutation.mutate(readingToDelete.id, {
              onSuccess: () => setIsReadingDeleteDialogOpen(false)
            })
          }
        }}
        title="Delete Reading"
        description="Are you sure you want to delete this reading? The fuel volume will be restored to the tanker."
        isLoading={deleteReadingMutation.isPending}
      />
    </PageLayout>
  )
}
