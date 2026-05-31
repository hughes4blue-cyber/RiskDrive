---
name: React Query v5 UseQueryOptions pattern
description: UseQueryOptions requires queryKey in RQ v5; the Orval-generated hooks expose it as query?: UseQueryOptions<...> which means passing {enabled} alone fails typecheck.
---

**Rule:** Never pass `{ query: { enabled: bool } }` to an Orval-generated hook — `UseQueryOptions` in RQ v5 requires `queryKey` and is not `Partial`.

**Why:** React Query v5 made `queryKey` non-optional in `UseQueryOptions`. Orval generates `options?: { query?: UseQueryOptions<...> }` without loosening that constraint, so `{ enabled: false }` alone is a TS error.

**How to apply:** Instead of `enabled`, conditionally mount the component that calls the hook:
```tsx
// Parent controls mounting
{open && <RowsComponent facilityId={id} />}

// Child always fetches when mounted
function RowsComponent({ facilityId }: { facilityId: number }) {
  const { data } = useListFoo({ facilityId });
  ...
}
```
This is idiomatic React and avoids the TS mismatch entirely.
