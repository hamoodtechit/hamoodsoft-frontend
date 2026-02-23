"use client"

import { DataTable, type Column } from "@/components/common/data-table"
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog"
import { PageLayout } from "@/components/common/page-layout"
import { FuelTypeDialog } from "@/components/pos/fuel-type-dialog"
import { TankerDialog } from "@/components/pos/tanker-dialog"
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
import { useDeleteFuelType, useFuelTypes } from "@/lib/hooks/use-fuel-types"
import { useDeleteTanker, useTankers } from "@/lib/hooks/use-tankers"
import { FuelType, Tanker } from "@/types"
import { Container, Droplets, Fuel, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react"
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
  
  // Tankers State
  const [selectedTanker, setSelectedTanker] = useState<Tanker | null>(null)
  const [isTankerDialogOpen, setIsTankerDialogOpen] = useState(false)
  const [isTankerDeleteDialogOpen, setIsTankerDeleteDialogOpen] = useState(false)
  const [tankerToDelete, setTankerToDelete] = useState<Tanker | null>(null)

  const { data: fuelTypesData, isLoading: isLoadingFuelTypes } = useFuelTypes()
  const { data: tankersData, isLoading: isLoadingTankers } = useTankers()
  
  const deleteFuelMutation = useDeleteFuelType()
  const deleteTankerMutation = useDeleteTanker()

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
      header: "Price/Liter",
      cell: (row) => `${row.price.toFixed(2)}`,
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={row.isActive ? "default" : "secondary"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
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
              setIsFuelDialogOpen(true)
            }}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                setFuelTypeToDelete(row)
                setIsFuelDeleteDialogOpen(true)
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
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
      cell: (row) => (
        <div className="flex flex-col gap-1">
          <span className="text-xs">{row.currentFuel}L / {row.capacity}L</span>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full ${row.currentFuel / row.capacity < 0.2 ? 'bg-destructive' : 'bg-primary'}`}
              style={{ width: `${(row.currentFuel / row.capacity) * 100}%` }}
            />
          </div>
        </div>
      ),
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
            <DropdownMenuItem onClick={() => {
              setSelectedTanker(row)
              setIsTankerDialogOpen(true)
            }}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                setTankerToDelete(row)
                setIsTankerDeleteDialogOpen(true)
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
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
      description="Manage fuel sales, tankers, and types"
      maxWidth="full"
    >
      <Tabs defaultValue="dashboard" className="space-y-4" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="fuel-types">Fuel Types</TabsTrigger>
            <TabsTrigger value="tankers">Tankers</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            {activeTab === "fuel-types" && (
              <Button onClick={() => {
                setSelectedFuelType(null)
                setIsFuelDialogOpen(true)
              }}>
                <Plus className="mr-2 h-4 w-4" /> Add Fuel Type
              </Button>
            )}
            {activeTab === "tankers" && (
              <Button onClick={() => {
                setSelectedTanker(null)
                setIsTankerDialogOpen(true)
              }}>
                <Plus className="mr-2 h-4 w-4" /> Add Tanker
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Tankers</CardTitle>
                <Container className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tankersData?.meta.total || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fuel Types</CardTitle>
                <Droplets className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fuelTypesData?.meta.total || 0}</div>
              </CardContent>
            </Card>
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
                  Welcome to the Petrol Pump management dashboard. Here you can configure your tankers and fuel types used in the POS.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Droplets className="h-4 w-4" /> Fuel Types
                    </h3>
                    <p className="text-sm text-muted-foreground">Define fuels like Diesel, Octane, or Petrol and set their current market price.</p>
                    <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("fuel-types")}>Manage Fuel Types &rarr;</Button>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Container className="h-4 w-4" /> Tankers
                    </h3>
                    <p className="text-sm text-muted-foreground">Track underground tanks, their capacity, current fuel level, and sensor data.</p>
                    <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("tankers")}>Manage Tankers &rarr;</Button>
                  </div>
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
      </Tabs>

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
    </PageLayout>
  )
}
