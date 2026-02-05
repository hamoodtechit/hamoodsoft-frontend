/**
 * EXAMPLE: Migrated Products Page
 * 
 * This is an example showing how to migrate a page to use the new permission system.
 * DO NOT USE THIS FILE DIRECTLY - Use it as a reference for migration.
 * 
 * Key changes:
 * 1. Replaced currentBusiness?.modules?.includes() with useHasModuleAccess()
 * 2. Added permission checks for actions (create, update, delete)
 * 3. Used PermissionGuard for conditional rendering
 * 4. Added loading states
 * 5. Used type-safe permission constants
 */

"use client"

import { useHasModuleAccess, useHasPermission } from "@/lib/hooks/use-permissions"
import { PermissionGuard } from "@/components/common/permission-guard"
import { PERMISSIONS, MODULES } from "@/lib/utils/permissions"
import { useModuleAccessCheck } from "@/lib/hooks/use-permission-check"
// ... other imports

export default function ProductsPageMigratedExample() {
  // ✅ NEW: Use permission hooks instead of currentBusiness checks
  const { hasAccess, isLoading: isCheckingAccess } = useModuleAccessCheck(MODULES.INVENTORY)
  const canCreate = useHasPermission(PERMISSIONS.PRODUCTS_CREATE)
  const canUpdate = useHasPermission(PERMISSIONS.PRODUCTS_UPDATE)
  const canDelete = useHasPermission(PERMISSIONS.PRODUCTS_DELETE)

  // ✅ NEW: Simplified redirect logic
  useEffect(() => {
    if (!isCheckingAccess && !hasAccess) {
      router.push(`/${locale}/dashboard`)
    }
  }, [hasAccess, isCheckingAccess, locale, router])

  // ✅ NEW: Show loading while checking permissions
  if (isCheckingAccess) {
    return (
      <PageLayout title={t("title")} description={t("description")}>
        <SkeletonList count={5} />
      </PageLayout>
    )
  }

  // ✅ NEW: Access denied check
  if (!hasAccess) {
    return (
      <PageLayout title={tModules("accessDenied")} description={tModules("noAccess")}>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{tModules("noAccessDescription")}</p>
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout title={t("title")} description={t("description")}>
      {/* ✅ NEW: PermissionGuard for create button */}
      <PermissionGuard permission={PERMISSIONS.PRODUCTS_CREATE}>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t("createProduct")}
        </Button>
      </PermissionGuard>

      {/* ✅ NEW: Pass permissions as props to child components */}
      <ProductTable 
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </PageLayout>
  )
}

/**
 * Example: Optimized Product Actions Component
 */
function ProductActions({ 
  productId, 
  canUpdate, 
  canDelete 
}: { 
  productId: string
  canUpdate: boolean
  canDelete: boolean
}) {
  if (!canUpdate && !canDelete) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* ✅ NEW: Conditional rendering based on permissions */}
        {canUpdate && (
          <DropdownMenuItem onClick={() => handleEdit(productId)}>
            <Pencil className="mr-2 h-4 w-4" />
            {tCommon("edit")}
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem 
            onClick={() => handleDelete(productId)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {tCommon("delete")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
