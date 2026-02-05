# Permission Validation Fix

## Problem

The backend validation requires permissions to match the pattern `/^[a-z_]+:[a-z_]+$/` (lowercase letters and underscores only), but the frontend was sometimes sending permissions in camelCase format (e.g., `productCategories:read` instead of `product_categories:read`).

## Solution

Added comprehensive normalization and validation at multiple layers:

### 1. Zod Schema Validation (`src/lib/validations/roles.ts`)
- Added `permissionPattern` regex validation
- Added `normalizePermission` helper function to convert camelCase to snake_case
- Added `.transform()` to automatically normalize permissions during validation
- Removes duplicates and filters invalid permissions

### 2. API Layer Normalization (`src/lib/api/roles.ts`)
- Added `normalizePermission` helper function
- Normalizes permissions in `createRole` and `updateRole` before sending to API
- Normalizes permissions when receiving from API in `normalizeRole`
- Removes duplicates and filters invalid permissions

### 3. Component Layer (`src/components/common/role-dialog.tsx`)
- Normalizes permissions when loading role for editing
- Ensures permissions are clean before submission
- Removes duplicates

## Normalization Logic

The `normalizePermission` function:
1. Checks if permission already matches pattern `/^[a-z_]+:[a-z_]+$/`
2. If not, splits by `:` to get resource and action
3. Converts camelCase resource to snake_case:
   - `productCategories` → `product_categories`
   - Uses regex `/([a-z])([A-Z])/g` to insert underscores
4. Lowercases both resource and action
5. Returns normalized format: `product_categories:read`

## Examples

- ✅ `product_categories:read` → `product_categories:read` (no change)
- ✅ `productCategories:read` → `product_categories:read` (normalized)
- ✅ `ProductCategories:Read` → `product_categories:read` (normalized)
- ❌ `productCategories:read` → filtered out if invalid format

## Testing

To test:
1. Create a role with permissions
2. Edit the role - permissions should be normalized
3. Check network tab - all permissions should match `/^[a-z_]+:[a-z_]+$/` pattern
4. No validation errors should occur

## Files Modified

1. `src/lib/validations/roles.ts` - Added validation and normalization
2. `src/lib/api/roles.ts` - Added normalization in API layer
3. `src/components/common/role-dialog.tsx` - Added normalization when loading role
