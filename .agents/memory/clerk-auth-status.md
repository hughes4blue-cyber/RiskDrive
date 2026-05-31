---
name: Clerk auth status
description: What's done vs still pending for the Clerk login wall in RiskDrive
---

## Done
- DB: `users` + `app_settings` tables pushed (role, approvalStatus, clubId, facilityId)
- Server: `middlewares/auth.ts` — getAppMode (30s TTL cache), resolveUser (JIT provision), requireAuth, requireLiveMode, requireSuperAdmin, injectScopeParams
- Server: `routes/auth.ts` — GET /api/auth/me, GET/PUT /api/app-settings/mode, GET /api/admin/users, PUT /api/admin/users/:id/approve|deny
- Frontend pages (typechecked clean): SignIn.tsx, SignUp.tsx, PendingApproval.tsx, AdminConsole.tsx
- CSS: @layer added for Clerk + @import "@clerk/themes/shadcn.css" in index.css
- Vite: tailwindcss({ optimize: false }) for Clerk CSS layer compat
- Codegen: getAppMode, getCurrentUser, listAdminUsers, approveUser, denyUser hooks generated

## Not done (blocker)
- App.tsx still has no ClerkProvider — the login wall does NOT activate even in live mode
- Layout.tsx has no mode banner, no UserButton / sign-in button

## Key implementation notes
- clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)
- clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL (empty string in dev = omit)
- ClerkProvider must be INSIDE WouterRouter (needs useLocation for routerPush/routerReplace)
- Routes must use /sign-in/*? and /sign-up/*? (with /*? wildcard for Clerk sub-routes)
- ahughes@affinityrisk.com auto-gets super_admin + approved on JIT provision

**Why:** ClerkProvider needs the wouter Router in context to call useLocation for push/replace navigation callbacks.
**How to apply:** Wrap with WouterRouter first, then ClerkProvider inside using useLocation.
