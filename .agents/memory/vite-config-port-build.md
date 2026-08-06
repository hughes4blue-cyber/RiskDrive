---
name: Vite config PORT requirement in build mode
description: vite.config.ts requires PORT env var at load time, but PORT is absent during vite build in deployment — causes build failures.
---

# Vite config: PORT is absent during `vite build`

## The rule
`vite.config.ts` must use the `defineConfig(async ({ command }) => { ... })` callback form and skip the `PORT` check when `command === "build"`. The `PORT` env var is only set when the dev server or preview server is running — it is not set during the static build step in deployment.

**Why:** The deployment build step runs `vite build` with no port assignment. A hard `throw` on missing PORT at config load time causes `vite build` to fail before any code is compiled. This is invisible in dev (PORT is always set by the workflow runner) but breaks every deployment build.

**How to apply:** Any time `vite.config.ts` reads `process.env.PORT` at the top level, wrap the guard as:
```typescript
export default defineConfig(async ({ command }) => {
  const isBuild = command === "build";
  if (!isBuild && !process.env.PORT) throw new Error("PORT required");
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  // ...
});
```
This pattern also applies to `BASE_PATH` if it would be unused during build.
