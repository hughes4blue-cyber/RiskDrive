---
name: Drizzle onConflict with partial unique indexes
description: API asymmetry between onConflictDoUpdate and onConflictDoNothing when targeting a partial (WHERE) unique index
---

When upserting against a **partial** unique index (e.g. `uniqueIndex(...).where(sql\`external_id is not null\`)`), the conflict clause must repeat the index predicate, and the two drizzle methods spell it differently:

- `onConflictDoUpdate({ target, targetWhere, set, setWhere })` — predicate goes in **`targetWhere`**.
- `onConflictDoNothing({ target, where })` — predicate goes in **`where`**.

Using `targetWhere` on `onConflictDoNothing` is a TS2353 ("targetWhere does not exist") error.

**Why:** Postgres requires the ON CONFLICT predicate to match the partial index's predicate exactly, or it won't infer the arbiter index. The drizzle method names diverge, which is easy to get wrong.

**How to apply:** Whenever a unique index has a `.where(...)`, mirror that exact predicate in the conflict clause using the correct key for the method you chose.
