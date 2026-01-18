"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BranchDialog } from "@/components/common/branch-dialog"
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageLayout } from "@/components/common/page-layout"
import { SkeletonList } from "@/components/skeletons/skeleton-list"
import { useBranches, useDeleteBranch } from "@/lib/hooks/use-branches"
import { Branch } from "@/types"
import { Building2, MoreVertical, Plus, Trash2, Pencil, MapPin, Phone } from "lucide-react"
import { useState } from "react"

export default function BranchesPage() {
  const { data: branches = [], isLoading } = useBranches()
  const deleteBranchMutation = useDeleteBranch()
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null)

  const handleCreate = () => {
    setSelectedBranch(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch)
    setIsDialogOpen(true)
  }

  const handleDelete = (branch: Branch) => {
    setBranchToDelete(branch)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (branchToDelete) {
      deleteBranchMutation.mutate(branchToDelete.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false)
          setBranchToDelete(null)
        },
      })
    }
  }

  return (
    <PageLayout
      title="Branches"
      description="Manage your business branches and locations"
      maxWidth="full"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>Branches</CardTitle>
                <CardDescription>
                  Manage all your business branches and locations
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Branch
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonList count={5} />
          ) : branches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No branches yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first branch
              </p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Branch
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {branches.map((branch) => (
                <Card key={branch.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{branch.name}</CardTitle>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(branch)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(branch)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Address</p>
                          <p className="text-sm text-muted-foreground">
                            {branch.address}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Phone</p>
                          <p className="text-sm text-muted-foreground">
                            {branch.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <BranchDialog
        branch={selectedBranch}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Branch"
        description="This action cannot be undone. This will permanently delete the branch."
        itemName={branchToDelete?.name}
        isLoading={deleteBranchMutation.isPending}
      />
    </PageLayout>
  )
}
