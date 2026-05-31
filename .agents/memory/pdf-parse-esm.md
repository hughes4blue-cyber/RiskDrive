---
name: pdf-parse import in ESM server
description: pdf-parse is a CJS module; importing it from an ESM server (esbuild-bundled Express) requires createRequire, not a dynamic ESM import of the internal path.
---

**Rule:** Use `createRequire(import.meta.url)` to load `pdf-parse` in the ESM api-server bundle.

**Why:** `pdf-parse` ships as CommonJS only. Dynamic `import("pdf-parse/lib/pdf-parse.js")` causes a TS2307 "cannot find module" error because TypeScript cannot resolve the internal CJS path in an ESM context. esbuild bundles CJS dependencies correctly when required via `createRequire`.

**How to apply:**
```typescript
const { createRequire } = await import("node:module");
const require = createRequire(import.meta.url);
const parseFn = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
const parsed = await parseFn(buffer);
```

Do NOT do:
```typescript
const pdfParse = await import("pdf-parse/lib/pdf-parse.js"); // TS2307
```
