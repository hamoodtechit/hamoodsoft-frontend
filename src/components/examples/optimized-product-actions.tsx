"use client"

/**
 * Example: Optimized Product Actions Component
 * 
 * This demonstrates how to use the permission system to:
 * 1. Reduce API calls
 * 2. Prevent unnecessary re-renders
 * 3. Clean up code
 */

import { Button } from "@/components/ui/button"
import { PermissionGuard } from "@/components/common/permission-guard"
import { useHasPermission, useHasAnyPermission } from "@/lib/hooks/use-permissions"
import { memo } from "react"
import { Trash2, Edit, Plus } from "lucide-react"

interface ProductActionsProps {
  productId: string
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

/**
 * Optimized component using permission hooks
 * - Only re-renders when permissions actually change
 * - No API calls (uses cached permissions)
 * - Memoized to prevent unnecessary re-renders
 */
export const OptimizedProductActions = memo(function OptimizedProductActions({
  productId,
  onEdit,
  onDelete,
}: ProductActionsProps) {
  // These hooks are memoized - no re-render unless permission changes
  const canEdit = useHasPermission("products:update")
  const canDelete = useHasPermission("products:delete")
  const canManage = useHasAnyPermission(["products:update", "products:delete"])

  // Early return if no permissions
  if (!canManage) {
    return null
  }

  return (
    <div className="flex gap-2">
      {canEdit && (
        <Button variant="outline" size="sm" onClick={() => onEdit(productId)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      )}
      {canDelete && (
        <Button variant="destructive" size="sm" onClick={() => onDelete(productId)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      )}
    </div>
  )
})

/**
 * Alternative: Using PermissionGuard component
 * Even cleaner - declarative permission checks
 */
export function ProductActionsWithGuard({
  productId,
  onEdit,
  onDelete,
}: ProductActionsProps) {
  return (
    <div className="flex gap-2">
      <PermissionGuard permission="products:update">
        <Button variant="outline" size="sm" onClick={() => onEdit(productId)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </PermissionGuard>

      <PermissionGuard permission="products:delete">
        <Button variant="destructive" size="sm" onClick={() => onDelete(productId)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </PermissionGuard>
    </div>
  )
}

/**
 * Example: Create Button with Permission Check
 */
export function CreateProductButton() {
  const canCreate = useHasPermission("products:create")

  if (!canCreate) return null

  return (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Create Product
    </Button>
  )
}

/**
 * Example: Using PermissionGuard for Create Button
 */
export function CreateProductButtonWithGuard() {
  return (
    <PermissionGuard permission="products:create">
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Create Product
      </Button>
    </PermissionGuard>
  )
}
