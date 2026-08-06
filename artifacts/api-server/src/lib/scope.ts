/**
 * Tenant-scope query helpers.
 *
 * scopeFacilityIds / scopeClubIds are set by the resolveScope middleware:
 *   null   → no restriction  (demo mode, super_admin)
 *   []     → no access       (unassigned role)
 *   [...]  → exactly these IDs are visible
 */
import { eq, inArray, sql } from "drizzle-orm";
import type { Column } from "drizzle-orm";

/**
 * Returns a Drizzle where-clause fragment for the scope, or undefined (= no
 * filter) when the scope is unrestricted. Pass the result directly to
 * `.where()` or `and(...)`.
 */
export function scopeWhere(
  column: Column,
  ids: number[] | null | undefined,
): ReturnType<typeof inArray> | ReturnType<typeof eq> | ReturnType<typeof sql> | undefined {
  if (ids === null || ids === undefined) return undefined; // unrestricted
  if (ids.length === 0) return sql`1 = 0`; // deny all
  if (ids.length === 1) return eq(column, ids[0]!); // avoid inArray([x]) issues
  return inArray(column, ids);
}

/**
 * Returns true when a specific resource ID is within the given scope.
 * Use this for detail routes to guard against cross-tenant direct ID access.
 *
 *   inScope(null, x)    → true  (no restriction)
 *   inScope([], x)      → false (no access)
 *   inScope([1,2], 1)   → true
 *   inScope([1,2], 3)   → false
 */
export function inScope(
  ids: number[] | null | undefined,
  id: number,
): boolean {
  if (ids === null || ids === undefined) return true;
  return ids.includes(id);
}
