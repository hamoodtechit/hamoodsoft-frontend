# Migration Template for Pages

Use this template when migrating each page to the new permission system.

## Page: [Page Name]

### Step 1: Add Imports

```tsx
import { useHasModuleAccess } from "@/lib/hooks/use-permissions"
import { PermissionGuard } from "@/components/common/permission-guard"
import { PERMISSIONS, MODULES } from "@/lib/utils/permissions"
```

### Step 2: Replace Module Access Check

**Before:**
```tsx
useEffect(() => {
  if (currentBusiness && !currentBusiness.modules?.includes("inventory")) {
    router.push(`/${locale}/dashboard`)
  }
}, [currentBusiness, locale, router])

if (!currentBusiness?.modules?.includes("inventory")) {
  return <AccessDenied />
}
```

**After:**
```tsx
const hasAccess = useHasModuleAccess(MODULES.INVENTORY)

useEffect(() => {
  if (!hasAccess) {
    router.push(`/${locale}/dashboard`)
  }
}, [hasAccess, locale, router])

if (!hasAccess) {
  return <AccessDenied />
}
```

### Step 3: Replace Action Permission Checks

**Before:**
```tsx
{/* Somewhere in component */}
{userRole?.permissions?.includes("products:create") && (
  <Button onClick={handleCreate}>Create</Button>
)}
```

**After:**
```tsx
import { useHasPermission } from "@/lib/hooks/use-permissions"

const canCreate = useHasPermission(PERMISSIONS.PRODUCTS_CREATE)

{canCreate && (
  <Button onClick={handleCreate}>Create</Button>
)}
```

**Or using PermissionGuard:**
```tsx
<PermissionGuard permission={PERMISSIONS.PRODUCTS_CREATE}>
  <Button onClick={handleCreate}>Create</Button>
</PermissionGuard>
```

### Step 4: Add Loading States

```tsx
const { hasAccess, isLoading } = useModuleAccessCheck(MODULES.INVENTORY)

if (isLoading) {
  return <LoadingSpinner />
}

if (!hasAccess) {
  return <AccessDenied />
}
```

### Step 5: Test Checklist

- [ ] Page loads correctly with permissions
- [ ] Access denied shows when user lacks module access
- [ ] Action buttons show/hide based on permissions
- [ ] No console errors
- [ ] React Query DevTools shows cached data
- [ ] Tested with different user roles
- [ ] Performance is acceptable (check re-renders)

### Step 6: Code Review

- [ ] Uses type-safe permission constants
- [ ] No direct `currentBusiness?.modules` checks
- [ ] Permission checks are memoized
- [ ] Loading states handled
- [ ] Error handling in place

## Example: Complete Migration

```tsx
"use client"

import { useHasModuleAccess, useHasPermission } from "@/lib/hooks/use-permissions"
import { PermissionGuard } from "@/components/common/permission-guard"
import { PERMISSIONS, MODULES } from "@/lib/utils/permissions"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ProductsPage() {
  const router = useRouter()
  const hasAccess = useHasModuleAccess(MODULES.INVENTORY)
  const canCreate = useHasPermission(PERMISSIONS.PRODUCTS_CREATE)
  const canUpdate = useHasPermission(PERMISSIONS.PRODUCTS_UPDATE)
  const canDelete = useHasPermission(PERMISSIONS.PRODUCTS_DELETE)

  useEffect(() => {
    if (!hasAccess) {
      router.push("/dashboard")
    }
  }, [hasAccess, router])

  if (!hasAccess) {
    return <AccessDenied />
  }

  return (
    <div>
      <PermissionGuard permission={PERMISSIONS.PRODUCTS_CREATE}>
        <Button onClick={handleCreate}>Create Product</Button>
      </PermissionGuard>

      <ProductList 
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  )
}
```
