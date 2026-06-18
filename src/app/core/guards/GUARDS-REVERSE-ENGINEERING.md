# Guards Module — Complete Reverse Engineering Analysis

---

# 1. Business Purpose

This module implements **route-level access control** for the Cinemaverse application. It enforces two distinct authorization layers:

## authGuard — Authentication Guard

**Problem solved**: Prevents unauthenticated users from accessing protected routes.

**Workflow**:
```
User navigates to /admin/dashboard
  ↓
Route configuration has canActivate: [authGuard]
  ↓
authGuard evaluates: is user logged in?
  ├─ Yes → route activated
  └─ No → redirect to /login
```

**Business rules**:
- A user is considered authenticated if EITHER the in-memory signal says so OR a token exists in localStorage
- Token existence implies a valid session (server validates on each API call)

## roleGuard — Role-Based Authorization Guard

**Problem solved**: Restricts routes to users with specific roles (RBAC — Role-Based Access Control).

**Workflow**:
```
Route configuration:
{ path: 'admin', canActivate: [authGuard, roleGuard(['admin'])] }
  ↓
roleGuard evaluates: does the user's JWT contain an allowed role?
  ├─ Yes → route activated
  └─ No → redirect to /user/dashboard
```

**Business rules**:
- Role is extracted from JWT payload claims
- Supports multiple role claim formats: `role`, `Role`, and ASP.NET's full schema claim `http://schemas.microsoft.com/ws/2008/06/identity/claims/role`
- Admins redirected to dashboard if they don't have the required role (graceful degradation)
- Case-insensitive role matching (`toLowerCase()`)

---

# 2. High-Level Architecture

## Module Architecture

```
core/guards/
├── auth.guard.ts          ← Barrel re-export (delegates to auth/guards/auth.guard.ts)
└── role.guard.ts          ← Standalone implementation (self-contained RBAC logic)
```

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                     ROUTER LAYER                             │
│  Route config specifies: canActivate: [authGuard, roleGuard] │
└────────────────────────┬────────────────────────────────────┘
                         │
           ┌─────────────┴─────────────┐
           ▼                           ▼
┌──────────────────┐      ┌──────────────────────┐
│   authGuard      │      │    roleGuard         │
│  (CanActivateFn) │      │  (higher-order fn)   │
│                  │      │                      │
│  Checks:         │      │  Checks:             │
│  - signal        │      │  - JWT role claim    │
│  - localStorage  │      │  - allowedRoles[]    │
└───────┬──────────┘      └──────────┬───────────┘
        │                            │
        ▼                            ▼
┌──────────────────┐      ┌──────────────────────┐
│ AuthStateService │      │   TokenService       │
│ (signal)         │      │   (localStorage)     │
│ isAuthenticated  │      │   getToken()         │
└──────────────────┘      └──────────────────────┘
                                     │
                                     ▼
                            ┌──────────────────────┐
                            │  JWT Payload         │
                            │  (client-side decode)│
                            │  role claim          │
                            └──────────────────────┘
```

## Layer Mapping

| Layer | authGuard | roleGuard |
|-------|-----------|-----------|
| Routing | Receives route activation request | Receives route activation request |
| State | Reads `AuthStateService` signal | Reads `TokenService` (localStorage) |
| Decoding | None | JWT payload parsing for role claim |
| Decision | `true` or `UrlTree('/login')` | `true` or `UrlTree('/user/dashboard')` |
| Rendering | Route activated or redirected | Route activated or redirected |

## Ownership

| Concern | Owner |
|---------|-------|
| Authentication decision | `authGuard` (delegates to `AuthStateService` + `TokenService`) |
| Authorization decision | `roleGuard` (self-contained with JWT parsing) |
| Role extraction | `extractRoleFromToken()` (standalone function in `role.guard.ts`) |
| Token storage | `TokenService` |
| Route activation | Angular Router (`CanActivateFn` contract) |

## Trust Boundaries

```
Client-side guard evaluation          Server-side enforcement
┌─────────────────────┐               ┌──────────────────────┐
│ authGuard checks:   │               │ Backend validates:   │
│ - signal            │               │ - JWT signature      │
│ - localStorage      │               │ - token expiry       │
│                     │               │ - role claims        │
│ roleGuard checks:   │  ←── HTTPS    │ - endpoint authz     │
│ - JWT role claim    │               │                      │
│ (no verification)   │               │                      │
└─────────────────────┘               └──────────────────────┘
```

**Critical insight**: Guards are UX-only. They prevent the UI from rendering unauthorized views and avoid wasted API calls. The SERVER is the real authorization boundary — it validates JWT signatures and enforces endpoint-level permissions. A manipulated client guard cannot bypass server security.

---

# 3. Reactive Graph Visualization

## authGuard Reactive Graph

```
AuthStateService.isAuthenticatedSignal (WritableSignal<boolean>)
    │
    ├── .asReadonly() → Signal<boolean>
    │     │
    │     ├── authGuard(): reads sync → boolean
    │     │     │
    │     │     ├── true → navigation proceeds
    │     │     └── false → fallback to TokenService
    │     │
    │     └── toObservable() → Observable<boolean>
    │           │
    │           └── AuthService.isAuthenticatedObservable
    │
TokenService.getToken() (non-reactive, localStorage read)
    │
    └── authGuard(): fallback when signal is false
          │
          ├── truthy → navigation proceeds
          └── falsy → UrlTree('/login')
```

**Reactive characteristics**: Signal read is synchronous. No dependency registration happens because `authGuard` is NOT a reactive context (it's a plain function call during navigation). The signal is read like a plain getter — no consumer is registered in the dependency graph.

## roleGuard Reactive Graph

```
roleGuard(allowedRoles: string[])
    │
    ├── Input parameter: allowedRoles[] (compile-time known)
    │
    ├── TokenService.getToken() → string | null
    │     │
    │     └── extractRoleFromToken(token)
    │           │
    │           ├── JWT split → payload decoding → JSON parse
    │           │
    │           └── Claim resolution pipeline:
    │                 ├── 'role' claim
    │                 ├── 'Role' claim
    │                 └── ASP.NET full schema claim
    │
    ├── role = extractRoleFromToken(...)
    │
    ├── normalizedAllowed = allowedRoles.map(toLowerCase)
    ├── normalizedRole = role?.toLowerCase()
    │
    └── Decision:
          ├── role exists AND allowedRoles.includes(role) → true
          └── otherwise → UrlTree('/user/dashboard')
```

**Reactive characteristics**: Zero reactive primitives. Pure synchronous computation. No signals, no observables. `extractRoleFromToken` is a pure function (same token → same result, no side effects).

---

# 4. Feature Decomposition

## 4.1 authGuard — Authentication Guard

### Purpose
Determine if the current user is authenticated and either allow route activation or redirect to login.

### Code

```typescript
export const authGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const tokenService = inject(TokenService);
  const router = inject(Router);

  return authState.isAuthenticated() || tokenService.isLoggedIn() ? true : router.createUrlTree(['/login']);
};
```

### Inputs
- None explicitly (the `() =>` ignores `route` and `state` parameters)
- Implicit: `AuthStateService.isAuthenticated` signal, `TokenService.getToken()` return value

### Outputs
- `true` — allow navigation (user is authenticated)
- `UrlTree` — redirect to `/login` (user is not authenticated)

### Execution Pipeline

```
1. Navigation start: User or app triggers navigation to a protected route
   ↓
2. Router reads route config:
   { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] }
   ↓
3. Router calls authGuard() — injects dependencies
   ↓
4. Signal read: authState.isAuthenticated()
   - Synchronous read of SignalNode.currentValue
   - Returns false (if AuthService hasn't hydrated yet)
   - NOT a reactive registration — guard runs outside a reactive context
   ↓
5. Fallback: tokenService.isLoggedIn()
   - localStorage.getItem('cinemaverse_token')
   - Returns !!token — synchronous boolean
   ↓
6. Decision:
   - true (from signal or localStorage) → return true → navigation proceeds
   - false (both checks fail) → return UrlTree('/login') → redirect
```

### Line-by-Line Analysis

```typescript
// Line 1: import { inject } from '@angular/core';
```
`inject` is the runtime DI resolution function. It works ONLY inside an injection context (currently: this function is called by the router within a DI context).

**Ivy/compiler behavior**: `inject` generates no special compiler output. At runtime, it reads from the current `Injector` stored on a global/thread-local stack (`angularInjector`). The router sets up the injection context before calling guard functions.

```typescript
// Line 2: import { CanActivateFn, Router } from '@angular/router';
```
`CanActivateFn` — the type for functional route guards (Angular 15+). Previously, guards were class-based (`@Injectable({...}) export class AuthGuard implements CanActivate`).

**Router import**: `Router` is the singleton service managing navigation state, route configuration, and URL transitions.

```typescript
// Line 3-4: import { AuthStateService } from '../services/auth-state.service';
//          import { TokenService } from '../services/token.service';
```
These are the two data sources for the guard decision.

```typescript
// Line 6: export const authGuard: CanActivateFn = () => {
```
**`export const`**: The guard is a const function, not a class. This is the functional guard pattern — tree-shakable, no decorator overhead, no class instantiation.

**`CanActivateFn`**: The type annotation:
```typescript
type CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree;
```

The guard IGNORES the `route` and `state` parameters (empty parameter list `()` instead of `(route, state)`). This is fine for a global auth check that doesn't depend on route metadata.

**`=>`**: Arrow function. Preserves lexical `this` (not needed here since no `this` usage). More importantly, it's a new Function object allocated each time? No — `authGuard` is a const, and this arrow function is the value. It's called by the router but the function itself is allocated once at module parse time.

```typescript
// Line 7:   const authState = inject(AuthStateService);
```
**Runtime**: When the router calls `authGuard`, it wraps the call in an injection context. `inject(AuthStateService)` resolves the singleton from the root injector (both services are `providedIn: 'root'`).

**DI resolution algorithm**:
1. Check current `Injector`'s `records` map for `AuthStateService`
2. If found and it's a singleton: return existing instance
3. If not instantiated yet: create via factory, store, return
4. If not found in current injector: check parent injector (recursive)
5. If not found anywhere: throw `NullInjectorError`

```typescript
// Line 8:   const tokenService = inject(TokenService);
```
Same DI resolution. Two separate `inject` calls, two separate lookups. Each is O(depth of injector tree) which is effectively O(1) for root-scoped services.

```typescript
// Line 9:   const router = inject(Router);
```
`Router` is provided by `RouterModule.forRoot()` or `provideRouter()`. It lives in the root injector.

```typescript
// Line 11:   return authState.isAuthenticated() || tokenService.isLoggedIn() ? true : router.createUrlTree(['/login']);
```
**Expression evaluation order**:
1. `authState.isAuthenticated()` — signal read, synchronous, returns boolean
2. If `true`: short-circuit, `true || ...` = `true`, returns `true`
3. If `false`: evaluate `tokenService.isLoggedIn()`
   - `tokenService.getToken()` → `localStorage.getItem(...)` → synchronous I/O
   - `!!result` → boolean
4. If either is `true`: ternary → `true`
5. If both `false`: ternary → `router.createUrlTree(['/login'])`

**`createUrlTree`**: Returns a `UrlTree` object. The router checks if the result is a `UrlTree` instance. If yes, it cancels the current navigation and starts a new one to the tree.

**The `||` short-circuit is a performance optimization**: If the signal is already `true`, no `localStorage` read is needed. The signal read is ~0.1µs; localStorage read is ~100µs. The optimization saves 100µs on the common path (already authenticated).

### Edge Cases

1. **AuthService not yet instantiated**: Signal is `false`. `tokenService.isLoggedIn()` fallback catches this. `TokenService` is a lightweight service without complex dependencies — it's likely instantiated immediately.

2. **Token exists but is expired**: Guard returns `true` (token exists). The first API call gets 401. `refreshTokenInterceptor` catches it, clears tokens, and redirects to login. **UX issue**: user sees a flash of dashboard before redirect.

3. **Multiple rapid navigations**: Guard is synchronous and side-effect-free. Multiple calls are safe — no race conditions.

---

## 4.2 roleGuard — Role-Based Authorization Guard

### Purpose
Restrict route access to users with specific roles. A **higher-order function** that takes allowed roles and returns a `CanActivateFn`.

### Code

```typescript
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const tokenService = inject(TokenService);
    const router = inject(Router);
    const role = extractRoleFromToken(tokenService.getToken());
    const normalizedAllowedRoles = allowedRoles.map((value) => value.toLowerCase());
    const normalizedRole = role?.toLowerCase();

    if (!normalizedRole || !normalizedAllowedRoles.includes(normalizedRole)) {
      return router.createUrlTree(['/user/dashboard']);
    }

    return true;
  };
};
```

### Inputs
- **`allowedRoles: string[]`** — array of role names permitted to access the route (e.g., `['admin']`, `['admin', 'moderator']`)
- **Token** (implicit via `TokenService.getToken()`) — the user's JWT from localStorage

### Outputs
- `true` — allow navigation (user has an allowed role)
- `UrlTree` — redirect to `/user/dashboard` (user doesn't have an allowed role)

### Execution Pipeline

```
1. Route configuration specifies roleGuard with allowed roles:
   { path: 'admin', canActivate: [roleGuard(['admin'])] }
   ↓
2. Router evaluates canActivate array
   ↓
3. roleGuard(['admin']) is called — this is the OUTER function
   ↓
4. The OUTER function creates a CLOSURE over allowedRoles
   and returns the INNER function (the actual CanActivateFn)
   ↓
5. Router calls the INNER function
   ↓
6. inject(TokenService) — resolves singleton
   ↓
7. tokenService.getToken() — localStorage read
   ↓
8. extractRoleFromToken(token):
   a. Check token is not null/empty
   b. Split JWT by '.' → [header, payload, signature]
   c. Take payload (index 1)
   d. Base64url → Base64 conversion
   e. atob → Latin-1 string
   f. Percent-encode each byte
   g. decodeURIComponent → UTF-8 string
   h. JSON.parse → object
   i. Validate isRecord
   j. Check claims:
      - 'role' (lowercase)
      - 'Role' (capitalized)
      - ASP.NET full schema claim
   k. Return role string or null
   ↓
9. Normalize: allowedRoles → toLowerCase(), role → toLowerCase()
   ↓
10. Check: normalizedRole exists AND allowedRoles.includes(normalizedRole)?
    ├─ Yes → return true
    └─ No → return UrlTree('/user/dashboard')
```

### The Higher-Order Function Pattern (Critical Architectural Insight)

```typescript
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => { /* guard logic */ };
};
```

This is a **higher-order function** — a function that returns a function. This pattern is necessary because:

1. **`CanActivateFn` signature** takes `(route, state)` but has no parameter for role configuration
2. **The route data** could be used (`route.data.roles`), but that couples the guard to route metadata
3. **Factory pattern** allows compile-time configuration in the route definition:

```typescript
// Route config:
{
  path: 'admin-panel',
  component: AdminComponent,
  canActivate: [authGuard, roleGuard(['admin'])]
  //                           ^^^^^^^^^^^^^
  //              Allowed roles specified at route definition time
}
```

**Closure mechanics**: `allowedRoles` is captured by the inner function's closure. When the outer `roleGuard(['admin'])` executes at module load time, `allowedRoles` is stored in the closure scope of the returned inner function. Each time the inner function runs (on navigation), it accesses `allowedRoles` from the closure — it does NOT re-read from the route config.

**Memory**: Each unique `roleGuard(['admin', 'moderator'])` call creates:
- 1 outer function execution context (immediately garbage collected after inner function creation)
- 1 closure scope (retains `allowedRoles` reference)
- 1 inner function object

These persist as long as the route configuration references them (effectively the app's lifetime).

### Line-by-Line Analysis

```typescript
// Line 1-2: import { inject } from '@angular/core';
//           import { CanActivateFn, Router } from '@angular/router';
```
Same DI and router infrastructure as `authGuard`.

```typescript
// Line 3: import { TokenService } from '../auth/services/token.service';
```
Only `TokenService` is needed (not `AuthStateService`). Role is extracted from the JWT directly, not from in-memory state.

```typescript
// Line 5: export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
```
**Generic-less design**: `allowedRoles: string[]` is always `string[]`. No TypeScript generic parameter. This could be enhanced to use string literal unions:
```typescript
export const roleGuard = <T extends string>(allowedRoles: T[]): CanActivateFn => { ... };
```

```typescript
// Line 6:   return () => {
```
The inner function. TypeScript infers its return type as `boolean | UrlTree` from the `CanActivateFn` return annotation.

```typescript
// Line 7:     const tokenService = inject(TokenService);
```
**Performance**: `inject` runs on EVERY navigation that hits this guard. For a frequently navigated route, this means repeated DI resolution. In practice, DI resolution for `providedIn: 'root'` is O(1) — a map lookup — so this is negligible (~0.01µs).

```typescript
// Line 8:     const router = inject(Router);
```

```typescript
// Line 9:     const role = extractRoleFromToken(tokenService.getToken());
```
**Two operations in one expression**:
1. `tokenService.getToken()` — synchronous localStorage read
2. `extractRoleFromToken(...)` — JWT parsing + claim extraction

```typescript
// Line 10-11:     const normalizedAllowedRoles = allowedRoles.map((value) => value.toLowerCase());
//               const normalizedRole = role?.toLowerCase();
```
**Case-insensitive matching**: `allowedRoles.map(toLowerCase)` creates a NEW array each time the guard runs. This is O(n) in the number of allowed roles (usually 1-3, so negligible).

**Optimization opportunity**: The `normalizedAllowedRoles` array is recomputed on every guard execution but never changes between executions (it depends on the closure-captured `allowedRoles`). Could be computed once in the outer function:

```typescript
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  const normalizedAllowedRoles = allowedRoles.map((value) => value.toLowerCase());
  return () => {
    // ... use normalizedAllowedRoles from closure (pre-computed)
  };
};
```

**`role?.toLowerCase()`**: Optional chaining — if `role` is `null`, the expression short-circuits to `undefined`. This means `normalizedRole` is either `string` (lowercased) or `undefined`.

```typescript
// Line 13-15:     if (!normalizedRole || !normalizedAllowedRoles.includes(normalizedRole)) {
//                   return router.createUrlTree(['/user/dashboard']);
//                 }
```
**Decision logic**:
- `!normalizedRole`: true if role is null/undefined. User has no role → deny.
- `!normalizedAllowedRoles.includes(normalizedRole)`: User's role is not in the allowed list → deny.
- Denial redirect is to `/user/dashboard` (not `/login`). This is important: an authenticated user without the right role should see their dashboard, not the login page.

```typescript
// Line 17:     return true;
```
Explicit allow. The route is activated.

---

## 4.3 extractRoleFromToken — JWT Role Extraction

### Purpose
Parse a JWT and extract the user's role from various possible claim formats.

### Code

```typescript
function extractRoleFromToken(token: string | null): string | null {
  if (!token) { return null; }

  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) { return null; }

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );

    const payload: unknown = JSON.parse(json);
    if (!isRecord(payload)) { return null; }

    const directRole = readStringClaim(payload, 'role') ?? readStringClaim(payload, 'Role');
    if (directRole) { return directRole; }

    const schemaRoleClaim = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    if (typeof schemaRoleClaim === 'string') { return schemaRoleClaim; }
    if (Array.isArray(schemaRoleClaim)) {
      return schemaRoleClaim.find((value): value is string => typeof value === 'string') ?? null;
    }

    return null;
  } catch {
    return null;
  }
}
```

### Claim Resolution Algorithm

```
Input: token (JWT string or null)
  │
  ├─ null? → return null
  │
  ├─ Try block:
  │    ├─ Split by '.' → [header, payload, signature]
  │    ├─ No payload? → return null
  │    ├─ Base64url → Base64 decode
  │    ├─ JSON parse → object
  │    ├─ Not a record? → return null
  │    │
  │    ├─ Check 1: payload['role'] (lowercase, simple key)
  │    │   └─ exists and string? → return it
  │    │
  │    ├─ Check 2: payload['Role'] (capitalized, alternative simple key)
  │    │   └─ exists and string? → return it
  │    │
  │    ├─ Check 3: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
  │    │   (ASP.NET full claim URI)
  │    │   ├─ string? → return it
  │    │   ├─ string[]? → return first element
  │    │   └─ else → fall through
  │    │
  │    └─ No claim found → return null
  │
  └─ Catch (JSON parse error, base64 error, etc.) → return null
```

**Why three claim formats**:

| Claim | Format | Source |
|-------|--------|--------|
| `role` | Simple lowercase | Generic JWT, custom backends |
| `Role` | Capitalized | Some .NET configurations |
| Full schema URI | `http://schemas.microsoft.com/...` | ASP.NET Identity default claims |

The ASP.NET Identity framework stores roles under the full schema URI by default. When the application uses `User.IsInRole("admin")` or `[Authorize(Roles="admin")]`, ASP.NET emits this claim with the full namespace. However, custom JWT middleware might use the simple `role` claim. Supporting all three ensures compatibility with various backend configurations.

**The `role` vs `Role` distinction**: JSON property names are case-sensitive. If the backend serializes claims as `{"Role": "admin"}` (capital R), reading `payload['role']` returns `undefined`. The `??` operator tries the alternative.

**Array handling for schema claim**: ASP.NET can emit multiple role claims as an array when the user has multiple roles. The code returns the FIRST string role. This is a simplification — a more complete implementation would check if ANY of the user's roles matches the allowed roles.

### Algorithmic Complexity

| Step | Complexity |
|------|-----------|
| `token.split('.')` | O(n) in token length |
| Base64 decode + URI decode | O(n) in payload size |
| `JSON.parse` | O(n) in JSON size |
| Claim lookups | O(1) each (object property access) |
| Array find (schema claim) | O(k) where k = number of roles |

Total: O(n) where n ≈ 200-500 bytes for a typical JWT payload. Negligible in practice.

---

# 5. Runtime Execution Flow

## 5.1 Full Navigation with Guard Evaluation

```
1. User clicks <a routerLink="/admin/dashboard"> or router.navigate(['/admin/dashboard'])
   ↓
2. Router.parseUrl('/admin/dashboard') → UrlTree
   ↓
3. Router recognizes route:
   { path: 'admin/dashboard', component: DashboardComponent, canActivate: [authGuard, roleGuard(['admin'])] }
   ↓
4. Router creates navigation transaction
   ↓
5. Router runs guards in parallel (or series, depending on implementation):
   ↓
   ├─ Guard 1: authGuard
   │   ↓
   │   Router sets injection context
   │   ↓
   │   inject(AuthStateService) → resolves singleton
   │   ├─ isAuthenticated() → reads SignalNode.currentValue
   │   ├─ true? → return true (short-circuit, skip localStorage)
   │   └─ false? → continue
   │   ↓
   │   inject(TokenService) → resolves singleton
   │   ├─ isLoggedIn() → localStorage.getItem('cinemaverse_token')
   │   ├─ truthy? → return true
   │   └─ falsy? → return UrlTree('/login')
   │
   ├─ Guard 2: roleGuard(['admin'])
   │   ↓
   │   OUTER function already executed at route load time
   │   INNER function runs now
   │   ↓
   │   Router sets injection context
   │   ↓
   │   inject(TokenService) → resolves singleton
   │   ↓
   │   getToken() → localStorage read → "eyJ..."
   │   ↓
   │   extractRoleFromToken("eyJ..."):
   │     ├─ base64url decode
   │     ├─ JSON.parse → { sub: "123", role: "admin", ... }
   │     ├─ payload['role'] = "admin" → FOUND
   │     └─ return "admin"
   │   ↓
   │   role = "admin"
   │   normalizedAllowed = ["admin"] (pre-lowercased from 'admin')
   │   normalizedRole = "admin" (lowercased from "admin")
   │   ↓
   │   includes check: ["admin"].includes("admin") → true
   │   ↓
   │   return true
   │
   ↓
6. ALL guards returned true
   ↓
7. Router activates route:
   a. Resolves component
   b. Runs resolvers
   c. Instantiates component
   d. Renders view
```

## 5.2 Guard Return Value Handling by Router

```
guard() returns:
    │
    ├─ boolean true
    │   └─ Router: guard passed, continue to next guard or activate
    │
    ├─ boolean false
    │   └─ Router: navigation cancelled, does NOT redirect
    │      (router.navigate returns false Promise)
    │
    ├─ UrlTree
    │   └─ Router: cancels current navigation, redirects to UrlTree
    │      This is the correct pattern for redirecting guards
    │
    ├─ Observable<boolean | UrlTree>
    │   └─ Router: subscribes, waits for first emission, uses value
    │
    └─ Promise<boolean | UrlTree>
        └─ Router: awaits Promise, uses resolved value
```

Important: `boolean false` does NOT redirect. It just cancels navigation with no redirect. Both guards in this codebase return `UrlTree` for denial, not `false`. This ensures users always end up somewhere meaningful.

---

# 6. Runtime Timeline Analysis

| Operation | Trigger | When | Subsystem | Sync/Async |
|-----------|---------|------|-----------|------------|
| `authGuard()` call | Navigation start | Router guard evaluation | Router | Sync |
| `inject(AuthStateService)` | Guard execution | Inside guard function | Angular DI | Sync |
| `isAuthenticated()` signal read | Guard execution | Signal read | Signals engine | Sync (read, no registration) |
| `tokenService.isLoggedIn()` | Guard execution | Method call | localStorage | Sync |
| `createUrlTree('/login')` | Denial decision | Guard return | Router | Sync |
| `roleGuard(['admin'])` | Module load / route init | Static route analysis | Compiler/router init | Sync |
| Inner guard function | Navigation start | Router guard evaluation | Router | Sync |
| `extractRoleFromToken()` | Guard execution | JWT parsing | None (pure function) | Sync |
| Navigation redirect | UrlTree returned | After all guards resolve | Router | Async (new navigation) |

**Key insight**: ALL guard operations are synchronous. The router evaluates guards synchronously, collecting results. Only if a guard returns `Observable` or `Promise` does the router wait asynchronously. Since both guards in this codebase return synchronous `boolean | UrlTree`, the entire guard evaluation completes in a single synchronous tick.

---

# 7. Primitive/API Deep Dive

## 7.1 CanActivateFn

### A. Conceptual Definition
`CanActivateFn` is a function type that determines whether a route can be activated. It's the functional successor to the class-based `CanActivate` interface (Angular <15).

### B. The Core Problem It Solves
Routes need access control. Before Angular 15, you had to create a class-based guard:

```typescript
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService) {}
  canActivate(): boolean { return this.auth.isLoggedIn(); }
}
```

This required:
- A class definition
- An `@Injectable` decorator
- A provider registration
- Constructor injection
- Interface implementation

Functional guards eliminate all this boilerplate.

### C. Framework Design Motivation

Angular 15+ moved toward functional, tree-shakeable patterns:
- `CanActivateFn` instead of `CanActivate` class
- `HttpInterceptorFn` instead of `HttpInterceptor` class
- `Provider` functions instead of `NgModule` arrays

**Historical context**: Angular's original design was heavily class-based (Java/.NET influence). The shift toward functions was driven by:
1. **Tree-shaking**: Classes with decorators are harder to tree-shake
2. **Simplicity**: Functions are simpler mental model
3. **React/Solid influence**: The industry moved toward functional patterns
4. **Standalone components**: Classes are no longer required for DI

### D. Architectural Role

`CanActivateFn` bridges the Routing layer with the Auth layer:

```
Router ──→ CanActivateFn ──→ AuthService / TokenService
  │                              │
  │  Navigation decision         │  State/Token read
  │                              │
  ▼                              ▼
Route activated or redirected    Application state
```

### E. Internal Runtime Mechanics

When the router evaluates guards:

1. **Collection phase**: Router collects all `CanActivateFn` from the route's `canActivate` array (including inherited from parent routes)
2. **Evaluation phase**: Router calls each function:
   - Sets up injection context (`inject()` will work)
   - Calls the function
   - Checks return type
   - If `Observable`/`Promise`: subscribes/awaits
   - If `UrlTree`: records redirect
3. **Decision phase**: After all guards resolve:
   - If any guard returned `false`: cancel navigation
   - If any guard returned `UrlTree`: redirect to UrlTree
   - If all returned `true`: activate route

**Router internals** (simplified):
```typescript
// Inside Router (conceptual)
async runGuards(route: Route): Promise<boolean | UrlTree> {
  const guards = route.canActivate || [];
  for (const guard of guards) {
    const result = await this.evaluateGuard(guard);
    if (result instanceof UrlTree) return result;
    if (result === false) return false;
  }
  return true;
}

evaluateGuard(guard: CanActivateFn): any {
  // Set injection context
  const prevInjector = setCurrentInjector(this.injector);
  try {
    return guard(this.activatedRoute.snapshot, this.routerState.snapshot);
  } finally {
    setCurrentInjector(prevInjector);
  }
}
```

The `finally` block is critical — it restores the previous injector after guard evaluation, preventing injector leakage.

### F. Type Signature Deep Dive

```typescript
type CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree;
```

**Token-by-token**:

| Token | Meaning |
|-------|---------|
| `type` | Type alias — creates a name for a type |
| `CanActivateFn` | Name of the type |
| `=` | Type assignment |
| `(route, state) =>` | Function signature taking two parameters |
| `route: ActivatedRouteSnapshot` | Snapshot of the future route (immutable, contains params, data, queryParams, etc.) |
| `state: RouterStateSnapshot` | Snapshot of the router state (contains URL tree) |
| `=>` | Return type follows |
| `Observable<boolean \| UrlTree>` | Async: emits once and completes (first emission wins) |
| `\| Promise<boolean \| UrlTree>` | Async: resolves to value |
| `\| boolean` | Sync: simple yes/no |
| `\| UrlTree` | Sync: redirect to this URL |

**`UrlTree` vs string**: Guards return `UrlTree` (via `router.createUrlTree()`), not a string URL. `UrlTree` is the parsed representation that the router can merge with existing navigation.

### G. Input/Output Contract

| Aspect | Contract |
|--------|----------|
| Inputs | `ActivatedRouteSnapshot` (route being activated), `RouterStateSnapshot` (current router state) |
| Outputs | `boolean` (allow/deny), `UrlTree` (redirect), `Observable`, `Promise` |
| Side effects | None (guards should be pure decision functions) |
| State mutation | None (should not modify DI or router state) |

### H. Compiler/Ivy Integration

Functional guards have NO compiler integration. They are plain JavaScript functions. Unlike components, there's no:
- Template compilation
- Ivy instruction generation
- `@Component` decorator processing
- `@Injectable` metadata

The compiler doesn't touch `CanActivateFn` at all. It only processes the route configuration in `Route` arrays during JIT/AOT compilation.

### I. Failure Modes & Edge Cases

1. **Throwing an error**: If the guard throws, the router cancels navigation and logs an error. The user stays on the current page.
   ```typescript
   // Bad: throws on failure
   return authState.isAuthenticated() || throwError(...);
   
   // Good: returns UrlTree
   return isAuth ? true : router.createUrlTree(['/login']);
   ```

2. **Async guard never emits**: If returning an Observable that never emits, navigation hangs. Router has a timeout mechanism but it's a last resort.

3. **Multiple UrlTree returns**: If two guards both return UrlTree, the router uses the FIRST one (order of `canActivate` array).

### J. Common Mistakes

1. **Returning `false` instead of UrlTree**: `false` cancels navigation without redirect. User sees a blank/no-op navigation.
   ```typescript
   // Bad: no redirect, user stuck
   return false;
   
   // Good: explicit redirect
   return router.createUrlTree(['/login']);
   ```

2. **Calling `router.navigate()` inside guard**: Side effects in guards are an anti-pattern. Return `UrlTree` instead.
   ```typescript
   // Bad: executes navigation inside guard
   if (!isAuth) { router.navigate(['/login']); return false; }
   
   // Good: returns redirect instruction
   return isAuth ? true : router.createUrlTree(['/login']);
   ```

3. **Not using `inject()` at top level of guard**: `inject()` must be called directly inside the guard function body, not inside a callback or setTimeout.

### K. Interview Questions

**Q: Why did Angular move from class-based guards to functional guards?**

A: Three reasons: (1) Tree-shaking — classes with `@Injectable()` decorators are harder to eliminate even when unused; (2) Simplicity — a function is a simpler abstraction than a class with interface implementation; (3) Standalone components — the framework is moving away from NgModules toward functional, tree-shakeable APIs.

**Q: What happens if two guards return different UrlTrees?**

A: The router uses the first UrlTree it encounters (in the order guards are listed in the `canActivate` array). The second redirect is ignored. This is why guard ordering matters — put the most important redirect (like auth check) first.

**Q: Can a CanActivateFn be async? How?**

A: Yes — return a `Promise<boolean | UrlTree>` or `Observable<boolean | UrlTree>`. The router subscribes/awaits the result. For example, an async guard might call an API to verify token validity.

---

## 7.2 Higher-Order Function Pattern (roleGuard)

### A. Conceptual Definition

A **higher-order function** is a function that either takes a function as an argument or returns a function. `roleGuard` is a higher-order function that RETURNS a `CanActivateFn`.

### B. The Core Problem It Solves

`CanActivateFn` has a fixed signature `(route, state) => ...`. There's no parameter for "which roles are allowed." The higher-order function pattern solves this by:

1. Outer function receives configuration (`allowedRoles`)
2. Inner function implements the guard logic using the captured configuration

### C. Runtime Mechanics

```typescript
// At route config evaluation time (module load / bootstrap):
const guardFn = roleGuard(['admin']);
//   ┌─ outer fn executes:
//   │   allowedRoles = ['admin']
//   │   creates closure
//   │   returns inner function
//   └─ guardFn = () => { ... }

// At navigation time:
const result = guardFn();
//   ┌─ inner fn executes:
//   │   inject(TokenService)
//   │   extractRoleFromToken(getToken())
//   │   check: allowedRoles.includes(role)
//   │   return true or UrlTree
//   └─ result
```

### D. Closure Mechanics

When `roleGuard(['admin'])` executes:
1. `allowedRoles` parameter is allocated in the outer function's stack frame
2. The inner arrow function `() => { ... }` references `allowedRoles`
3. This reference prevents `allowedRoles` from being garbage collected
4. The inner function + referenced variables = **closure**

The closure scope lives as long as the inner function is referenced. Since the route configuration holds a reference:
```typescript
canActivate: [authGuard, roleGuard(['admin'])]
//                      ^^^^^^^^^^^^^^^^^^^^
//         Reference held in route config array
```
— the closure lives for the entire application lifetime.

### E. Performance Characteristics

- **Outer function**: Runs once at route configuration time. Negligible cost.
- **Inner function**: Runs on every navigation to the protected route. Cost = ~100µs (localStorage read + JWT parsing).
- **Closure memory**: ~100 bytes (captured array reference + function object).

---

## 7.3 inject() in Guard Context

### A. Conceptual Definition

`inject()` is the runtime dependency resolution function. It returns the instance associated with the given injection token from the current injector.

### B. Runtime Mechanics in Guards

```typescript
// In authGuard:
const authState = inject(AuthStateService);
```

**Step-by-step**:
1. Router calls `authGuard()` inside a try/finally block that sets the current injector
2. `inject(AuthStateService)` looks up the injection token in the current injector's records
3. Angular's injector tree: root injector → platform injector → NullInjector
4. `AuthStateService` is `@Injectable({ providedIn: 'root' })` → lives in root injector
5. First call: factory function runs → `new AuthStateService()` → instance cached
6. Returns instance

**Why `inject()` works here but not in arbitrary callbacks**: Angular maintains a global `currentInjector` variable (conceptual — actual implementation uses an `Injector` stack). This is set ONLY during DI contexts:
- Component/Service/Directive/Pipe constructors
- Factory functions
- Guard/Resolver/Interceptor functions

### C. Multiple inject() Calls

```typescript
// authGuard: three inject() calls
const authState = inject(AuthStateService);
const tokenService = inject(TokenService);
const router = inject(Router);
```

Each `inject()` call is independent. There's no batch optimization — three separate lookup operations. Each is O(depth of injector tree) ≈ O(1) for root-scoped services.

---

## 7.4 extractRoleFromToken — Standalone Function

### A. Conceptual Definition

A **standalone function** (not exported, not part of a class) that parses JWT and extracts role claims. It's a pure function — same input always produces the same output, no side effects.

### B. Architectural Significance

This function is NOT in a service. It's a module-scoped function in `role.guard.ts`. This is a deliberate choice:
- No DI needed (takes token as parameter)
- No state management
- Pure computation
- Easy to test (just `extractRoleFromToken('jwt')`)

**Tradeoff**: The JWT parsing logic is duplicated from `AuthService.decodeJwtPayload`. Two versions of the same base64url → JSON conversion. If the JWT format changes, both must be updated.

### C. TypeScript Type Behavior

```typescript
function extractRoleFromToken(token: string | null): string | null
```

**`string | null`**: Accepts nullable tokens. `null` short-circuits to `null` return. This eliminates null checks at call sites.

```typescript
const payload: unknown = JSON.parse(json);
if (!isRecord(payload)) { return null; }
```

**`unknown`** is the type-safe way to handle `JSON.parse`. Without `unknown`, `JSON.parse` returns `any`, which bypasses type checking. The `isRecord` type guard narrows `unknown` to `Record<string, unknown>`.

```typescript
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
```

**Type predicate**: `value is Record<string, unknown>` tells TypeScript that if this function returns `true`, the value is a `Record<string, unknown>`. Inside the `if` block, TypeScript narrows the type.

### D. Claim Resolution Logic

```typescript
const directRole = readStringClaim(payload, 'role') ?? readStringClaim(payload, 'Role');
```

**`readStringClaim`**:
```typescript
function readStringClaim(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === 'string' ? value : null;
}
```

This is a **type-safe accessor**: it verifies the claim value is actually a string before returning it. Without this, `payload['role']` could return `number | boolean | string[] | null | undefined`. The `typeof` guard eliminates all non-string cases.

**`??` (nullish coalescing)**: Checks for `null | undefined`. If `payload['role']` is `null`, `readStringClaim` returns `null`, `??` evaluates the next expression `readStringClaim(payload, 'Role')`. If `role` claim is missing (`undefined`), `readStringClaim` returns `null`, same behavior.

### E. ASP.NET Schema Claim Handling

```typescript
const schemaRoleClaim = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
if (typeof schemaRoleClaim === 'string') { return schemaRoleClaim; }
if (Array.isArray(schemaRoleClaim)) {
  return schemaRoleClaim.find((value): value is string => typeof value === 'string') ?? null;
}
```

**Why this exists**: ASP.NET Identity serializes roles under a full URI claim key. The type of this claim depends on how many roles the user has:
- Single role: `string` — `"admin"`
- Multiple roles: `string[]` — `["admin", "moderator"]`

The handler checks BOTH cases:
1. `typeof schemaRoleClaim === 'string'` — single role, direct return
2. `Array.isArray(schemaRoleClaim)` — multiple roles, return first string element

**`array.find(...)` with type predicate**:
```typescript
.find((value): value is string => typeof value === 'string')
```

The `: value is string` is a type predicate ON THE CALLBACK. It tells TypeScript that when the callback returns `true`, the array element is a `string`. This narrows the return type of `.find()` from `string | undefined` to `string | undefined` (same in this case, but important when the array contains mixed types).

---

## 7.5 router.createUrlTree()

### A. Conceptual Definition

Creates a `UrlTree` (parsed URL representation) from a commands array and optional extras. Unlike `router.navigate()`, it does NOT trigger navigation — it returns a data structure that the router can use for navigation.

### B. Why Return UrlTree Instead of Calling navigate

```typescript
// Anti-pattern: side effect in guard
router.navigate(['/login']);
return false;

// Correct: return navigation instruction
return router.createUrlTree(['/login']);
```

**Reasons**:
1. **Declarative**: Guards should DECIDE, not EXECUTE. Returning `UrlTree` is a decision; the router executes.
2. **Composability**: The router collects ALL guard results (from multiple guards, parent routes, etc.) and performs ONE navigation
3. **No redirect loops**: Router checks if the UrlTree equals the current URL before redirecting
4. **Predictability**: Side-effect-free guards are easier to test and reason about

### C. Internal Mechanics

```typescript
router.createUrlTree(['/login'])
```

1. Takes `commands: any[]` — same format as `router.navigate()`
2. Parses commands into a `UrlTree`:
   - `'/login'` → segment group with one segment
   - Relative commands like `['..', 'dashboard']` resolve relative to current route
3. Returns `UrlTree` — contains `root: UrlSegmentGroup`, `queryParams`, `fragment`

The router later compares this `UrlTree` against the current navigation target. If they match, no navigation happens (prevents loops).

---

## 7.6 isRecord Type Guard

### A. Conceptual Definition

A user-defined type guard that validates a value is a non-null, non-array object.

### B. Why Three Checks

```typescript
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
```

| Check | Purpose | JavaScript Quirk |
|-------|---------|------------------|
| `typeof value === 'object'` | Is it an object? | `typeof null === 'object'` (JS bug since 1995) |
| `value !== null` | Is it not null? | Required because of the above |
| `!Array.isArray(value)` | Is it not an array? | Arrays are objects but not records |

Without all three, `null` or `[]` would pass as `Record<string, unknown>`.

### C. TypeScript Narrowing

```typescript
const parsed: unknown = JSON.parse(json);
if (!isRecord(parsed)) { return null; }
// Inside this block: parsed is narrowed to Record<string, unknown>
const role = parsed['role']; // OK: indexed access
```

Before the guard: `parsed` is `unknown`. Cannot access properties.
After the guard: `parsed` is `Record<string, unknown>`. Can access properties with bracket notation.

---

# 8. Inter-Guard Communication and Ordering

## 8.1 Guard Execution Order

Route definition:
```typescript
{ path: 'admin', canActivate: [authGuard, roleGuard(['admin'])] }
```

Execution: `authGuard` FIRST, then `roleGuard`. But they're evaluated by the router in a specific way.

**Router evaluation** (conceptual):
```typescript
// Router guard evaluation algorithm (simplified)
for (const guard of route.canActivate) {
  const result = await toPromise(guard());
  if (result === false) { return false; }    // Cancel navigation
  if (result instanceof UrlTree) { return result; }  // Redirect
}
// All passed → activate route
```

The router evaluates guards SEQUENTIALLY. This means:
1. `authGuard` runs first
   - If it redirects → router stops, no `roleGuard` evaluation
   - If it returns `true` → router continues to `roleGuard`
2. `roleGuard` runs second
   - Already authenticated, now check role

**Why this order matters**: Without the `authGuard` first, `roleGuard` would run on unauthenticated users. `roleGuard` would redirect to `/user/dashboard` instead of `/login`. The user would be confused (never asked to log in, just redirected).

## 8.2 Combined Guard Strategy

```typescript
// Route guard composition pattern:
canActivate: [
  authGuard,           // 1. Is user logged in?
  roleGuard(['admin']), // 2. Does user have admin role?
]
```

Each guard has a SINGLE responsibility. `authGuard` handles authentication; `roleGuard` handles authorization. This follows the **Single Responsibility Principle** and makes the guards reusable:

```typescript
// Different routes with different role requirements:
{ path: 'admin',     canActivate: [authGuard, roleGuard(['admin'])] }
{ path: 'moderator', canActivate: [authGuard, roleGuard(['moderator'])] }
{ path: 'user',      canActivate: [authGuard, roleGuard(['user', 'admin', 'moderator'])] }
```

---

# 9. Data Flow Analysis

## 9.1 authGuard Data Flow

```
User navigates to /admin/dashboard
       │
       ▼
┌──────────────────┐
│  authGuard()     │
│  ┌────────────┐  │
│  │ inject()   │──┼──→ Root Injector → AuthStateService singleton
│  └────────────┘  │
│  ┌────────────┐  │
│  │ signalRead │──┼──→ isAuthenticated() → false (not hydrated)
│  └────────────┘  │
│  ┌────────────┐  │
│  │ inject()   │──┼──→ Root Injector → TokenService singleton
│  └────────────┘  │
│  ┌────────────┐  │
│  │ isLoggedIn │──┼──→ localStorage → 'cinemaverse_token' → "eyJ..."
│  └────────────┘  │
│         │        │
│      token exists│
│         │        │
│     return true  │
└────────┬─────────┘
         │
         ▼
Route /admin/dashboard activated
```

## 9.2 roleGuard Data Flow

```
User navigates to /admin/settings
       │
       ▼
┌────────────────────────┐
│ roleGuard(['admin'])   │
│  ┌──────────────────┐  │
│  │ inject()         │──┼──→ Root Injector → TokenService singleton
│  └──────────────────┘  │
│  ┌──────────────────┐  │
│  │ getToken()       │──┼──→ localStorage → "eyJ..."
│  └──────────────────┘  │
│  ┌──────────────────┐  │
│  │ extractRoleFrom  │  │
│  │ Token(token)     │  │
│  │                  │  │
│  │ 1. Split JWT     │  │
│  │ 2. Decode base64 │  │
│  │ 3. JSON.parse    │  │
│  │ 4. Check: 'role' │──┼──→ "admin"
│  │ 5. Normalize case│  │
│  └──────────────────┘  │
│  ┌──────────────────┐  │
│  │ includes check   │  │
│  │ ['admin']        │  │
│  │ .includes('admin')│──┼──→ true
│  └──────────────────┘  │
│         │              │
│     return true        │
└────────┬───────────────┘
         │
         ▼
Route /admin/settings activated
```

## 9.3 Denial Flow (Both Guards)

```
┌──────────────┐      ┌──────────────┐
│  authGuard   │      │  roleGuard   │
│  returns     │      │  returns     │
│  UrlTree     │      │  UrlTree     │
│  ('/login')  │      │  ('/dashboard')│
└──────┬───────┘      └──────┬───────┘
       │                     │
       ▼                     ▼
┌──────────────────────┐  ┌──────────────────────┐
│ Router cancels       │  │ Router cancels       │
│ current navigation   │  │ current navigation   │
│                      │  │                      │
│ Creates new          │  │ Creates new          │
│ navigation to /login │  │ navigation to        │
│                      │  │ /user/dashboard      │
│ URL changes to       │  │                      │
│ /login               │  │ URL changes to       │
│                      │  │ /user/dashboard      │
│ User sees login form │  │                      │
│                      │  │ User sees dashboard  │
└──────────────────────┘  └──────────────────────┘

             authGuard DENIAL         roleGuard DENIAL
User state:  Not authenticated        Authenticated but wrong role
UX message:  "Please log in"          "You don't have access"
Redirect to: /login                   /user/dashboard
```

---

# 10. State Management Analysis

## 10.1 Guard State Access Patterns

| Guard | State Source | Read Type | Reactive? |
|-------|-------------|-----------|-----------|
| `authGuard` | `AuthStateService.isAuthenticated` (signal) | Synchronous read | Signal read but NOT as a reactive consumer |
| `authGuard` | `TokenService.getToken()` (localStorage) | Synchronous read | Not reactive |
| `roleGuard` | `TokenService.getToken()` (localStorage) | Synchronous read | Not reactive |

## 10.2 Critical Difference: Signal Read Without Consumer Registration

When `authGuard` reads `authState.isAuthenticated()`, it reads the SignalNode's current value. However, this read does NOT register the guard as a consumer in the signal's dependency graph.

**Why**: Consumer registration only happens inside reactive contexts:
- `computed()` function body
- `effect()` function body
- Component template bindings (during change detection)

A `CanActivateFn` is NONE of these — it's a plain function called by the router. The signal read is just a function call that returns the current value.

**Implication**: If `authState.isAuthenticated` changes AFTER the guard has been evaluated, the guard is NOT re-evaluated. The signal change doesn't trigger guard re-check. The guard is stateless — it evaluates the current state once per navigation.

## 10.3 State Consistency

The guard evaluation is a **snapshot** of authentication state at the time of navigation:

```
Time T1: authGuard reads signal → false
Time T2: AuthService.login() completes → signal → true
Time T3: authGuard would say true, but it already ran at T1
```

This is correct behavior: the guard evaluates at navigation time. If auth state changes, the user must navigate again (or the app can re-navigate after login).

---

# 11. Algorithms & Control Flow

## 11.1 JWT Payload Decoding Algorithm (role.guard.ts)

```
Input: token (string | null)

1. Guard: token is null/empty?
   ├─ Yes → return null (short-circuit)
   └─ No → continue

2. TRY:
   a. Split: token.split('.') → [header, payload, signature]
   b. Take payload: result[1]
   c. Guard: payload is undefined?
      ├─ Yes → return null (malformed JWT)
      └─ No → continue
   
   d. Base64url → Base64:
      Replace '-' → '+'
      Replace '_' → '/'
   
   e. atob(base64) → Latin-1 string
   
   f. Unicode-safe conversion:
      For each character:
        charCodeAt(0) → byte
        toString(16) → hex
        padStart(2, '0') → 2-char hex
        prepend '%'
      → Percent-encoded string
   
   g. decodeURIComponent → UTF-8 string
   
   h. JSON.parse → unknown
   
   i. Guard: isRecord(payload)?
      ├─ No → return null
      └─ Yes → continue to claim extraction

3. Claim extraction:
   a. Check: payload['role'] → string?
      ├─ Yes → return it
      └─ No → continue
   b. Check: payload['Role'] → string?
      ├─ Yes → return it
      └─ No → continue
   c. Check: payload['http://schemas.microsoft.com/.../role']?
      ├─ string? → return it
      ├─ string[]? → return first string element
      └─ neither → continue
   d. Return null (no role claim found)

4. CATCH (any error):
   └─ return null
```

## 11.2 Guard Decision Algorithm

```
Input: roleGuard(allowedRoles)
       OR authGuard()

authGuard():
  1. signal = authState.isAuthenticated()
  2. if signal === true → return true
  3. token = tokenService.isLoggedIn()
  4. if token === true → return true
  5. return UrlTree('/login')

roleGuard(allowedRoles):
  1. token = tokenService.getToken()
  2. role = extractRoleFromToken(token)
  3. normalizedAllowed = allowedRoles.map(toLowerCase)
  4. normalizedRole = role?.toLowerCase()
  5. if (!normalizedRole) → return UrlTree('/user/dashboard')
  6. if (!normalizedAllowed.includes(normalizedRole)) → return UrlTree('/user/dashboard')
  7. return true
```

---

# 12. Performance Engineering Analysis

## 12.1 Guard Execution Cost

| Operation | Time | Frequency |
|-----------|------|-----------|
| `inject(AuthStateService)` | ~0.01µs | Per navigation (after first, cached singleton) |
| `isAuthenticated()` signal read | ~0.1µs | Per navigation |
| `tokenService.isLoggedIn()` | ~100µs | Per navigation (localStorage I/O) |
| JWT parse (decode + JSON) | ~10µs | Per navigation (only roleGuard) |
| Claim lookup | ~0.1µs | Per navigation (object property access) |
| `createUrlTree` | ~1µs | Per denial |

**Total cost per navigation (allow)**:
- `authGuard` only: ~0.1µs (signal) + 0µs (localStorage skipped due to short-circuit)
- `authGuard` + `roleGuard`: ~110µs

**Total cost per navigation (deny)**:
- `authGuard` deny: ~110µs (signal + localStorage + UrlTree)
- `roleGuard` deny: ~120µs (signal + localStorage + JWT parse + UrlTree)

## 12.2 LocalStorage Read Cost

`localStorage.getItem()` is ~100µs because it's synchronous I/O — the main thread blocks while the browser reads from disk. For a guard (evaluated once per navigation), this is acceptable. But 100 rapid navigations would block the main thread for ~10ms.

## 12.3 Optimization: Short-Circuit in authGuard

```typescript
return authState.isAuthenticated() || tokenService.isLoggedIn() ? ...
```

The `||` short-circuit means if the signal is `true`, `tokenService.isLoggedIn()` is NEVER called. This saves ~100µs on the common path (already authenticated user navigating between protected routes).

## 12.4 Optimization: Pre-compute Normalized Roles

Current code (recomputes on every guard execution):
```typescript
const normalizedAllowedRoles = allowedRoles.map((value) => value.toLowerCase());
```

Optimized (compute once in closure):
```typescript
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  const normalizedAllowedRoles = allowedRoles.map((value) => value.toLowerCase());
  return () => {
    // ... use pre-computed normalizedAllowedRoles
  };
};
```

For 1-3 roles, the difference is negligible. For 100+ roles (unlikely but possible), this would save O(n) on every guard execution.

## 12.5 Memory Allocations

| Operation | Allocations | Size |
|-----------|-------------|------|
| `inject()` | 0 (returns cached singleton) | 0 |
| Signal read | 0 | 0 |
| `getToken()` | 0 (localStorage returns string) | ~200 bytes (JWT string) |
| `extractRoleFromToken` | Multiple temporary allocations | ~500 bytes (base64 arrays, string copies, parsed JSON) |
| `normalizedAllowedRoles` | 1 array | ~50 bytes (2-3 strings) |
| `createUrlTree` | UrlTree object + UrlSegmentGroup | ~100 bytes |

Total per guard evaluation: ~1KB temporary allocations. With V8's generational GC, these are collected in the young generation quickly.

---

# 13. Scalability & Enterprise Analysis

## 13.1 What Breaks at Scale

### 1. Role Claim in JWT Only
The role is extracted from JWT on the CLIENT side. The JWT is decoded without signature verification. If the JWT contains stale role information (role changed since token issuance), the guard still uses the old role until the token expires.

**Enterprise solution**: Validate roles via API call on route activation (async guard):
```typescript
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    return authService.checkRole(allowedRoles).pipe(
      map(hasRole => hasRole ? true : inject(Router).createUrlTree(['/user/dashboard']))
    );
  };
};
```

### 2. Redirect to Dashboard Without Message
Both guards redirect without explaining WHY the user was redirected. Users might be confused: "Why am I on the dashboard? I clicked admin settings."

**Enterprise solution**: Pass redirect reason via query params:
```typescript
return router.createUrlTree(['/user/dashboard'], {
  queryParams: { reason: 'insufficient_role' }
});
```

### 3. No Role Hierarchy
The guard checks exact role matches (`allowedRoles.includes(role)`). There's no hierarchy (e.g., `admin` implies `moderator`, `moderator` implies `user`).

**Enterprise solution**: Role hierarchy:
```typescript
const ROLE_HIERARCHY = { admin: 3, moderator: 2, user: 1 };
const hasAccess = ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole];
```

### 4. Duplicate JWT Parsing Logic
`extractRoleFromToken` in `role.guard.ts` duplicates the JWT parsing from `AuthService.decodeJwtPayload`. If the JWT format changes, both must be updated.

**Enterprise solution**: Extract JWT parsing into a shared utility:
```typescript
// lib/jwt.ts
export function decodeJwtPayload<T>(token: string): T | null { ... }
export function getRoleFromToken(token: string | null): string | null { ... }
```

## 13.2 Architectural Evolution Paths

### Path 1: Permission-Based Access Control
Replace role-based with permission-based:
```typescript
export const permissionGuard = (requiredPerm: string): CanActivateFn => {
  return () => {
    const tokenService = inject(TokenService);
    const permissions = extractPermissionsFromToken(tokenService.getToken());
    return permissions.includes(requiredPerm)
      ? true
      : inject(Router).createUrlTree(['/403']);
  };
};

// Route: { path: 'delete-user', canActivate: [permissionGuard('users:delete')] }
```

### Path 2: Async Role Validation
Validate roles via API to handle role changes mid-session:
```typescript
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const http = inject(HttpClient);
    return http.get<{ roles: string[] }>('/api/auth/my-roles').pipe(
      map(response => response.roles.some(r => allowedRoles.includes(r))),
      map(hasRole => hasRole ? true : inject(Router).createUrlTree(['/403']))
    );
  };
};
```

### Path 3: Dynamic Route Configuration
Generate routes based on user roles:
```typescript
// In AppComponent or service:
const routes = user.isAdmin ? ADMIN_ROUTES : USER_ROUTES;
this.router.resetConfig(routes);
```

---

# 14. Security Analysis

## 14.1 Trust Boundaries

```
[Guard Decision - Client Side]          [API Authorization - Server Side]
┌──────────────────────────────┐       ┌──────────────────────────────┐
│ authGuard:                   │       │ Backend:                     │
│  "User has token → auth"     │       │  "Verify JWT signature →     │
│                              │       │   check expiry →             │
│ roleGuard:                   │       │   check role claim →         │
│  "JWT has role admin → ok"   │       │   allow/deny API access"     │
│                              │       │                              │
│ ⚠ NO SIGNATURE VERIFICATION │       │ ✓ SIGNATURE VERIFIED         │
│ ⚠ TOKEN NOT VALIDATED       │       │ ✓ TOKEN VALIDATED            │
└──────────────────────────────┘       └──────────────────────────────┘
```

**Critical security insight**: Guards are UX-only. They prevent:
- Rendering unauthorized UI components
- Wasted API calls to endpoints that will be rejected
- Confusing navigation to routes the user can't use

The SERVER is the real authorization boundary. A manipulated client (modified JS, browser dev tools, etc.) can bypass guards but CANNOT bypass server authorization.

## 14.2 JWT Client-Side Decoding (No Signature Verification)

Both `extractRoleFromToken` and `AuthService.decodeJwtPayload` decode JWT WITHOUT verifying the signature.

**Why this is correct**:
- The client doesn't have the server's signing key
- JWT verification is the server's job
- Client only reads unverified claims for UI purposes
- If token is manipulated, server rejects it anyway

**Risk**: A manipulated token could trick the client into showing admin UI to a non-admin user. But the server would reject every API call, making the admin UI useless.

## 14.3 XSS in JWT Claims

JWT claims are decoded from base64 and JSON.parsed. If the server puts malicious content in the role claim:

```javascript
// Malicious JWT payload encoded:
{ "role": "<img src=x onerror=alert('XSS')>" }
// Decoded:
extractRoleFromToken(token) → "<img src=x onerror=alert('XSS')>"
```

**Mitigation**: If this role is rendered in a template via `{{ role }}`, Angular's auto-escaping prevents XSS. If rendered via `[innerHTML]`, it's vulnerable. The guard does NOT render anything — it just compares strings and returns boolean/UrlTree. So there's no XSS vector here.

## 14.4 Role Spoofing

A user could manually store a JWT with an elevated role in localStorage. The client-side guard would see the role and allow navigation.

**Mitigation (server-side)**: The server verifies the JWT signature. A manually crafted JWT would fail signature verification. The guard allows navigation, but the first API call gets 401/403.

**UX implication**: The user sees the admin UI briefly before API calls fail. This is a minor UX concern but not a security vulnerability.

---

# 15. Testing Strategy

## 15.1 authGuard Unit Tests

```typescript
describe('authGuard', () => {
  // Setup: Mock AuthStateService, TokenService, Router
  let authState: jasmine.SpyObj<AuthStateService>;
  let tokenService: jasmine.SpyObj<TokenService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authState = jasmine.createSpyObj('AuthStateService', ['isAuthenticated']);
    tokenService = jasmine.createSpyObj('TokenService', ['isLoggedIn']);
    router = jasmine.createSpyObj('Router', ['createUrlTree']);

    // Override inject() to return mocks
    // (Requires TestBed setup)
  });

  it('should return true when signal indicates authenticated', () => {
    authState.isAuthenticated.and.returnValue(true);

    const result = authGuard();

    expect(result).toBeTrue();
    // localStorage should NOT be consulted
    expect(tokenService.isLoggedIn).not.toHaveBeenCalled();
  });

  it('should return true when token exists in localStorage', () => {
    authState.isAuthenticated.and.returnValue(false);
    tokenService.isLoggedIn.and.returnValue(true);

    const result = authGuard();

    expect(result).toBeTrue();
  });

  it('should redirect to /login when not authenticated', () => {
    authState.isAuthenticated.and.returnValue(false);
    tokenService.isLoggedIn.and.returnValue(false);
    const urlTree = new UrlTree();
    router.createUrlTree.and.returnValue(urlTree);

    const result = authGuard();

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toBe(urlTree);
  });

  it('should prefer signal over localStorage (short-circuit check)', () => {
    // Arrange: signal says true
    authState.isAuthenticated.and.returnValue(true);

    // Act
    const result = authGuard();

    // Assert: isLoggedIn should NOT be called (short-circuit)
    // This is a performance test, not functional
    expect(tokenService.isLoggedIn).not.toHaveBeenCalled();
  });
});
```

## 15.2 roleGuard Unit Tests

```typescript
describe('roleGuard', () => {
  let tokenService: jasmine.SpyObj<TokenService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    tokenService = jasmine.createSpyObj('TokenService', ['getToken']);
    router = jasmine.createSpyObj('Router', ['createUrlTree']);
  });

  it('should return true when user has an allowed role', () => {
    // JWT payload: { "role": "admin" }
    const jwtWithAdminRole = 'header.' + btoa(JSON.stringify({ role: 'admin' })) + '.signature';
    tokenService.getToken.and.returnValue(jwtWithAdminRole);

    const guard = roleGuard(['admin']);
    const result = guard();

    expect(result).toBeTrue();
  });

  it('should redirect when user does not have an allowed role', () => {
    const jwtWithUserRole = 'header.' + btoa(JSON.stringify({ role: 'user' })) + '.signature';
    tokenService.getToken.and.returnValue(jwtWithUserRole);
    const urlTree = new UrlTree();
    router.createUrlTree.and.returnValue(urlTree);

    const guard = roleGuard(['admin']);
    const result = guard();

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/user/dashboard']);
  });

  it('should redirect when there is no token', () => {
    tokenService.getToken.and.returnValue(null);
    const urlTree = new UrlTree();
    router.createUrlTree.and.returnValue(urlTree);

    const guard = roleGuard(['admin']);
    const result = guard();

    expect(result).toBe(urlTree);
  });

  it('should handle ASP.NET role claim URI', () => {
    const jwt = 'header.' + btoa(JSON.stringify({
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'admin'
    })) + '.signature';
    tokenService.getToken.and.returnValue(jwt);

    const guard = roleGuard(['admin']);
    const result = guard();

    expect(result).toBeTrue();
  });

  it('should handle multiple roles in ASP.NET claim', () => {
    const jwt = 'header.' + btoa(JSON.stringify({
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': ['admin', 'moderator']
    })) + '.signature';
    tokenService.getToken.and.returnValue(jwt);

    const guard = roleGuard(['admin']);
    const result = guard();

    expect(result).toBeTrue();
  });

  it('should be case-insensitive', () => {
    const jwtWithAdmin = 'header.' + btoa(JSON.stringify({ role: 'ADMIN' })) + '.signature';
    tokenService.getToken.and.returnValue(jwtWithAdmin);

    const guard = roleGuard(['Admin']);
    const result = guard();

    expect(result).toBeTrue();
  });

  it('should support multiple allowed roles', () => {
    const jwt = 'header.' + btoa(JSON.stringify({ role: 'moderator' })) + '.signature';
    tokenService.getToken.and.returnValue(jwt);

    const guard = roleGuard(['admin', 'moderator']);
    const result = guard();

    expect(result).toBeTrue();
  });

  it('should return a new function each time', () => {
    const guard1 = roleGuard(['admin']);
    const guard2 = roleGuard(['admin']);

    expect(guard1).not.toBe(guard2); // Different function references
  });
});
```

## 15.3 extractRoleFromToken Unit Tests

```typescript
describe('extractRoleFromToken', () => {
  it('should extract role from simple claim', () => {
    const token = 'h.' + btoa(JSON.stringify({ role: 'admin' })) + '.s';
    expect(extractRoleFromToken(token)).toBe('admin');
  });

  it('should extract role from capitalized claim', () => {
    const token = 'h.' + btoa(JSON.stringify({ Role: 'admin' })) + '.s';
    expect(extractRoleFromToken(token)).toBe('admin');
  });

  it('should extract role from ASP.NET schema claim', () => {
    const token = 'h.' + btoa(JSON.stringify({
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'admin'
    })) + '.s';
    expect(extractRoleFromToken(token)).toBe('admin');
  });

  it('should prefer simple role over schema claim', () => {
    const token = 'h.' + btoa(JSON.stringify({
      role: 'admin',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'user'
    })) + '.s';
    // Simple 'role' claim takes priority
    expect(extractRoleFromToken(token)).toBe('admin');
  });

  it('should return null for invalid JWT', () => {
    expect(extractRoleFromToken('invalid')).toBeNull();
    expect(extractRoleFromToken('')).toBeNull();
    expect(extractRoleFromToken(null)).toBeNull();
  });

  it('should return null when no role claim exists', () => {
    const token = 'h.' + btoa(JSON.stringify({ sub: '123', email: 'a@b.com' })) + '.s';
    expect(extractRoleFromToken(token)).toBeNull();
  });

  it('should handle unicode characters in token', () => {
    const payload = { role: 'administrátor' }; // accented character
    const token = 'h.' + btoa(JSON.stringify(payload)) + '.s';
    expect(extractRoleFromToken(token)).toBe('administrátor');
  });

  it('should return null for non-string role claim', () => {
    const token = 'h.' + btoa(JSON.stringify({ role: 123 })) + '.s';
    expect(extractRoleFromToken(token)).toBeNull();
  });
});
```

## 15.4 Integration Test: Combined Guards

```typescript
describe('Auth + Role Guard Integration', () => {
  it('should allow access when authenticated with correct role', () => {
    // Auth service says authenticated
    authState.isAuthenticated.and.returnValue(true);

    // Token has admin role
    tokenService.getToken.and.returnValue(
      'h.' + btoa(JSON.stringify({ role: 'admin' })) + '.s'
    );

    // Evaluate both guards sequentially (as router would)
    const authResult = authGuard();
    expect(authResult).toBeTrue();

    const roleResult = roleGuard(['admin'])();
    expect(roleResult).toBeTrue();
  });

  it('should redirect to login when not authenticated (roleGuard not evaluated)', () => {
    authState.isAuthenticated.and.returnValue(false);
    tokenService.isLoggedIn.and.returnValue(false);

    const result = authGuard();
    expect(result instanceof UrlTree).toBeTrue();

    // roleGuard should NOT be evaluated (router stops on first redirect)
    // In actual router, guards are sequential
  });
});
```

---

# 16. Common Engineering Mistakes

## 16.1 Beginner Mistakes

### 1. Returning `false` Instead of UrlTree

```typescript
// Bad: navigation cancelled, page blank, user confused
return false;

// Good: explicit redirect
return router.createUrlTree(['/login']);
```

### 2. Calling `router.navigate()` Inside Guard

```typescript
// Bad: side effect, also may cause redirect loops
router.navigate(['/login']);
return false;

// Good: return UrlTree, let router handle it
return router.createUrlTree(['/login']);
```

### 3. Not Using `inject()` at Top Level

```typescript
// Bad: inject() inside callback — no injection context
authGuard: CanActivateFn = () => {
  setTimeout(() => {
    const auth = inject(AuthService); // THROWS
  }, 0);
  return true;
};

// Good: inject() at top level of guard function
authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn();
};
```

## 16.2 Architectural Mistakes

### 1. Duplicate JWT Parsing

`extractRoleFromToken` duplicates `AuthService.decodeJwtPayload`. If the JWT format changes (e.g., different base64 implementation), both must be updated. A shared utility function would be better.

### 2. No Role Hierarchy

The guard checks exact role matches. `admin` cannot access routes meant for `superadmin`, `moderator` cannot access `user` routes unless explicitly listed. For large applications, this becomes unmanageable.

### 3. Guard Without authGuard Dependency

A route configured with `roleGuard` but without `authGuard`:
```typescript
{ path: 'admin', canActivate: [roleGuard(['admin'])] }
// Missing: authGuard
```

An unauthenticated user hitting this route would be redirected to `/user/dashboard` (from roleGuard) instead of `/login`. They'd never see the login form.

## 16.3 Performance Mistakes

### 1. Not Using Short-Circuit

```typescript
// Bad: always reads localStorage even when signal is true
const isAuthed = authState.isAuthenticated() || tokenService.isLoggedIn();

// Good: short-circuit prevents localStorage read
// This is what the current code does correctly
```

### 2. Recreating Closure on Every Navigation

If the guard function is recreated on every route definition evaluation (not the case here — `roleGuard` is called at route config time), the closure would be wasteful. The current pattern is correct.

## 16.4 Security Mistakes

### 1. Trusting Client-Side Role Check as Security Boundary

The role guard is a UX convenience, not security. If someone needs true role-based security, they MUST enforce it on the server. A client-side guard can be bypassed by modifying JS or using Postman/curl.

### 2. Storing Full Role in JWT Without Refresh

If a user's role changes (e.g., demoted from admin to user), the JWT in localStorage still says `admin` until the token expires. The guard allows access even though the server has revoked the role.

---

# 17. Senior-Level Engineering Insights

## 17.1 Why Guards Are Functions, Not Observables

The guard API supports `Observable | Promise | boolean | UrlTree`. In practice, MOST guards should return synchronous `boolean | UrlTree`:

- **Synchronous guards**: Read from localStorage, signal, or in-memory state. These are deterministic and instant.
- **Async guards**: Make HTTP requests to validate tokens/permissions. These introduce latency on EVERY navigation.

**Senior engineer heuristic**: If your guard makes an HTTP request, you're doing something wrong 90% of the time. Auth state should be maintained in the client (signal, localStorage, cookie). Async guards create a bad UX (navigation delay) and complicate loading states.

## 17.2 Why Role Guard Is a Higher-Order Function (And Why That Matters)

The higher-order function pattern for `roleGuard(['admin'])` was NOT chosen arbitrarily:

```typescript
// Alternative 1: Route data parameterization
canActivate: [(route) => roleGuard(route.data.roles)]
// Problem: couples guard to route structure

// Alternative 2: Class-based with @Input-like config
// Problem: class overhead

// Alternative 3: Function returning function (CHOSEN)
canActivate: [roleGuard(['admin'])]
// Benefits: explicit, typed, tree-shakeable, testable
```

The higher-order pattern wins because it separates configuration (which roles) from execution (does user have role?). Configuration happens at module load time; execution happens at navigation time.

## 17.3 Why Guards Don't Subscribe to Signals Reactively

A common question: "Why doesn't the guard re-evaluate when the signal changes?"

The answer is architectural: **Guards are stateless snapshot evaluators**. They run once per navigation and return a decision. If auth state changes, the user must navigate again (or the app triggers re-navigation after login).

**Why not make guards reactive?**
- Would require the router to subscribe to all dependencies and re-evaluate on any change
- Could cause infinite evaluation loops
- Would couple the router to the signal graph
- Navigation is an explicit user intent, not a reactive side effect

## 17.4 The Router's Guard Resolution Algorithm (Internal)

The router handles guards through a state machine:

```
IDLE → NAVIGATION_START → RUN_GUARDS → RUN_RESOLVERS → ACTIVATE
                                    ↕
                              GUARD_RESULT
                              ├─ true → RUN_RESOLVERS
                              ├─ false → NAVIGATION_CANCEL
                              └─ UrlTree → NAVIGATION_REDIRECT
```

The router collects ALL guards from the activated route AND its parent routes. Each guard is evaluated. If any guard returns `UrlTree`, the router:
1. Cancels the current navigation
2. Creates a new navigation to the UrlTree
3. The new navigation goes through the same guard pipeline

This is why guards should NOT call `router.navigate()` — it creates a nested navigation that bypasses the router's state machine.

## 17.5 Framework Philosophy: Guards vs Middleware

Angular's guard system is inspired by:
- **Express.js/Koa middleware**: Functions intercepting request processing
- **ASP.NET Authorization filters**: `[Authorize]` attributes on controllers
- **Java Servlet filters**: Request/response interception

The key difference: Angular guards intercept CLIENT-SIDE navigation, not server-side requests. They exist because SPAs handle routing on the client, where there's no server to enforce access control.

**Framework evolution**: Angular has moved from:
1. Class-based guards (`@Injectable() implements CanActivate`) — Angular 2-14
2. Functional guards (`CanActivateFn`) — Angular 15+
3. Future: potentially signal-based guards that react to state changes

## 17.6 Zone.js and Guard Evaluation

Guards run OUTSIDE Zone.js's tracking scope. The router explicitly invokes guard functions without Zone.js wrapping. This means:
- If a signal changes inside a guard, Zone.js does NOT trigger change detection
- If an async operation starts inside a guard, Zone.js does NOT trigger change detection on completion
- Guards are isolated from Angular's change detection cycle

This isolation is intentional: guards should not cause rendering side effects.

---

# 18. Cross-Framework Comparison

## 18.1 React Equivalent

React doesn't have built-in route guards. The common pattern is:

```jsx
// React Router v6: wrapper component
function RequireAuth({ children, allowedRoles }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

// Usage:
<Route path="/admin" element={
  <RequireAuth allowedRoles={['admin']}>
    <AdminPanel />
  </RequireAuth>
} />
```

**Comparison**:

| Aspect | Angular Guard | React RequireAuth |
|--------|---------------|-------------------|
| Type | Function returning decision | Component wrapping children |
| Execution | Router-managed, before component mount | Component render, after mount |
| Redirect | `UrlTree` returned to router | `<Navigate>` component rendered |
| Async | Observable/Promise | useEffect + state |
| Code location | Separate file | Inline component composition |
| Tree-shaking | Tree-shakeable (functions) | Component is bundled if imported |

**Key difference**: Angular guards run BEFORE the protected component is created. React's `<RequireAuth>` renders as part of the component tree, meaning the protected component may briefly start mounting before the guard check completes (if async).

## 18.2 Vue Equivalent

```javascript
// Vue Router: navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.allowedRoles && !to.meta.allowedRoles.includes(authStore.user.role)) {
    next('/dashboard');
  } else {
    next();
  }
});
```

**Comparison**:

| Aspect | Angular Guard | Vue Navigation Guard |
|--------|---------------|----------------------|
| Registration | `canActivate: [guard]` on each route | Global `beforeEach` or per-route `beforeEnter` |
| Next function | Return UrlTree | Call `next('/login')` |
| Multiple guards | Array of guards | Single function with conditionals |
| Reusability | Each guard is independent | Combined in global hook |
| Type safety | Full TypeScript | `next` is string-based |

**Angular's approach** (array of independent guards) enforces single responsibility better than Vue's monolithic `beforeEach`. Each Angular guard does ONE thing. Vue's `beforeEach` tends to become a growing switch statement.

## 18.3 SolidJS Equivalent

```jsx
// Solid Router (conceptual)
const AuthGuard = (props) => {
  const { isAuthenticated } = useAuth();
  return () => isAuthenticated() ? props.children : <Navigate href="/login" />;
};

// Usage with createRoute
<Route path="/admin" component={() => 
  <AuthGuard><AdminPanel /></AuthGuard>
} />
```

**Comparison**: SolidJS uses signals natively (like Angular). The guard checks the signal value directly without subscription boilerplate. Angular's guard API predates signals, so it uses function calls that happen to read signals.

## 18.4 Svelte Equivalent

```svelte
<!-- SvelteKit: hooks.server.ts -->
export const handle = async ({ event, resolve }) => {
  const user = await event.locals.getUser();
  if (event.url.pathname.startsWith('/admin') && user?.role !== 'admin') {
    throw redirect(303, '/login');
  }
  return resolve(event);
};
```

**Comparison**: SvelteKit handles auth in SERVER-side hooks, not client-side. This is fundamentally different — the server checks auth before sending ANY HTML to the client. Angular's approach is client-side navigation interception, which requires the app to be loaded first.

---

# 19. Framework Philosophy & Evolution

## 19.1 From Class Guards to Functional Guards

Angular's evolution from class-based to functional guards:

```
Angular 2-4:  @Injectable() class implements CanActivate
Angular 5-14: @Injectable() class implements CanActivate (same API, stable)
Angular 15+:  CanActivateFn (functional)
```

**Why the change**:
1. **Tree-shaking**: Classes with decorators generate metadata that's hard to eliminate. Functions are trivially tree-shakeable.
2. **Standalone**: Functional guards align with standalone components and reduced NgModule dependency.
3. **Simplicity**: A function is simpler than a class with `implements` and `@Injectable()`.
4. **Injection**: `inject()` in function body is clearer than constructor injection.

## 19.2 Influence From Other Frameworks

Angular's guard evolution shows influence from:
- **React hooks**: Functional patterns for cross-cutting concerns
- **Express middleware**: `(req, res, next) => ...` pattern
- **FP principles**: Pure functions, composition, higher-order functions

## 19.3 The Future: Zoneless and Signal-Based Guards

The future of Angular guards:

```typescript
// Hypothetical future: signal-based guard
export const authGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  // No isLoggedIn fallback needed because:
  // 1. Signal is always populated (no Zone dependency)
  // 2. Signals are synchronous
  // 3. No hydration race condition
  return authState.isAuthenticated() ? true : router.createUrlTree(['/login']);
};
```

With zoneless Angular and signals for everything:
- No hydration race (signals are populated immediately in constructor)
- No Zone.js dependency
- Synchronous guard evaluation
- Tighter integration with the reactive graph

---

# 20. File-by-File Reference

## `core/guards/auth.guard.ts`
- **Type**: Barrel re-export
- **Content**: `export { authGuard } from '../auth/guards/auth.guard';`
- **Purpose**: Single entry point for auth guard import

## `core/auth/guards/auth.guard.ts`
- **Type**: `CanActivateFn` (functional guard)
- **Dependencies**: `AuthStateService` (signal), `TokenService` (localStorage), `Router`
- **Decision algorithm**: Signal first → localStorage fallback → redirect
- **Redirect target**: `/login`
- **Reusability**: Any route needing authentication

## `core/guards/role.guard.ts`
- **Type**: Higher-order function returning `CanActivateFn`
- **Dependencies**: `TokenService` (localStorage), `Router`
- **Decision algorithm**: Extract role from JWT → check against allowed roles → redirect
- **JWT parsing**: `extractRoleFromToken()` — 3 claim format support (role, Role, ASP.NET schema)
- **Redirect target**: `/user/dashboard`
- **Reusability**: Any route needing role-based access
- **Unique features**: Case-insensitive matching, array role claim support
