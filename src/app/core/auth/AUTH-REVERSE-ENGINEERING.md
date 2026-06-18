# Auth Module — Complete Reverse Engineering Analysis

---

# 1. Business Purpose

This feature implements a **credentials-based authentication system** for the Cinemaverse cinema management application. It supports:

- **Login**: email/password credential submission to a remote ASP.NET backend
- **Registration**: multi-field user enrollment (firstName, lastName, email, password, phoneNumber, address, city, dateOfBirth, gender)
- **Session persistence**: JWT-based token storage in `localStorage` with cross-session hydration
- **Route protection**: `authGuard` prevents unauthenticated access to protected routes
- **Authenticated HTTP**: `authInterceptor` injects `Authorization: Bearer <token>` into every outgoing request
- **Session invalidation**: 401 responses in `refreshTokenInterceptor` clear all tokens and redirect to `/auth/login`
- **Profile display**: `ProfilePage` reads the reactive `currentUser$` observable to show user info

**Business rules enforced:**

| Rule | Enforcement Point | Why |
|------|-------------------|-----|
| All registration fields required | `Validators.required` | Data integrity |
| Password ≥ 8 characters | `Validators.minLength(8)` | Security policy |
| Email must be valid format | `Validators.email` | Data quality |
| First/last name ≤ 60 chars | `Validators.maxLength(60)` | DB column constraints |
| Token presence = authenticated session | `authGuard`, `authInterceptor` | Access control |
| Backend errors mapped to user-facing messages | `getErrorMessage()` | UX quality |

---

# 2. High-Level Architecture

## Layer Diagram

```
┌─────────────────────────────────────────────────┐
│                 UI LAYER                         │
│  LoginPage        RegisterPage     ProfilePage   │
│  (standalone)     (standalone)     (standalone)  │
└────────┬──────────────────────────────┬──────────┘
         │ inject                       │ inject
         ▼                              ▼
┌─────────────────────────────────────────────────┐
│              SERVICE LAYER                       │
│              AuthService (root)                  │
│  - login()    - register()    - logout()         │
│  - loadMe()   - isAuthenticated$()              │
│  - userFromToken() - decodeJwtPayload()          │
└──┬────────────┬────────────────────┬─────────────┘
   │ inject     │ inject             │ inject
   ▼            ▼                    ▼
┌────────┐ ┌──────────────┐ ┌─────────────────┐
│ TOKEN  │ │ AUTH STATE   │ │   HTTP CLIENT   │
│ SERVICE│ │ SERVICE      │ │   (provided by  │
│ (root) │ │ (root)       │ │   HttpClient)   │
│        │ │              │ │                  │
│ save() │ │ signal<bool> │ │ .post()          │
│ get()  │ │ signal<User> │ │ .get()           │
│ remove│ │ .set()        │ │                  │
└──┬─────┘ │ .clear()     │ └─────────────────┘
   │       └──────┬───────┘
   ▼              ▼
┌─────────────────────────────────────────────┐
│              INTERCEPTOR LAYER               │
│  authInterceptor       refreshTokenInterceptor│
│  (HttpInterceptorFn)   (HttpInterceptorFn)   │
│  - injects Bearer      - catches 401         │
│    token header        - clears tokens       │
│                        - redirects /login    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              GUARD LAYER                     │
│  authGuard (CanActivateFn)                   │
│  - checks isAuthenticated() signal           │
│  - fallback: checks tokenService.isLoggedIn()│
│  - returns true or UrlTree to /login         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              STORAGE LAYER                   │
│  localStorage (key-value persistence)        │
│  Keys: cinemaverse_token, cv_refresh_token,  │
│        cv_role, legacy keys                  │
└─────────────────────────────────────────────┘
```

## Separation of Concerns

| Layer | Responsibility | Owner |
|-------|---------------|-------|
| UI | Form rendering, user interaction, error display | `LoginPage`, `RegisterPage`, `ProfilePage` |
| State | Reactive `isAuthenticated` + `currentUser` signals | `AuthStateService` |
| Service | HTTP orchestration, token decoding, business logic | `AuthService` |
| Token | `localStorage` read/write/cleanup, legacy key migration | `TokenService` |
| Token Facade | Higher-level access/refresh token + role mgmt | `TokenStoreService` |
| Interceptor | Automatic Bearer token injection | `authInterceptor` |
| Interceptor | 401 → clear + redirect | `refreshTokenInterceptor` |
| Guard | Route activation decision | `authGuard` |

## Ownership Rules

- **State ownership**: `AuthStateService` is the single source of truth for auth state
- **Orchestration ownership**: `AuthService` bridges HTTP, token storage, and state
- **Data boundary**: UI never touches `TokenService` or `AuthStateService` directly — goes through `AuthService` public API
- **Event ownership**: UI fires events → `AuthService` methods → HTTP → response → token storage + state update → reactive propagation to UI
- **Trust boundary**: HTTPS is the trust boundary. Client-side code is untrusted by the server.

## File Structure Map

```
core/auth/
├── auth.models.ts              # Deprecated barrel models (LoginRequest, AuthResponse, CurrentUser)
├── auth.service.ts             # Barrel re-export: export { AuthService }
├── token-store.service.ts      # Facade over TokenService + localStorage for refresh/role
├── models/
│   ├── auth-response.ts        # AuthUser + AuthResponse interfaces
│   ├── login-request.ts        # LoginRequest interface
│   └── register-request.ts     # RegisterRequest interface (9 fields)
├── services/
│   ├── auth.service.ts         # Core orchestration: HTTP, token mgmt, JWT decode
│   ├── auth-state.service.ts   # Signal-based reactive state
│   └── token.service.ts        # localStorage persistence with legacy migration
├── guards/
│   └── auth.guard.ts           # CanActivateFn functional guard
└── interceptors/
    └── auth.interceptor.ts     # Bearer token injection HttpInterceptorFn
```

---

# 3. Feature Decomposition

## 3.1 LoginPage — Login Operation

### Purpose
Authenticate an existing user via email + password.

### Inputs
- Form fields: `email`, `password`
- User click on submit button

### Outputs
- On success: navigation to `/admin/dashboard`
- On failure: `errorMessage` signal updated with user-facing string

### Execution Pipeline

```
1. User clicks submit
2. errorMessage.set(null)           — clear previous error
3. form.markAllAsTouched()          — trigger validation UI on all controls
4. Guard: form.invalid? → return    — block invalid submission
5. Guard: isLoading()? → return     — prevent duplicate submission
6. isLoading.set(true)              — disable UI (button spinner, disabled)
7. authService.login(rawValue)      — HTTP POST
8. Observable pipe: finalize → isLoading.set(false)
9. subscribe:
   → next: router.navigate(['/admin/dashboard'])
   → error: errorMessage.set(getErrorMessage(...))
```

### Code Walkthrough

```typescript
// Line 20-22: Signal declarations
readonly isLoading = signal(false);
readonly errorMessage = signal<string | null>(null);
readonly showPassword = signal(false);
```

Three component-level signals. `readonly` prevents external property reassignment (not signal mutation — `.set()` is still callable internally). `signal(false)` initializes with `false`. `signal<string | null>(null)` explicitly types the generic to allow `string | null`.

**Runtime**: Each `signal()` call allocates a `SignalNode` with initial value. These are synchronous allocations during component construction (injection context).

```typescript
// Line 24-27: Reactive form
readonly form = this.fb.nonNullable.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required]],
});
```

**`this.fb.nonNullable.group(...)`**: `nonNullable` is architecturally critical. When a form control is reset, default behavior sets value to `null`. `nonNullable` restores the **initial value** (empty string `''`).

Type inference without `nonNullable`:
```typescript
FormGroup<{ email: FormControl<string | null>; password: FormControl<string | null> }>
```

Type inference with `nonNullable`:
```typescript
FormGroup<{ email: FormControl<string>; password: FormControl<string> }>
```

This eliminates `null` checks everywhere the form value is read. `getRawValue()` returns `{ email: string; password: string }`.

Each entry is `[initialValue, validators]` — a tuple. The initial value `''` determines the control type. Validators are `ValidatorFn[]`.

```typescript
// Line 29-45: submit()
submit(): void {
  this.errorMessage.set(null);           // clear previous error
  this.form.markAllAsTouched();          // show validation errors

  if (this.form.invalid || this.isLoading()) {
    return;                              // early exit
  }

  this.isLoading.set(true);
  this.authService
    .login(this.form.getRawValue())      // bypass disabled controls
    .pipe(finalize(() => this.isLoading.set(false)))
    .subscribe({
      next: () => void this.router.navigate(['/admin/dashboard']),
      error: (error: unknown) => this.errorMessage.set(this.getErrorMessage(error, 'Invalid email or password')),
    });
}
```

**`getRawValue()` vs `value`**: `getRawValue()` returns ALL control values regardless of disabled state. Since no controls are disabled, both are equivalent, but `getRawValue()` is defensive against future form disabling during submission.

**`void` operator on `router.navigate(...)`**: Suppresses the `Promise<boolean>` return type to `void`. Signals "fire and forget" — navigation failure is unhandled. Production concern: should handle `.catch()` for navigation failures.

**`finalize(() => this.isLoading.set(false))`**: Guaranteed teardown on both `next` and `error` paths. Without `finalize`, if `error` handler throws or is missing, `isLoading` stays `true` forever (stuck UI). `finalize` runs in RxJS teardown phase.

```typescript
// Line 51-54: hasError helper
hasError(controlName: 'email' | 'password', errorName: string): boolean {
  const control = this.form.controls[controlName];
  return control.hasError(errorName) && (control.dirty || control.touched);
}
```

Template helper that only shows errors after user interaction (`dirty || touched`). The union type `'email' | 'password'` provides compile-time safety — a typo in the template causes TypeScript error. This prevents silent template bugs.

**Runtime**: `control.hasError(errorName)` walks the control's `AbstractControl.errors` object. If the control has validators that produce `{ [errorName]: value }`, it returns truthy. `dirty` means the user changed the value; `touched` means the user focused and blurred.

```typescript
// Line 56-86: getErrorMessage
private getErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  const apiError: unknown = error.error;
  if (typeof apiError === 'string') {
    return apiError;
  }

  if (this.isRecord(apiError)) {
    const message = apiError['message'] ?? apiError['error'] ?? apiError['title'];
    if (typeof message === 'string') {
      return message;
    }

    const errors = apiError['errors'];
    if (this.isRecord(errors)) {
      const firstError = Object.values(errors).flat().find(
        (value) => typeof value === 'string'
      );
      if (typeof firstError === 'string') {
        return firstError;
      }
    }
  }

  return fallback;
}
```

**Architectural significance**: This is a **server error format adapter**. ASP.NET Web API returns errors in multiple shapes:
- Plain string: `"Invalid credentials"`
- Problem details: `{ title: "Unauthorized", status: 401 }`
- Model validation: `{ errors: { email: ["Email is required"] } }`

The method probes these keys in priority order:
1. `error.error` if it's a string
2. `apiError['message']` → `error` → `title` (Problem Details format)
3. `apiError['errors']` as a record → find first string value (Model Validation format)
4. Fallback to caller-provided default

The `flat().find()` on line 74 is interesting: `Object.values(errors)` gives `(string | string[])[]`, and `.flat()` flattens one level. This handles both `{ field: "error msg" }` and `{ field: ["error1", "error2"] }` formats.

**Edge case**: If `errors` values contain non-string types (numbers, objects), `.flat()` includes them, then `.find()` skips them via the `typeof === 'string'` check. No error is thrown.

---

## 3.2 RegisterPage — Registration Operation

### Purpose
Create a new user account with full profile information.

### Inputs
- 9 form fields: `firstName`, `lastName`, `email`, `password`, `phoneNumber`, `address`, `city`, `dateOfBirth`, `gender`
- Submit button click

### Outputs
- On success: navigation to `/login`
- On failure: `errorMessage` signal updated

### Key Differences from LoginPage

1. **`toRegisterRequest()` transformation**: Converts form value to `RegisterRequest`, normalizing `dateOfBirth` to ISO format.
2. **No auto-login after registration**: Navigates to `/login` — user must log in separately. This is a business decision (could auto-login).
3. **More complex error extraction**: Handles ASP.NET's Model Validation error format where `errors` contains per-field arrays.

### `toIsoDate` Algorithm

```typescript
private toIsoDate(value: string): string {
  if (!value) {
    return value;
  }

  const normalized = value.includes('T') ? value : `${value}T00:00:00.000Z`;
  const parsedDate = new Date(normalized);
  return Number.isNaN(parsedDate.getTime()) ? value : parsedDate.toISOString();
}
```

**Why this exists**: HTML `<input type="date">` produces `YYYY-MM-DD` format. The backend expects ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`). This normalizer:

1. Appends `T00:00:00.000Z` if no time component (standard Unix epoch start of day)
2. Creates a `Date` object from normalized string
3. Validates date with `Number.isNaN(parsedDate.getTime())` — the ONLY reliable way to check `Date` validity (NaN instanceof Date is `true`)
4. Returns `.toISOString()` on success, original value on failure (graceful degradation)

**Edge case**: If `value` already includes `T` (`2025-01-01T12:00:00.000Z`), no transformation occurs. If value is unparseable (`"not-a-date"`), `Date` returns Invalid Date, `getTime()` returns NaN, original value preserved.

### Error Extraction Differences

```typescript
const errors = apiError['errors'] ?? apiError['Errors'];
```

ASP.NET serializes `Errors` with capital E in some versions. The `??` handles both cases. Then `extractValidationErrors` flattens the error record:

```typescript
private extractValidationErrors(errors: Record<string, unknown>): string[] {
  return Object.values(errors).flatMap((value) => {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.filter((entry): entry is string => typeof entry === 'string');
    return [];
  });
}
```

This is a more robust version than `LoginPage`'s — it handles arrays explicitly with `flatMap` rather than `.flat().find()`.

---

## 3.3 AuthService — Core Service

### AuthService.login() — Core Authentication Operation

```typescript
login(request: LoginRequest): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(`${API_BASE_URL}/api/auth/login`, request).pipe(
    tap((response) => {
      const token = this.getResponseToken(response);

      if (token) {
        this.tokenService.saveToken(token);
        this.authState.setAuthenticated(true);
        this.authState.setCurrentUser(
          response.user ?? this.userFromToken(token) ?? this.userFromResponse(response)
        );
      }
    }),
  );
}
```

**Full execution pipeline at runtime:**

```
login(LoginRequest)
│
├─ 1. HTTP POST /api/auth/login
│     URL: "https://cinemaverse-api.tryasp.net/api/auth/login"
│     Body: { email, password }
│     Content-Type: application/json
│
├─ 2. AuthInterceptor runs (before request is sent):
│     inject(TokenService).getToken()
│     → null (not logged in yet, no token to inject)
│     → next(request) — passes through unmodified
│
├─ 3. Request sent via HttpClient (fetch or XHR)
│
├─ 4. Response received → RxJS Observable emits AuthResponse
│
├─ 5. tap() operator fires (side effects, no transformation)
│     a. getResponseToken(response):
│          response.token ?? response.accessToken ?? null
│          (prefers 'token', falls back to 'accessToken')
│     b. if token exists:
│          i.   tokenService.saveToken(token)
│               → localStorage.setItem('cinemaverse_token', token)
│          ii.  authState.setAuthenticated(true)
│               → isAuthenticatedSignal.set(true)
│               → dependents marked dirty
│          iii. authState.setCurrentUser(...)
│               → currentUserSignal.set(user OR null)
│               → user extraction priority:
│                  response.user  →  userFromToken(token)  →  userFromResponse(response)
│
├─ 6. Observable continues to subscriber
│
└─ 7. finalize() runs (in calling component):
     isLoading.set(false)
```

### userFromToken — JWT Decoding

```typescript
private userFromToken(token: string): AuthUser | null {
  const payload = this.decodeJwtPayload(token);
  if (!payload) {
    return null;
  }

  return {
    id: this.readClaim(payload, 'sub') ?? this.readClaim(payload, 'nameid'),
    email: this.readClaim(payload, 'email'),
    firstName: this.readClaim(payload, 'firstName') ?? this.readClaim(payload, 'given_name'),
    lastName: this.readClaim(payload, 'lastName') ?? this.readClaim(payload, 'family_name'),
    role: this.readClaim(payload, 'role'),
  };
}
```

**Why dual claim names**: ASP.NET Identity uses `nameid` (NameIdentifier claim). Generic JWT uses `sub` (Subject claim from RFC 7519). OpenID Connect uses `given_name`/`family_name`. The application uses custom `firstName`/`lastName`. The `??` (nullish coalescing) prefers one then falls back.

**`readClaim`**:
```typescript
private readClaim(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key];
  return typeof value === 'string' ? value : undefined;
}
```

Type guard — ensures the claim value is actually a string before returning. If the JWT has a claim with a non-string value (number, array, object), this returns `undefined`, which `??` can then skip.

### decodeJwtPayload — JWT Payload Extraction

```typescript
private decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      return null;
    }

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );

    const parsed: unknown = JSON.parse(json);
    return this.isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
```

**JWT structure**: `header.payload.signature` — three base64url-encoded segments separated by dots.

**Step-by-step**:

1. `token.split('.')[1]` extracts the payload (second segment)
2. If no second segment → `null` (malformed JWT)
3. `base64url → base64`: JWT uses RFC 4648 base64url where `-` replaces `+` and `_` replaces `/`. Standard `atob()` expects base64, so characters are replaced back
4. Unicode-safe decode: `atob()` produces Latin-1 (ISO 8859-1). For multi-byte characters, each byte is:
   - Converted to hex: `charCodeAt(0).toString(16)`
   - Padded to 2 chars: `'00'.slice(-2)`
   - Percent-encoded: `%<hex>`
   - Then `decodeURIComponent` decodes the percent-encoded UTF-8

   Without this, characters like `é`, `ñ`, CJK, or emoji would be garbled.
5. `JSON.parse(parsed)` — typed as `unknown` to force type guard check
6. `isRecord(parsed)` validates it's an object, not null, not array
7. Entire method wrapped in `try/catch` — JWT manipulation is inherently error-prone

### Constructor — Token Hydration

```typescript
constructor() {
  const token = this.tokenService.getToken();
  if (token) {
    this.authState.setAuthenticated(true);
    this.authState.setCurrentUser(this.userFromToken(token));
  }
}
```

**Runtime**: Runs synchronously when `AuthService` is first injected (lazy instantiation). This rehydrates state from `localStorage` after page refresh.

**Timing**: The constructor runs when some component/service first injects `AuthService`. If a guard runs before this injection, the signal is `false`. The guard's `tokenService.isLoggedIn()` fallback handles this window.

---

## 3.4 AuthStateService — Reactive State Layer

```typescript
@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly isAuthenticatedSignal = signal(false);
  private readonly currentUserSignal = signal<AuthUser | null>(null);

  readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();
  readonly currentUser = this.currentUserSignal.asReadonly();
  ...
}
```

### Why Two Signals Instead of One Object Signal

```typescript
// Hypothetical alternative:
private readonly authStateSignal = signal<{
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
}>({ isAuthenticated: false, currentUser: null });
```

**Micro-level reactivity**: `isAuthenticated` and `currentUser` are independent reactive primitives. If combined into one object, updating `currentUser` would mark ALL consumers of the combined signal as dirty — even those that only read `isAuthenticated`. Separate signals enable fine-grained dependency tracking.

**With combined signal**:
```typescript
computed(() => state().isAuthenticated)
// Re-evaluates when currentUser changes too — wasted computation
```

**With separate signals**:
```typescript
computed(() => isAuthenticated())
// Only re-evaluates when isAuthenticated actually changes
```

### asReadonly()

```typescript
readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();
```

Returns a `Signal<T>` interface without `.set()`, `.update()`, `.mutate()`. At runtime, the underlying object still has these methods, but TypeScript prevents external access. This enforces encapsulation — only `AuthStateService` can mutate its state.

### setCurrentUser — Cross-Signal Synchronization

```typescript
setCurrentUser(user: AuthUser | null): void {
  this.currentUserSignal.set(user);
  this.isAuthenticatedSignal.set(!!user || this.isAuthenticatedSignal());
}
```

**Design decision**: `setCurrentUser` optionally syncs `isAuthenticated`:
- If `user` is truthy → `isAuthenticated = true`
- If `user` is null → `isAuthenticated = false || previousValue` = preserves previous value

This means calling `setCurrentUser(null)` alone does NOT set `isAuthenticated` to `false`. Only `clear()` does both.

```typescript
clear(): void {
  this.currentUserSignal.set(null);
  this.isAuthenticatedSignal.set(false);
}
```

**Redundant writes in `clear()`**: If `setCurrentUser(null)` runs first, `isAuthenticatedSignal` is set to `false || currentValue`. If currentValue is `true`, this evaluates to `true`. Then `setAuthenticated(false)` sets it to `false`. Two writes for one logical operation.

---

## 3.5 TokenService — Storage Abstraction

```typescript
const TOKEN_KEY = 'cinemaverse_token';
const LEGACY_TOKEN_KEYS = ['cv_access_token', 'access_token'];

@Injectable({ providedIn: 'root' })
export class TokenService {
  saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) ?? this.getLegacyToken();
  }

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    for (const key of LEGACY_TOKEN_KEYS) {
      localStorage.removeItem(key);
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private getLegacyToken(): string | null {
    for (const key of LEGACY_TOKEN_KEYS) {
      const token = localStorage.getItem(key);
      if (token) {
        return token;
      }
    }
    return null;
  }
}
```

**Key migration pattern**: The app has gone through key name changes. `getToken()` checks current key first (`cinemaverse_token`), then falls through to legacy keys (`cv_access_token` → `access_token`).

**How migration works**:
1. `saveToken()` writes only to current key (`cinemaverse_token`)
2. `getToken()` reads current key first, falls back to legacy
3. `removeToken()` cleans up ALL keys (current + all legacy)
4. Over time, legacy keys naturally become irrelevant as users log in/out

**Legacy key priority**: `cv_access_token` > `access_token` — newest legacy key first, oldest last.

---

## 3.6 TokenStoreService — Higher-Level Token Facade

```typescript
@Injectable({ providedIn: 'root' })
export class TokenStoreService {
  private readonly tokenService = inject(TokenService);

  getAccessToken(): string | null {
    return this.tokenService.getToken();
  }

  setAccessToken(token: string): void {
    this.tokenService.saveToken(token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('cv_refresh_token') ?? localStorage.getItem('refresh_token');
  }

  setRefreshToken(token: string): void {
    localStorage.setItem('cv_refresh_token', token);
  }

  getRole(): string | null {
    return localStorage.getItem('cv_role') ?? localStorage.getItem('role');
  }

  setRole(role: string): void {
    localStorage.setItem('cv_role', role);
  }

  clear(): void {
    this.tokenService.removeToken();
    localStorage.removeItem('cv_refresh_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('cv_role');
    localStorage.removeItem('role');
  }
}
```

### Why This Facade Exists

1. **Abstraction over access token storage**: `getAccessToken()` delegates to `TokenService`. If the access token moves from `localStorage` to a different store (HttpOnly cookie, in-memory), only this delegation point changes.
2. **Refresh token management**: `getRefreshToken()` / `setRefreshToken()` handle refresh tokens directly via `localStorage`, with the same migration pattern (`cv_refresh_token` → `refresh_token`).
3. **Role management**: `getRole()` / `setRole()` store the user role separately rather than decoding from JWT. This avoids repeated JWT parsing at the cost of potential inconsistency.

---

## 3.7 authGuard — Route Protection

```typescript
export const authGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const tokenService = inject(TokenService);
  const router = inject(Router);

  return authState.isAuthenticated() || tokenService.isLoggedIn() ? true : router.createUrlTree(['/login']);
};
```

### Dual Check Strategy

| Check | Source | When It's True |
|-------|--------|----------------|
| `authState.isAuthenticated()` | Signal | After `AuthService.login()` or `AuthService` constructor rehydration |
| `tokenService.isLoggedIn()` | localStorage | Anytime a token exists in storage |

**The dual check solves the hydration race**:

```
Page refresh
  │
  ├─ Router initializes
  ├─ Guard evaluates
  │     ├─ check 1: signal → false (AuthService not injected yet)
  │     └─ check 2: localStorage → true (token persists)
  │     → guard returns true ✓
  │
  └─ AuthService gets injected (lazy, when some component needs it)
        ├─ tokenService.getToken() → reads localStorage
        ├─ signal.set(true)
        └─ signal.set(user)
```

Without the `tokenService` fallback, a page refresh would redirect to login even with a valid token. Then `AuthService` would inject on the login page, set the signal, and the guard would pass on second navigation — but the user would see a flash of login page.

### CanActivateFn Type Signature

```typescript
type CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree;
```

The guard ignores `route` and `state` parameters (uses `_` implicitly via empty parens `()`). Returns either:
- `true` → allow activation
- `UrlTree` → redirect to that URL

### createUrlTree

```typescript
router.createUrlTree(['/login'])
```

Returns a `UrlTree` (not a navigation). The router merges all guard results and performs a single navigation. This is the functional guard pattern — returning instructions rather than executing them.

---

## 3.8 authInterceptor — Bearer Token Injection

```typescript
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(TokenService).getToken();

  if (!token) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
```

### HttpInterceptorFn — Functional Interceptor

```typescript
type HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => Observable<HttpEvent<unknown>>;
```

Angular 15+ introduced functional interceptors to replace class-based `HttpInterceptor`. Benefits:
- No class boilerplate
- No Angular DI decoration
- Better tree-shaking
- Single responsibility

### inject() Inside Interceptor

`inject(TokenService)` works because Angular sets up an injection context before executing the interceptor chain. The interceptor function runs synchronously before the HTTP request is sent.

### request.clone() — Immutability

`HttpRequest` is immutable. `clone()` creates a new `HttpRequest` with merged properties:
- Original headers are preserved
- `setHeaders` adds/replaces specific headers
- New request is passed to `next()`

If you tried `request.headers.set(...)`, it would throw because `HttpHeaders` is also immutable.

### Edge Cases

- **Empty token string**: `!token` is truthy for empty string → skips injection (correct)
- **Interceptor for login/register**: `getToken()` returns null → skips injection (correct — these endpoints don't need auth)
- **token is `"undefined"` string**: Falsy check passes, would inject `Bearer undefined`. But `localStorage.getItem` returns `null` for missing keys, not `"null"` string.

---

## 3.9 refreshTokenInterceptor — 401 Handling

```typescript
export const refreshTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStore = inject(TokenStoreService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        tokenStore.clear();
        void router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};
```

### What It Does

On any HTTP response with status 401 (Unauthorized):
1. **Clears all tokens** (`tokenStore.clear()`) — wipes access token, refresh token, role from localStorage
2. **Redirects** to `/auth/login`
3. **Re-throws** the error (`throwError(() => error)`) so the original caller still receives the error

### What It Doesn't Do (Production Gaps)

1. **No token refresh**: Doesn't attempt to use the refresh token to get a new access token. In production:
   - Access tokens expire (typically 15-60 minutes)
   - Refresh tokens have longer expiry (days/weeks)
   - Flow should be: catch 401 → call refresh endpoint → retry original request → if refresh fails, clear + redirect

2. **Concurrent 401 handling**: If 10 parallel requests all get 401:
   - This runs 10 times
   - `tokenStore.clear()` runs 10 times (wasteful but safe)
   - `router.navigate(...)` runs 10 times (navigation is debounced by router, only one redirect happens)

3. **No request queue**: During refresh, other requests shouldn't be retried until refresh completes

### Enterprise-Grade Pattern (For Reference)

```typescript
let isRefreshing = false;
let pendingRequests: ((token: string) => void)[] = [];

intercept(req, next) {
  return next(req).pipe(
    catchError(err => {
      if (err.status !== 401) return throwError(() => err);

      if (!isRefreshing) {
        isRefreshing = true;
        return this.authService.refreshToken().pipe(
          switchMap(response => {
            isRefreshing = false;
            this.tokenService.saveToken(response.token);
            // Replay pending requests
            pendingRequests.forEach(cb => cb(response.token));
            pendingRequests = [];
            // Retry original request
            return next(req.clone({
              setHeaders: { Authorization: `Bearer ${response.token}` }
            }));
          }),
          catchError(refreshError => {
            isRefreshing = false;
            pendingRequests = [];
            this.tokenStore.clear();
            this.router.navigate(['/auth/login']);
            return throwError(() => refreshError);
          })
        );
      } else {
        // Queue request until refresh completes
        return new Observable(subscriber => {
          pendingRequests.push((token: string) => {
            subscriber.next(next(req.clone({
              setHeaders: { Authorization: `Bearer ${token}` }
            })));
          });
        });
      }
    })
  );
}
```

---

# 4. Runtime Execution Flow

## 4.1 Page Load (Fresh)

```
1. Browser loads Angular application
   │
2. Angular bootstrap:
   a. ApplicationRef.boostrap() runs
   b. PlatformBrowserDynamic boots
   c. Root module/app config processed
   d. Router initializes
   │
3. Router reads initial URL → matches route config
   │
4. Route guard evaluation:
   a. authGuard() called
   b. inject(AuthStateService) → signal value: isAuthenticated = false
   c. inject(TokenService) → localStorage.getItem('cinemaverse_token')
   d. Token exists → isLoggedIn() = true
   e. Guard returns true → navigation proceeds
   │
5. Protected route component activated
   │
6. Component initialization:
   a. Constructor runs
   b. AuthService injected (first time)
      i.   AuthService constructor runs
      ii.  tokenService.getToken() → reads localStorage
      iii. Token exists → authState.setAuthenticated(true)
           → isAuthenticatedSignal.set(true)
           → SignalNode value updated
           → Dependents marked dirty
           → toObservable effect rescheduled
      iv.  authState.setCurrentUser(userFromToken(token))
           → currentUserSignal.set(user)
           → SignalNode value updated
           → Dependents marked dirty
           → toObservable effect rescheduled
   │
7. After constructor (still in creation phase):
   a. OnPush: ChangeDetectorRef.markForCheck() (signals trigger this)
   b. Template bindings re-evaluated on next change detection
   │
8. Change Detection (ApplicationRef.tick):
   a. Component view checked
   b. Template reads signal values
      i.   isAuthenticated() → true
      ii.  currentUser() → { id, email, ... }
   c. DOM updated with actual values
```

## 4.2 Login Flow

```
1. User fills form: email + password
2. User clicks "Submit"
   │
3. DOM: (click) event fires
   │
4. Angular event manager:
   a. Zone.js wraps the event handler
   b. Event binding executes submit()
   │
5. submit():
   a. errorMessage.set(null)             — signal update (sync)
   b. form.markAllAsTouched()            — all FormControls marked touched (sync)
   c. isLoading.set(true)                — signal update (sync)
   d. authService.login(rawValue)        — returns Observable
   │
6. AuthService.login():
   a. http.post<AuthResponse>(url, body)
      i.   HttpClient creates HttpRequest
      ii.  Interceptor chain executes:
           - authInterceptor:
             - inject(TokenService).getToken() → null
             - next(request) — no token injected
           - refreshTokenInterceptor:
             - next(req) — passes through
      iii. HTTP request sent via fetch/XHR
   │
7. HTTP Response received → Observable emits
   │
8. tap() operator fires (synchronous within the Observable pipeline):
   a. getResponseToken(response) → extracts token
   b. tokenService.saveToken(token) → localStorage.setItem (sync)
   c. authState.setAuthenticated(true) → signal.set (sync)
      - Deps invalidated
      - Template scheduled for re-check
      - toObservable effect scheduled (microtask)
   d. authState.setCurrentUser(user) → signal.set (sync)
      - Deps invalidated
      - Template scheduled for re-check
      - toObservable effect scheduled (microtask)
   │
9. Observable continues to subscriber:
   a. finalize(() => isLoading.set(false))
      - isLoading signal set to false (sync)
   b. subscribe.next() runs:
      - void this.router.navigate(['/admin/dashboard'])
        → Router.navigate returns Promise<boolean>
        → void suppresses promise
        → Router starts navigation sequence
   │
10. New navigation:
    a. Guard evaluated again
    b. authState.isAuthenticated() → true
    c. Guard returns true
    d. Dashboard route activated
```

## 4.3 Hydration Boot Sequence Detail

```
Time 0:     Browser HTML parsed, Angular scripts loaded
Time +1ms:  Angular bootstraps
Time +2ms:  Router initializes, reads URL
Time +3ms:  Guard evaluation
            ├─ inject(AuthStateService) → new instance, signals = false
            ├─ inject(TokenService) → new instance
            ├─ tokenService.isLoggedIn() → localStorage.getItem → true
            └─ guard returns true

Time +4ms:  Route activates, component class loaded
Time +5ms:  Component constructor → inject(AuthService)
            ├─ AuthService constructor runs
            ├─ tokenService.getToken() → localStorage → "eyJ..."
            ├─ authState.setAuthenticated(true)
            │   └─ SignalNode.update: false → true
            │   └─ Dependents: [toObservable effect, template binding] → dirty
            ├─ decodeJwtPayload("eyJ...") → { sub, email, role }
            ├─ authState.setCurrentUser({ id, email, role })
            │   └─ SignalNode.update: null → user
            │   └─ Dependents: [toObservable effect, template binding] → dirty
            └─ Constructor returns

Time +6ms:  Change detection runs (ApplicationRef.tick)
            ├─ Template binding re-evaluated for isAuthenticated()
            │   └─ Reads signal → true → DOM updates
            ├─ Template binding re-evaluated for currentUser()
            │   └─ Reads signal → user object → DOM updates
            └─ Component rendered with correct values
```

**Critical window**: Between Time +3ms and Time +5ms, the guard has passed but the signal is still `false`. Any code that reads the signal during this window sees `false` even though the user is effectively authenticated. The `tokenService.isLoggedIn()` check in the guard handles this for route protection, but other code paths must also be aware.

---

# 5. Runtime Timeline Analysis

| Operation | When | Trigger | Angular Subsystem | Sync/Async |
|-----------|------|---------|-------------------|------------|
| `TokenService.getToken()` | Any inject call | Method invocation | None | Sync |
| `signal.set()` | State change | Method call | Signals engine | Sync |
| `toObservable` subscription | Service construction | DI creation | `@angular/core/rxjs-interop` | Async (next microtask) |
| `http.post()` | login/register | Method call | `HttpClient` | Async (XHR/fetch) |
| `tap()` side effects | Response received | HTTP emission | RxJS | Sync |
| `finalize()` | Observable completes/errors | RxJS teardown | RxJS | Sync |
| `authGuard` | Navigation start | Router event | Router | Sync |
| `authInterceptor` | Request creation | HttpClient pipeline | `HttpInterceptorFn` | Sync |
| `router.navigate()` | After login/401 | Method call | Router | Async (Promise) |
| `AuthService` constructor | First injection | DI provider resolution | Angular DI | Sync |
| Signal `.asReadonly()` | Service creation | Property access | Signals engine | Sync |
| `form.markAllAsTouched()` | Submit click | Method call | Reactive Forms | Sync |
| JWT `decodeJwtPayload` | Constructor + login | Token available | None | Sync |
| `ChangeDetectorRef.markForCheck()` | Signal change | Template binding | CD (OnPush) | Sync |

**Key distinctions**:
- **Signal reads/writes** are always synchronous
- **Observable subscriptions** (like `subscribe()`) are synchronous for the `next` handler IF the observable emits synchronously (like `of()`, or when using `http` with `HttpBackend`)
- **`toObservable` emissions** are async — they use `effect` which is scheduled as a microtask
- **Router navigation** is async — returns a `Promise`
- **DOM updates** are batched and happen during change detection (`ApplicationRef.tick()`)

---

# 6. Primitive/API Deep Dive

## 6.1 signal<T>

### A. Conceptual Definition
`signal<T>` is a **reactive primitive** that holds a value and notifies consumers when the value changes. It is the lowest-level building block in Angular's reactivity model — analogous to a cell in a spreadsheet.

### B. The Core Problem It Solves
Traditional Angular change detection relies on Zone.js + dirty checking, which runs ALL component checks on any async activity. `signal` enables **fine-grained reactivity** — only consumers that actually depend on a changed signal are notified, eliminating wasted checks.

### C. Architectural Role
In this auth module, signals act as **state atoms** — indivisible units of reactive state. `isAuthenticatedSignal` and `currentUserSignal` are the two ground truths from which all derived state flows.

### D. Internal Framework Mechanics (Ivy Signals)

Angular's signal implementation (Angular 17+, Ivy engine):

1. **Value storage**: `signal(initialValue)` creates a closure holding the value in a `SignalNode`:
   ```typescript
   class SignalNode<T> {
     currentValue: T;
     equals: (a: T, b: T) => boolean;
     lastConsumer: ConsumerNode | null;
     producers: ProducerNode[] | null;
   }
   ```

2. **Dependency tracking**: When a signal is READ inside a reactive context (`computed`, `effect`, template binding), the framework registers the caller as a **consumer** of that signal:
   - The signal adds the consumer to its `consumers` list
   - The consumer adds the signal to its `producers` list
   - This creates a bidirectional dependency graph

3. **Write path**: When `.set(newValue)` is called:
   - `SignalNode.currentValue = newValue`
   - Equality check: `oldValue !== newValue` (or uses custom `equal` function)
   - If changed: marks all dependent consumers as **dirty**
   - For `computed`: lazily invalidated (not eagerly recomputed)
   - For `effect`: scheduled for execution (microtask)
   - For template: marks `ChangeDetectorRef` for check

### E. Runtime Behavior

```typescript
const isLoading = signal(false);
```

1. `signal(false)` allocates `SignalNode` with `currentValue = false`
2. No active consumer context (top-level field initialization), so no dependency registration

```typescript
this.isLoading.set(true);
```

1. `SignalNode.currentValue = true`
2. Equality check: `false !== true` → changed
3. If any `effect` or template consumed this signal: they get marked dirty
4. Change detection is scheduled via `ApplicationRef.tick()` if needed

### F. Type Signature

```typescript
function signal<T>(initialValue: T, options?: CreateSignalOptions<T>): WritableSignal<T>
```

**Generic breakdown**:
- `T`: Type parameter — inferred from `initialValue` or explicit
- `initialValue: T`: The starting value
- `options?: CreateSignalOptions<T>`:
  - `equal: (a: T, b: T) => boolean` — custom equality comparator (default: `Object.is`)
- Returns: `WritableSignal<T>`

**WritableSignal<T> interface**:
```typescript
interface WritableSignal<T> extends Signal<T> {
  set(value: T): void;
  update(updateFn: (value: T) => T): void;
  asReadonly(): Signal<T>;
  mutate(mutator: (value: T) => void): void;
}
```

**Signal<T> interface**:
```typescript
interface Signal<T> extends (() => T) {
  // Callable — reads the value
}
```

`Signal<T>` is callable: `signal()` returns `T`. At runtime, the signal is both a function (for reading) and an object (with `.set()`, `.update()`, etc.).

### G. Input/Output Contract

| Operation | Accepts | Returns | Side Effects | Pure? |
|-----------|---------|---------|-------------|-------|
| `signal()` read | Nothing | `T` | Registers consumer in reactive context | Yes (read is pure) |
| `.set(value)` | `T` | `void` | Notifies dependents | No (triggers reactions) |
| `.update(fn)` | `(T) => T` | `void` | Reads + sets + notifies | No |
| `.asReadonly()` | Nothing | `Signal<T>` | Creates projection reference | Yes |

### H. Dependency Graph Behavior

```
isAuthenticatedSignal (root)
    │
    ├── computed("admin panel?") — derived state
    │
    ├── effect(sync to whatever) — side effects
    │
    └── Template binding: {{ isAuthenticated() }}
            │
            └── Component View (OnPush)

When .set(newValue):
  1. SignalNode updates value
  2. Checks equality (default: Object.is)
  3. Invalidates dependents (marks dirty, does NOT recompute)
  4. computed lazily re-evaluates on next read
  5. effect scheduled (microtask)
  6. Template schedules ChangeDetectorRef.markForCheck()
```

### I. Internal Algorithms

**Push-Pull Hybrid**:
1. **Push**: Signal change pushes invalidation to direct dependents (they become "dirty")
2. **Pull**: Recomputation is deferred until the value is actually READ

```
signal.set(v)
  │
  ├─ 1. value = v
  ├─ 2. if (oldValue !== newValue):
  │      │
  │      ├─ 3. For each consumer in consumers:
  │      │      ├─ Mark consumer as dirty
  │      │      ├─ If consumer is computed: mark its consumers dirty (cascade)
  │      │      └─ If consumer is effect: schedule execution
  │      │
  │      └─ 4. For each template binding (also a consumer):
  │             └─ markForCheck()
  │
  └─ 5. Return
```

### J. Memory Behavior

- Each `signal()` allocates a `SignalNode` object (~40 bytes)
- The closure retains the value and the consumer list
- Consumer references are **weak** — no strong references from signal to consumer
- When a consumer is destroyed (component destroyed, `DestroyRef` triggers):
  - It detaches from all signal dependency lists
  - References are released for GC
- No manual cleanup needed for most cases

### K. Performance Characteristics

| Operation | Complexity | Allocation |
|-----------|-----------|------------|
| Read | O(1) | 0 |
| Write (set) | O(dependents) | 0 (unless notifying) |
| Update | O(dependents) | 0 |
| asReadonly | O(1) | 1 object (tiny) |

- Template binding reads: each read creates a `ViewNode` consumer binding
- No Zone.js interaction — signals bypass Zone.js entirely
- OnPush change detection: only components with dirty signal dependencies are checked

### L. Alternatives & Tradeoffs

| Approach | Pros | Cons |
|----------|------|------|
| `signal` | Fine-grained, no Zone, simple API, no boilerplate | Requires Angular 17+, new mental model |
| `BehaviorSubject` | Rx ecosystem, operators, multicasting, composable | Manual subscribe/unsubscribe, more boilerplate, `.next()` everywhere |
| Plain variable | Simple, no overhead, universal | No reactivity, must call `markForCheck()` manually |
| `computed` | Auto-memoization, lazy eval | Cannot write, read-only |

**Why signals in this auth module**:
- Auth state needs reactive propagation to multiple consumers (template, guard, `toObservable`)
- `BehaviorSubject` would work but requires `.next()`, subscriptions, and cleanup
- Signal provides same functionality with less boilerplate and better framework integration

### M. Failure & Edge Cases

1. **Over-writing in `update`**: `update(fn)` where `fn` mutates the value in place instead of returning new value → no reactivity (same reference, equality check passes)
2. **Circular updates**: Setting a signal inside a `computed` that depends on the same signal → Angular throws error
3. **Destroyed component reads**: Reading a signal after component destruction → no error, but useless work (value is ignored because rendering won't happen)

### N. Common Mistakes

- Calling `asReadonly()` on a signal that should remain writable internally (breaks encapsulation in wrong direction)
- Using `.mutate()` on objects when expecting reference-based change detection — `.mutate()` assumes same-reference mutation
- Assuming synchronous subscriber notification — effects are scheduled, not immediate
- Forgetting that signals are synchronous during reads — no `await` needed, but also no lazy/deferred semantics

### O. Interview Questions

**Q: How does Angular's signal differ from a simple variable?**  
**A**: A signal is **reactive** — reading it inside a reactive context (computed, effect, template) registers the reader as a consumer. Writing to it notifies all consumers. A variable has no such capabilities — changing a variable doesn't trigger any reactions.

**Q: When does a computed() actually recompute?**  
**A**: Lazily, on the next READ after its dependencies are marked dirty. It caches the result until invalidated. This is the "pull" phase — if no one reads it, it never recomputes.

**Q: How do signals integrate with OnPush change detection?**  
**A**: When a signal is read in a template, the component's view node becomes a consumer of that signal. When the signal changes, `ChangeDetectorRef.markForCheck()` is called on the component, scheduling it for the next change detection cycle.

**Q: What is the difference between signal.update() and signal.set()?**  
**A**: `.set(v)` unconditionally sets the value to `v`. `.update(fn)` reads the current value, passes it to `fn`, and sets the result. `.update` is atomic — no other reactive updates can interleave between the read and write.

### P. Mental Model

Think of `signal<T>` as a **reactive cell** in a spreadsheet:
- Each cell holds a value
- Cells can reference other cells (dependencies)
- When a cell changes, dependent cells are marked dirty but not recalculated
- Recalculation happens lazily when the cell's value is needed
- The framework handles the dependency graph automatically

---

## 6.2 toObservable (Angular RxJS Interop)

### A. Conceptual Definition
`toObservable` converts an Angular `Signal<T>` into an RxJS `Observable<T>`. It creates a bridge between the signal-based reactivity world and the observable-based world.

### B. The Core Problem It Solves
Angular's signals are synchronous and pull-based (`signal()` reads the current value). RxJS observables are asynchronous and push-based (values are emitted over time). `toObservable` allows teams to use signals for state management while still exposing observable APIs for integration with existing RxJS-dependent code, HTTP pipelines, and `async` pipe.

### C. Architectural Role
In this module, `toObservable` converts `Signal<boolean>` and `Signal<AuthUser | null>` into observable streams. This allows `ProfilePage` to use `async pipe` and allows consumers to `.subscribe()` to auth state changes reactively.

### D. Internal Framework Mechanics

```typescript
readonly currentUser$ = toObservable(this.authState.currentUser).pipe(
  map((user) => this.toCurrentUser(user)),
);
```

Internally, `toObservable`:
1. Creates an **effect** that reads the signal (registering as consumer)
2. Creates a **ReplaySubject(1)** (or similar) that receives each signal value
3. The effect runs on signal change → pushes new value to Subject → subscribers receive it
4. Initial value is emitted on first subscribe

The implementation (simplified):
```typescript
function toObservable<T>(source: Signal<T>): Observable<T> {
  const subject = new ReplaySubject<T>(1);
  const effectRef = effect(() => {
    const value = source();  // register as consumer, returns current value
    subject.next(value);     // push to subject
  });
  // When injector is destroyed: effectRef.destroy(), subject.complete()
  return subject.asObservable();
}
```

### E. Runtime Behavior

```typescript
this.isAuthenticatedObservable = toObservable(this.authState.isAuthenticated);
```

**On creation** (in `AuthService` field initialization):
1. `effect` is created — runs immediately (synchronous)
2. The effect reads `isAuthenticated()` (which is `false` initially)
3. Subject emits `false`
4. No subscribers yet → value buffered in ReplaySubject

**On signal change** (e.g., `setAuthenticated(true)`):
1. Signal value changes
2. Effect is scheduled (microtask)
3. Effect reads the new value (`true`)
4. Subject emits `true`
5. Subscribers receive `true`

**On subscribe** (e.g., `ProfilePage` assigns `me$`):
1. `currentUser$.subscribe()` or `async pipe` subscribes
2. `ReplaySubject` replays the last value immediately
3. Subscriber receives current value

### F. Type Signature

```typescript
function toObservable<T>(source: Signal<T>, options?: ToObservableOptions): Observable<T>
```

- `T`: Inferred from the signal type
- `source: Signal<T>`: Read-only signal interface
- `options?: ToObservableOptions`: Currently `{ injector?: Injector }` — allows specifying injector for the effect
- Returns: `Observable<T>` — emits current value immediately, then on every signal change

### G. Input/Output Contract

- **Input**: `Signal<T>` — read-only
- **Output**: `Observable<T>` — hot, replaying (replays last value on subscribe)
- **Side effects**: Creates an `effect` that may have scheduling/overhead cost
- **Cleanup**: Effect is destroyed when injector is destroyed; Subject is completed

### H. Dependency Graph

```
signal → effect → ReplaySubject → Observable → subscribers
          ↑                          ↓
    (reads signal)          (async pipe / subscribe)
```

The `effect` bridges the signal's synchronous pull model with RxJS's asynchronous push model.

### I. Memory & Lifecycle

- The internal `effect` lives as long as the injector (root for `providedIn: 'root'`)
- If the observable has no subscribers, values are still pushed to the Subject (buffered by ReplaySubject)
- Memory: Subject + effect callback closure. Negligible for auth-level signals.

### J. Performance Characteristics

- Each `toObservable` creates an `effect` — a separate reactive consumer with its own dirty-checking lifecycle
- On every signal change: effect runs → Subject emits → Observable emits → subscribers react
- Additional overhead over direct signal reads: effect scheduling (microtask) + Subject emission
- With `async pipe`: subscription/unsubscription managed automatically

### K. Why toObservable Instead of Direct Signal

```typescript
// Current approach: signal → observable → async pipe
readonly currentUser$ = toObservable(this.authState.currentUser).pipe(...);

// Alternative: direct signal in template
// Template: {{ authService.currentUser() }}
// Component: this.authService = inject(AuthService);
```

**Why the observable bridge exists**:
1. **Backward compatibility**: Consumers written before signals (`ProfilePage` uses `me$ | async`)
2. **RxJS operators**: The `map(toCurrentUser)` transformation is done once in the service, not per template
3. **Framework convention**: Angular historically uses observables for async state

**Tradeoff**: Two reactive models (signal + observable) double the mental overhead and add microtask scheduling delay. In a greenfield Angular 17+ project, signals-only would be simpler.

---

## 6.3 HttpClient.post<T>

### Code

```typescript
return this.http.post<AuthResponse>(`${API_BASE_URL}/api/auth/login`, request).pipe(
  tap(...),
);
```

### Type Signature

```typescript
post<T>(url: string, body: any | null, options?: HttpOptions): Observable<T>
```

**Generic breakdown**:
- `<T>`: The expected response body type. **Compile-time only** — no runtime validation.
- `url: string`: The full URL (base + path)
- `body: any | null`: Request body, serialized to JSON automatically
- `options: HttpOptions`: Headers, params, responseType, etc.

**Runtime**:
1. Creates `HttpRequest<T>` with method POST, URL, body
2. Passes through interceptor chain
3. Sent via `XMLHttpRequest` or `fetch` (Angular 18+)
4. Response body parsed as JSON
5. Typed as `AuthResponse` (compile-time assertion only)

### Security Note

`<AuthResponse>` is a **trust annotation**, not a validation. The actual response could be anything. If the server returns `{ foo: "bar" }`, TypeScript still treats it as `AuthResponse`. Runtime behavior depends on property access — accessing `.token` on `{ foo: "bar" }` returns `undefined`, which is handled by `getResponseToken`.

---

## 6.4 CanActivateFn

### Code

```typescript
export const authGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const tokenService = inject(TokenService);
  const router = inject(Router);

  return authState.isAuthenticated() || tokenService.isLoggedIn() ? true : router.createUrlTree(['/login']);
};
```

### Type Signature

```typescript
type CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree;
```

**Return types**:
- `boolean`: Synchronous yes/no
- `UrlTree`: Redirect to this URL instead (via `router.createUrlTree`)
- `Observable<boolean | UrlTree>`: Async result
- `Promise<boolean | UrlTree>`: Async result

### Router Integration

1. Router evaluates guards BEFORE activating the route
2. If guard returns `UrlTree`, router:
   - Cancels current navigation
   - Starts new navigation to the `UrlTree`
3. Multiple guards run in parallel (if multiple on same route)
4. Router waits for ALL guards to resolve
5. If ANY guard returns `UrlTree`, redirect happens

### Functional vs Class Guard

```typescript
// Old (Angular <15):
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  canActivate(): boolean { ... }
}

// New (Angular 15+):
export const authGuard: CanActivateFn = () => { ... };
```

Functional guards are:
- Simpler (no class, no decorator)
- Tree-shakeable
- Injectable via `inject()` in function body
- Better for single-purpose guards

---

## 6.5 tap Operator

### Code

```typescript
.pipe(
  tap((response) => {
    const token = this.getResponseToken(response);
    if (token) {
      this.tokenService.saveToken(token);
      this.authState.setAuthenticated(true);
      this.authState.setCurrentUser(...);
    }
  }),
)
```

### Type Signature

```typescript
function tap<T>(
  observerOrNext?: ((value: T) => void) | Partial<Observer<T>>,
  error?: (error: any) => void,
  complete?: () => void,
): MonoTypeOperatorFunction<T>
```

`MonoTypeOperatorFunction<T>`: Does NOT change the type — `Observable<T>` in, `Observable<T>` out.

### Conceptual

`tap` is for **side effects**: operations that need to happen when the observable emits but don't transform the value. It is transparent to the data flow.

**Why NOT map**:
```typescript
// Works but semantically wrong:
map(response => {
  this.tokenService.saveToken(token);
  return response;  // Must return, even though we didn't transform
})
```

`map` implies transformation. `tap` implies side effects. Using the correct operator communicates intent.

### Common tap Gotchas

- `tap` side effects should be synchronous (as in this code — `localStorage.setItem` and `signal.set` are both sync)
- Async side effects in `tap` lead to race conditions
- `tap` does NOT delay the emission — subscribers receive the value immediately even if `tap` has pending work

---

## 6.6 finalize Operator

### Code

```typescript
.pipe(finalize(() => this.isLoading.set(false)))
```

### Conceptual

`finalize` registers a callback that runs when the source observable TERMINATES:
- On `complete` (normal completion)
- On `error` (error termination)
- On `unsubscribe` (consumer unsubscribes before completion)

### Why NOT complete/subscribe

```typescript
// BUG: complete doesn't run on error
.subscribe({
  next: ...,
  error: ...,
  complete: () => this.isLoading.set(false)  // only on complete!
})
```

`finalize` runs on ALL termination paths. This is why `isLoading.set(false)` is in `finalize`, not in `subscribe.complete`.

### Internal Mechanics

RxJS tracks `finalize` callbacks in the subscription's teardown stack. When the subscription unsubscribes or completes, the teardown stack runs in LIFO order.

---

## 6.7 FormBuilder.nonNullable.group()

### Code

```typescript
readonly form = this.fb.nonNullable.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required]],
});
```

### What nonNullable Does

Without `nonNullable`:
```typescript
// Form reset sets value to null
form.reset();  // form.value = { email: null, password: null }
```

With `nonNullable`:
```typescript
// Form reset restores initial value
form.reset();  // form.value = { email: '', password: '' }
```

### Type Impact

Without `nonNullable`:
```typescript
FormGroup<{
  email: FormControl<string | null>,
  password: FormControl<string | null>
}>
```

With `nonNullable`:
```typescript
FormGroup<{
  email: FormControl<string>,
  password: FormControl<string>
}>
```

This eliminates `null` checks throughout the component.

### Internal Mechanics

`FormBuilder.nonNullable` returns a `FormBuilder` instance configured with `nullValidator: false`. Each `FormControl` created uses the initial value as the reset value.

---

## 6.8 inject()

### Usage Throughout

```typescript
private readonly http = inject(HttpClient);
private readonly tokenService = inject(TokenService);
private readonly authState = inject(AuthStateService);
```

### Conceptual

`inject()` replaces constructor-based DI. It's a function that resolves dependencies from the current injection context.

### Injection Context Requirements

`inject()` can only be called during synchronous execution in an injection context:

| Context | Works? | Example |
|---------|--------|---------|
| Class constructor | ✓ | `constructor() { inject(TokenService); }` |
| Field initializer | ✓ | `private readonly x = inject(X);` |
| Factory function | ✓ | `factory: () => inject(X)` |
| `CanActivateFn` | ✓ | Functional guard body |
| `HttpInterceptorFn` | ✓ | Interceptor function body |
| setTimeout callback | ✗ | Not in injection context |
| Promise.then callback | ✗ | Not in injection context |

### Why inject() Over Constructor DI

1. **Less boilerplate**: No `constructor(private readonly x: X) {}`
2. **Works in functional contexts**: Guards, interceptors, resolvers
3. **Better tree-shaking**: Unused injections can be detected
4. **No parameter-property confusion**: Clear separation of injection from class logic

### Runtime

1. Angular maintains a **current injector** on a global stack during DI resolution
2. `inject()` reads from this stack
3. If no injector is on the stack → throws `NullInjectorError`

---

## 6.9 HttpInterceptorFn

### Code

```typescript
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(TokenService).getToken();
  if (!token) { return next(request); }
  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
```

### Type Signature

```typescript
type HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => Observable<HttpEvent<unknown>>;
```

- `req: HttpRequest<unknown>`: The immutable request
- `next: HttpHandlerFn`: The next handler in the chain (another interceptor or the backend)
- Returns: `Observable<HttpEvent<unknown>>`

### Interceptor Chain Execution

```
Request created by HttpClient
  │
  ├─ Interceptor 1 (authInterceptor):
  │     ├─ inject(token?), authenticate request
  │     └─ next(clonedRequest) → passes to next interceptor
  │
  ├─ Interceptor 2 (refreshTokenInterceptor):
  │     ├─ next(req) → passes to backend
  │     └─ catches 401 errors
  │
  └─ Backend (HttpBackend):
        ├─ Sends actual HTTP request
        └─ Returns Observable<HttpEvent>
```

The chain is a nested callback structure. Each interceptor calls `next()` which invokes the next interceptor or the backend.

### Immutability

`request.clone()` creates a new `HttpRequest`:
- Original headers preserved
- `setHeaders` merges/replaces specific headers
- Body, URL, params, responseType all copied

Mutating the original request (e.g., `request.headers.set(...)`) throws because `HttpHeaders` is immutable.

---

## 6.10 catchError Operator

### Code

```typescript
catchError((error: unknown) => {
  if (error instanceof HttpErrorResponse && error.status === 401) {
    tokenStore.clear();
    void router.navigate(['/auth/login']);
  }
  return throwError(() => error);
})
```

### Type Signature

```typescript
function catchError<T, O extends T>(
  selector: (err: any, caught: Observable<T>) => ObservableInput<O>
): OperatorFunction<T, T | O>
```

**Key details**:
- `selector` receives the error and the source observable
- Must return an `ObservableInput` (Observable, Promise, Array, Iterable)
- Returning `throwError(() => error)` re-throws the error
- Returning `of(fallbackValue)` recovers from the error (emits fallback)

### catchError vs Error Callback

```typescript
// catchError runs INSIDE the observable pipeline:
source.pipe(
  catchError(err => {
    // Can recover or re-throw
    return of(fallback); // error handled, stream continues
  })
)

// subscribe.error runs OUTSIDE the pipeline:
source.subscribe({
  error: err => {
    // Cannot recover — stream is dead
    // Must handle error here
  }
})
```

`catchError` is more powerful because it can recover from errors (return a fallback observable). The `subscribe.error` callback only handles errors — the stream still terminates.

### throwError Factory

```typescript
throwError(() => error)  // Modern: factory defers error creation
throwError(error)         // Deprecated: eagerly creates error
```

The factory form defers error creation until subscription. In this context, it re-creates the exact same error and re-throws it down the observable chain.

---

## 6.11 UrlTree

### Code

```typescript
return router.createUrlTree(['/login']);
```

### What It Is

`UrlTree` is Angular's internal representation of a parsed URL:
```typescript
class UrlTree {
  root: UrlSegmentGroup;
  queryParams: { [key: string]: string };
  fragment: string | null;
}
```

### Why Return UrlTree Instead of Calling navigate

- **Declarative**: The guard RETURNS a navigation instruction rather than executing it
- **Router orchestration**: Router collects ALL guard results and performs ONE navigation
- **No side effects in guards**: Guards should be pure functions that return decisions
- **Avoids redirect loops**: Router checks if the UrlTree is the same as current URL

---

## 6.12 isRecord Type Guard

### Code

```typescript
private isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
```

### What It Does

A **type predicate** (`value is Record<string, unknown>`) that narrows `unknown` to a key-value record at runtime.

### Why Not Just `typeof value === 'object'`

```typescript
typeof null === 'object'   // true! JavaScript quirk
typeof [1,2,3] === 'object'  // true!
```

Three checks are needed:
1. `typeof value === 'object'` — guarantees it's an object type
2. `value !== null` — `typeof null === 'object'` is a JavaScript bug
3. `!Array.isArray(value)` — arrays are objects but not records

### Why isRecord Instead of `as Record<string, unknown>`

Type assertion (`as Record<string, unknown>`) doesn't check anything at runtime. `isRecord` is a type guard that actually validates the structure at runtime.

---

# 7. Data Flow Analysis

## 7.1 Login Data Flow

```
[User Input]
  email: "user@example.com"
  password: "secret123"
      │
      ▼
[LoginPage.form]
  FormGroup<{ email: string, password: string }>
  → getRawValue() → { email: "user@example.com", password: "secret123" }
      │
      ▼
[LoginRequest]
  { email: "user@example.com", password: "secret123" }
      │
      ▼
[AuthService.login()]
  → http.post<AuthResponse>(url, request)
      │
      ▼
[HttpClient]
  → Creates HttpRequest
  → Interceptor chain:
    authInterceptor: getToken() → null → pass through
    refreshTokenInterceptor: pass through
  → Sends request via fetch/XHR
      │
      ▼
[Server Response]
  200 OK:
  {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
    "user": {
      "id": "abc-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin"
    }
  }
      │
      ▼
[AuthService.login() — tap]
  ├─ getResponseToken(response) → "eyJhbGciOiJIUzI1NiIs..."
  ├─ TokenService.saveToken(token)
  │   → localStorage.setItem('cinemaverse_token', "eyJhbGciOiJIUzI1NiIs...")
  ├─ AuthStateService.setAuthenticated(true)
  │   → isAuthenticatedSignal.set(true)
  │   → SignalNode: false → true
  │   → Dependents marked dirty:
  │     - toObservable effect (scheduled)
  │     - Template bindings (markForCheck)
  └─ AuthStateService.setCurrentUser(response.user)
      → currentUserSignal.set({ id: "abc-123", email: "...", firstName: "John", ... })
      → SignalNode: null → user
      → Dependents marked dirty:
        - toObservable effect (scheduled)
        - Template bindings (markForCheck)
      │
      ▼
  [RxJS Pipeline]
  → Observable emits AuthResponse
  → finalize(() => isLoading.set(false))
  → Subscriber receives response
      │
      ▼
[LoginPage.subscribe.next]
  → void this.router.navigate(['/admin/dashboard'])
  → Router starts navigation to /admin/dashboard
      │
      ▼
[Router Guard Evaluation]
  → authGuard() runs again
  → authState.isAuthenticated() → true
  → Returns true
  → Route activated
```

## 7.2 Registration Data Flow

```
[User Input]
  firstName: "John", lastName: "Doe", email: "j@d.com",
  password: "pass1234", phoneNumber: "+1234567890",
  address: "123 Main St", city: "NYC",
  dateOfBirth: "1990-01-15", gender: "Male"
      │
      ▼
[RegisterPage.form]
  → getRawValue() → { firstName: "John", ... }
      │
      ▼
[toRegisterRequest()]
  → Spread rawValue: { ...rawValue }
  → dateOfBirth: toIsoDate("1990-01-15")
    → "1990-01-15T00:00:00.000Z"
  → Returns RegisterRequest
      │
      ▼
[AuthService.register()]
  → http.post<AuthResponse>(url, request)
  → NO tap() — no state update
      │
      ▼
[Server]
  → Creates user account
  → Returns AuthResponse (likely just { message: "success" })
      │
      ▼
[RegisterPage.subscribe.next]
  → void this.router.navigate(['/login'])
  → User must log in separately
```

## 7.3 Error Data Flow

```
[Server returns error response]
  Status: 400 Bad Request
  Body: {
    "errors": {
      "Email": ["Email is already registered"],
      "Password": ["Password must be at least 8 characters"]
    }
  }
      │
      ▼
[HttpClient receives error]
  → Creates HttpErrorResponse {
      status: 400,
      error: { errors: { Email: ["..."], Password: ["..."] } }
    }
      │
      ▼
[refreshTokenInterceptor]
  → status !== 401 → pass through
      │
      ▼
[AuthService.register()]
  → Error passes through pipe (no catchError here)
      │
      ▼
[RegisterPage.subscribe.error]
  → errorMessage.set(getErrorMessage(error, "Registration failed"))
      │
      ▼
[getErrorMessage(error, "Registration failed")]
  → error instanceof HttpErrorResponse? Yes
  → typeof error.error is 'object'
  → isRecord(apiError)? Yes
  → apiError['errors'] exists and isRecord
  → extractValidationErrors(errors)
    → Object.values({ Email: ["Email is already registered"] })
    → flatMap → ["Email is already registered"]
  → Returns "Email is already registered"
      │
      ▼
[errorMessage signal updated]
  → Template reads errorMessage() → displays error string
```

---

# 8. State Management Analysis

## 8.1 State Inventory

| State | Type | Owner | Storage | Reactive? | Scope |
|-------|------|-------|---------|-----------|-------|
| `isAuthenticated` | `boolean` | `AuthStateService` | Signal | Yes | Global singleton |
| `currentUser` | `AuthUser \| null` | `AuthStateService` | Signal | Yes | Global singleton |
| `isLoading` | `boolean` | `LoginPage` / `RegisterPage` | Signal | Yes | Component-local |
| `errorMessage` | `string \| null` | `LoginPage` / `RegisterPage` | Signal | Yes | Component-local |
| `showPassword` | `boolean` | `LoginPage` / `RegisterPage` | Signal | Yes | Component-local |
| Form values | Various | `LoginPage` / `RegisterPage` | FormGroup | Yes | Component-local |
| Access token | `string` | `TokenService` | localStorage | No | Global |
| Refresh token | `string` | `TokenStoreService` | localStorage | No | Global |
| Role | `string` | `TokenStoreService` | localStorage | No | Global |

## 8.2 State Ownership Rules

1. **`AuthStateService`** owns canonical auth state (signals). Single source of truth.
2. **`AuthService`** orchestrates state mutations based on HTTP responses and token hydration.
3. **UI components** own ephemeral state (`isLoading`, `errorMessage`) — not shared.
4. **`localStorage`** is a persistence layer, not state. It is read during init, written during login/logout.

## 8.3 State Consistency Guarantees

| Operation | Write Order | Consistency Model |
|-----------|-------------|-------------------|
| Login | (1) localStorage → (2) signal | If app crashes between (1) and (2), on reload token exists → constructor rehydrates signal. **Eventual consistency** |
| Logout | (1) localStorage.remove → (2) signal.clear | Synchronous. Any race window is within a microtask. |
| Constructor hydration | (1) localStorage.read → (2) signal.set | Synchronous. Guard may evaluate before constructor runs (handled by dual check). |

## 8.4 State Propagation Paths

```
AuthStateService.setAuthenticated(true)
  │
  ├─ [Signal read in template]
  │     → ViewNode consumer marked dirty
  │     → ApplicationRef.tick() scheduled
  │     → Template re-evaluated
  │     → DOM updated
  │
  ├─ [toObservable → Observable]
  │     → effect scheduled (microtask)
  │     → effect reads new value
  │     → ReplaySubject.next(true)
  │     → async pipe subscriber notified
  │     → Template re-evaluated
  │     → DOM updated
  │
  └─ [Guard reads signal]
        → Direct function call (synchronous)
        → Returns boolean immediately
```

---

# 9. Algorithms & Control Flow

## 9.1 JWT Payload Decoding Algorithm

```
Input: token (JWT string "header.payload.signature")

1. Split '.' → ["header", "payload", "signature"]
2. Take element[1] → base64urlPayload
3. If undefined/null → return null

4. Replace base64url → base64:
   '-' → '+'  (RFC 4648 §5)
   '_' → '/'  (RFC 4648 §5)

5. atob(base64) → latin1String

6. For each character in latin1String:
   a. charCodeAt(0) → byte (0-255)
   b. byte.toString(16) → hex
   c. hex.padStart(2, '0') → 2-char hex
   d. prepend '%' → percent-encoded byte

7. Join all → percent-encoded string

8. decodeURIComponent(percentEncoded) → UTF-8 string

9. JSON.parse(utf8String) → object

10. isRecord(object)? (object, not null, not array)
    → Yes: return as Record<string, unknown>
    → No: return null

Whole thing wrapped in try-catch → return null on any error
```

**Why this algorithm exists**: `atob()` produces Latin-1 (single byte per character). For JWT payloads containing Unicode characters (accents, CJK, emoji), each multi-byte UTF-8 character in the base64-decoded value is represented as multiple Latin-1 characters. Direct `JSON.parse(atob(base64))` would produce garbled strings. The percent-encoding pattern correctly decodes UTF-8 byte sequences.

**Alternative**: `TextDecoder` API:
```typescript
const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
const json = new TextDecoder().decode(bytes);
```
This is cleaner but requires array allocation. The percent-encoding pattern avoids `TextDecoder` for broader compatibility.

## 9.2 User Resolution Algorithm

```
Input: AuthResponse response

Step 1: Try response.user object
  response.user exists?
  → Yes: return response.user
  → No: go to Step 2

Step 2: Decode from token
  token = response.token ?? response.accessToken
  token exists?
  → Yes:
    payload = decodeJwtPayload(token)
    payload valid?
    → Yes: extract claims → AuthUser
    → No: go to Step 3
  → No: go to Step 3

Step 3: Construct from response fields
  response has userId OR email OR role?
  → Yes: construct AuthUser from response fields
  → No: return null

Return AuthUser or null
```

**Priority order**:
1. **Explicit user object** (most trustworthy — server explicitly provides user data)
2. **JWT claim extraction** (works when token contains user claims)
3. **Response field extraction** (last resort — minimal information)
4. **Null** (no user info available)

## 9.3 Auth Guard Decision Algorithm

```
Input: none (depends on DI)

1. Read authState.isAuthenticated() → boolean
2. If true → return true (allow navigation)

3. Read tokenService.isLoggedIn()
   → tokenService.getToken() → localStorage.getItem()
   → !!result

4. If true → return true (allow navigation)

5. Return router.createUrlTree(['/login'])
   → redirect to login page
```

**Decision tree**:
```
Is signal true?
├─ Yes → ALLOW
└─ No → Is token in localStorage?
         ├─ Yes → ALLOW
         └─ No → REDIRECT to /login
```

---

# 10. Performance Engineering Analysis

## 10.1 Signal Overhead

| Operation | Cost | Allocation |
|-----------|------|-----------|
| `signal()` creation | ~few µs | `SignalNode` object |
| `signal()` read | ~0.1 µs | None (direct closure access) |
| `signal.set()` w/o consumers | ~0.2 µs | None |
| `signal.set()` w/ 1 consumer | ~0.5 µs | None (dirty marking) |
| `signal.set()` w/ 10 consumers | ~2 µs | None |

**Auth module**: `AuthStateService` has 2 signals, consumed by:
- `AuthGuard` (reads `isAuthenticated`)
- `toObservable` × 2 (creates 2 effects)
- Template bindings (if any component directly reads the signal)

Total signal cost: negligible (microseconds).

## 10.2 toObservable Overhead

Each `toObservable` creates:
1. **1 Effect**: Reactive consumer with scheduling (microtask)
2. **1 ReplaySubject(1)**: Buffer + subscriber management
3. **Effect callback closure**: Retains reference to signal and subject

Two `toObservable` calls in `AuthService` → 2 effects + 2 subjects.

**Optimization**: If `ProfilePage` is the only consumer of `currentUser$`, it could read the signal directly instead:
```typescript
// Current: signal → effect → Subject → Observable → async pipe
// Simplified: signal → template binding (direct)
readonly me = this.authService.currentUser; // Signal<AuthUser | null>
```
This eliminates the observable layer and its overhead.

## 10.3 HTTP Interceptor Overhead

| Interceptor | Success Path | Error Path |
|-------------|-------------|------------|
| `authInterceptor` | `localStorage.getItem()` ~0.1ms | Same |
| `refreshTokenInterceptor` | `next(req)` — no work | `instanceof` check + conditional logic |

Both interceptors have negligible overhead on the success path.

## 10.4 Expensive Operations

1. **JWT decoding** (`decodeJwtPayload`): Runs in `AuthService` constructor + on login.
   - String splitting, regex replacements, `atob()`, character-by-character mapping, `JSON.parse()`
   - For short JWT (~500 bytes): ~0.05ms
   - Scales with token size (O(n) in payload length)

2. **getErrorMessage JSON probing**: `Object.values(apiError).flat().find(...)` — iterates error object properties. With deeply nested objects, could be ~100 property accesses.

3. **localStorage reads**: `getToken()`, `getRefreshToken()`, `getRole()` each do synchronous I/O. For auth flows, these run infrequently (once per navigation/request).

## 10.5 Optimization Opportunities

1. **Cache decoded JWT payload**: `decodeJwtPayload` runs every time `userFromToken` is called. If called multiple times with the same token, it re-decodes. A `Map<string, AuthUser>` cache prevents this:
   ```typescript
   private readonly tokenCache = new Map<string, AuthUser>();
   ```
2. **Remove unused `toObservable`**: `isAuthenticatedObservable` is only used by `isAuthenticated$()` method. If no consumer uses this method, the observable and its effect are wasted.

3. **Skip token injection for auth endpoints**: `authInterceptor` runs on login/register requests where no token exists. Adding a bypass:
   ```typescript
   if (req.url.includes('/api/auth/')) return next(req);
   ```

4. **Lazy `userFromToken`**: Current constructor calls `userFromToken` even if the component doesn't need user data. However, `AuthService` is a singleton, so this runs once regardless.

## 10.6 Change Detection Impact

- **Signals**: Trigger `markForCheck()` on the component → OnPush checks only that component's view
- **`isAuthenticated` signal change**: Components reading it get marked dirty
- **`currentUser` signal change**: Components reading it get marked dirty
- **Form state changes**: Reactive Forms use Zone.js for change detection (form value changes trigger CD)

---

# 11. Scalability & Enterprise Analysis

## 11.1 What Breaks at Scale

### Token Refresh
The `refreshTokenInterceptor` clears all tokens on ANY 401. In production:
- Access tokens expire every 15-60 minutes
- Without automatic refresh, users are logged out every hour
- Multiple concurrent requests returning 401 trigger redundant clear + redirect

**Enterprise solution**: Implement OAuth2 token refresh flow:
1. Catch 401
2. Queue concurrent 401s
3. Call refresh endpoint once
4. Retry all queued requests with new token
5. Only clear + redirect if refresh fails

### Storage Strategy
`localStorage` is:
- Synchronous (blocks main thread)
- Limited (~5-10MB per origin)
- Accessible to JavaScript (XSS vulnerability)
- Not cleared on tab close

**Enterprise alternatives**:
| Strategy | Pros | Cons |
|----------|------|------|
| `localStorage` | Simple, persists across tabs | XSS vulnerable, synchronous |
| HttpOnly cookie | Not accessible to JS, auto-sent | CSRF vulnerable, harder to revoke |
| In-memory + refresh cookie | More secure, token lost on close | Requires refresh flow |
| `sessionStorage` | Cleared on tab close | Doesn't persist across tabs |

### Error Format Diversity
`getErrorMessage` probes multiple keys to handle different ASP.NET error formats. At scale with multiple backend services, each service might use a different error format. The probing approach becomes fragile.

**Enterprise solution**: Standardized error response format across all services (e.g., Problem Details RFC 7807), with a shared client-side error parser.

### Route Guard Performance
`authGuard` reads `localStorage` synchronously on every navigation. With many rapid route changes (e.g., tab switching), this could become a bottleneck. However, `localStorage` reads are ~0.1ms — unlikely to be significant.

## 11.2 Enterprise-Grade Architecture

### Multi-Tenant Authentication

```typescript
// Conceptual
export const AUTH_CONFIG = new InjectionToken<AuthConfig>('auth.config');

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(@Inject(AUTH_CONFIG) private config: AuthConfig) {
    // config.apiUrl, config.storageKey, config.refreshEndpoint
  }
}
```

### Feature Flag Integration

```typescript
// Conceptual: could conditionally enable new auth flows
if (featureFlags.enabled('oauth2')) {
  return this.oauthService.login(request);
} else {
  return this.http.post(url, request);
}
```

## 11.3 Maintainability Concerns

1. **Duplicate model interfaces**: `AuthResponse` exists in both `auth.models.ts` and `models/auth-response.ts`. These could diverge over time.

2. **Barrel exports**: `auth.service.ts` is a barrel re-exporting from `services/auth.service.ts`. `token-store.service.ts` lives one level up instead of in `services/`. Inconsistent module boundaries.

3. **No InjectionToken for API URL**: `API_BASE_URL` is a const export. For different environments, this constant must change. Enterprise apps should use Angular's environment files or `APP_INITIALIZER` for dynamic configuration.

4. **Mixed naming conventions**: `AuthUser` in models, `CurrentUser` in `auth.models.ts`. Two similar types with different field sets could cause confusion.

## 11.4 Refactoring Opportunities

1. **Consolidate models**: Remove `auth.models.ts` or `models/` — keep one canonical location
2. **Add `InjectionToken<AuthConfig>`**: For API URL, token keys, endpoints
3. **Encapsulate localStorage**: Create an `AuthStorageService` that centralizes ALL storage operations
4. **Add token expiry checking**: In `authGuard` and `tokenService.isLoggedIn()`
5. **Remove `toObservable` bridge**: If all consumers are signal-compatible

---

# 12. Security Analysis

## 12.1 Trust Boundaries

```
[Browser/Client] ←── HTTPS ──→ [Backend Server]
     │                                  │
  User Input:                      Server validates:
  - email, password                 - credentials
  - registration fields            - required fields
  - token                          - token signature
                                   - expiry
                                   - authorization
```

**Trust boundary**: HTTPS is the ONLY trust boundary. Everything client-side is untrusted by the server. The server MUST re-validate all input.

## 12.2 Security Issues

### Token Storage in localStorage

**Risk**: JavaScript running on the same origin via XSS can read `localStorage.getItem('cinemaverse_token')`, exfiltrate the token, and impersonate the user.

**Mitigation in this code**: None. This is a known tradeoff in SPAs.

**Better alternatives**:
- **HttpOnly cookies**: Not accessible to JavaScript, but CSRF protection needed
- **Short-lived access tokens + refresh tokens in HttpOnly cookies**: Access token in memory, refresh in cookie

### JWT Payload Decoding Without Verification

The code decodes the JWT payload but does NOT verify the signature. This is CORRECT for client-side code:
- The client cannot verify the signature (requires server's secret key)
- JWT verification happens on the server on every API call
- The client only reads claims for UI purposes (name, role)
- If a manipulated JWT is stored, the client shows wrong info, but the server rejects the forged token on the next API call

### XSS in Error Messages

```typescript
// If API returns:
// { message: "<script>alert('XSS')</script>" }
this.errorMessage.set(apiErrorMessage);
```

**Client-side risk**: If `errorMessage()` is rendered with `innerHTML`, XSS is possible. Angular's `{{ errorMessage() }}` automatically escapes HTML entities. Safe by default.

### Password Exposure

- Password is sent as plaintext in POST body (over HTTPS — safe in transit)
- Password is NOT stored in `localStorage` or signals (good)
- Password is NOT logged or printed (good)
- Form control value is garbage collected after component destruction

## 12.3 Validation Boundaries

| Validation | Where | Purpose | Bypass Risk |
|-----------|-------|---------|-------------|
| Required fields | Client + Server | UX: prevent obvious errors | Server must re-validate |
| Email format | Client + Server | UX: immediate feedback | Server must re-validate |
| Password length | Client + Server | UX + Security | Server must re-validate |
| Token existence | Client | Route guard, auth header | Server validates token |
| Token expiry | Server only | Security | Client cannot check reliably |

**Rule**: Client validation is for USER EXPERIENCE only. Server validation is for SECURITY.

---

# 13. Testing Strategy

## 13.1 AuthStateService Unit Tests

```typescript
describe('AuthStateService', () => {
  let service: AuthStateService;

  beforeEach(() => {
    service = new AuthStateService();
  });

  it('should default to not authenticated with no user', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
  });

  it('should set authenticated state', () => {
    service.setAuthenticated(true);
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.currentUser()).toBeNull();
  });

  it('should set current user and mark authenticated', () => {
    const user: AuthUser = { id: '1', email: 'a@b.com', role: 'admin' };
    service.setCurrentUser(user);

    expect(service.currentUser()).toEqual(user);
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('should clear all state', () => {
    service.setAuthenticated(true);
    service.setCurrentUser({ id: '1', email: 'a@b.com', role: 'admin' });

    service.clear();

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
  });

  it('should not clear authentication when setting null user', () => {
    service.setAuthenticated(true);
    service.setCurrentUser(null);

    // isAuthenticated should still be true (preserved by the ||)
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('should expose readonly signals', () => {
    // TypeScript compile check: asReadonly() returns Signal<T>
    // without .set(), .update()
    const auth = service.isAuthenticated; // Type is Signal<boolean>
    expect(auth()).toBeFalse();
  });
});
```

## 13.2 TokenService Unit Tests

```typescript
describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    service = new TokenService();
    localStorage.clear();
  });

  it('should save and retrieve token', () => {
    service.saveToken('test-token');
    expect(service.getToken()).toBe('test-token');
  });

  it('should return null when no token exists', () => {
    expect(service.getToken()).toBeNull();
  });

  it('should remove token', () => {
    service.saveToken('test-token');
    service.removeToken();
    expect(service.getToken()).toBeNull();
  });

  it('should fall back to legacy keys in priority order', () => {
    localStorage.setItem('cv_access_token', 'legacy2');
    localStorage.setItem('access_token', 'legacy1');

    expect(service.getToken()).toBe('legacy2'); // Higher priority legacy
  });

  it('should clear legacy keys on remove', () => {
    localStorage.setItem('cv_access_token', 'old');
    localStorage.setItem('access_token', 'older');

    service.removeToken();

    expect(localStorage.getItem('cv_access_token')).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('should return isLoggedIn when token exists', () => {
    expect(service.isLoggedIn()).toBeFalse();

    service.saveToken('token');
    expect(service.isLoggedIn()).toBeTrue();
  });
});
```

## 13.3 AuthService Unit Tests

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let httpClient: jasmine.SpyObj<HttpClient>;
  let tokenService: jasmine.SpyObj<TokenService>;
  let authState: jasmine.SpyObj<AuthStateService>;

  beforeEach(() => {
    httpClient = jasmine.createSpyObj('HttpClient', ['post']);
    tokenService = jasmine.createSpyObj('TokenService', ['saveToken', 'getToken', 'removeToken']);
    authState = jasmine.createSpyObj('AuthStateService', ['setAuthenticated', 'setCurrentUser', 'clear']);

    service = new AuthService(httpClient, tokenService, authState);
  });

  describe('login', () => {
    it('should authenticate on successful login', () => {
      const request: LoginRequest = { email: 'a@b.com', password: '123' };
      const response: AuthResponse = { token: 'jwt.token', user: { id: '1', email: 'a@b.com', role: 'admin' } };
      httpClient.post.and.returnValue(of(response));

      service.login(request).subscribe();

      expect(httpClient.post).toHaveBeenCalledWith(
        'https://cinemaverse-api.tryasp.net/api/auth/login',
        request,
      );
      expect(tokenService.saveToken).toHaveBeenCalledWith('jwt.token');
      expect(authState.setAuthenticated).toHaveBeenCalledWith(true);
      expect(authState.setCurrentUser).toHaveBeenCalledWith(response.user);
    });

    it('should handle missing token in response', () => {
      const response: AuthResponse = { message: 'ok' }; // no token
      httpClient.post.and.returnValue(of(response));

      service.login({ email: '', password: '' }).subscribe();

      expect(tokenService.saveToken).not.toHaveBeenCalled();
      expect(authState.setAuthenticated).not.toHaveBeenCalledWith(true);
    });

    it('should extract token from accessToken fallback', () => {
      const response: AuthResponse = { accessToken: 'access-jwt' };
      httpClient.post.and.returnValue(of(response));

      service.login({ email: '', password: '' }).subscribe();

      expect(tokenService.saveToken).toHaveBeenCalledWith('access-jwt');
    });

    it('should handle HTTP error', () => {
      const errorResponse = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      httpClient.post.and.returnValue(throwError(() => errorResponse));

      service.login({ email: '', password: '' }).subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
        },
      });
    });
  });

  describe('logout', () => {
    it('should clear token and state', () => {
      service.logout();

      expect(tokenService.removeToken).toHaveBeenCalled();
      expect(authState.clear).toHaveBeenCalled();
    });
  });

  describe('userFromToken', () => {
    it('should extract user from JWT payload', () => {
      // JWT payload: { sub: "1", email: "a@b.com", role: "admin" }
      const token = 'header.' + btoa(JSON.stringify({
        sub: '1', email: 'a@b.com', role: 'admin'
      })) + '.signature';

      const user = service['userFromToken'](token);
      expect(user?.id).toBe('1');
      expect(user?.email).toBe('a@b.com');
      expect(user?.role).toBe('admin');
    });

    it('should return null for invalid JWT', () => {
      expect(service['userFromToken']('invalid')).toBeNull();
      expect(service['userFromToken']('')).toBeNull();
    });
  });
});
```

## 13.4 authGuard Unit Tests

```typescript
describe('authGuard', () => {
  let authState: jasmine.SpyObj<AuthStateService>;
  let tokenService: jasmine.SpyObj<TokenService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authState = jasmine.createSpyObj('AuthStateService', ['isAuthenticated']);
    tokenService = jasmine.createSpyObj('TokenService', ['isLoggedIn']);
    router = jasmine.createSpyObj('Router', ['createUrlTree']);

    // Mock inject() to return our spies
    // (requires TestBed or manual inject mocking)
  });

  it('should allow activation when authenticated', () => {
    authState.isAuthenticated.and.returnValue(true);

    const result = authGuard();
    expect(result).toBeTrue();
  });

  it('should allow activation when token exists', () => {
    authState.isAuthenticated.and.returnValue(false);
    tokenService.isLoggedIn.and.returnValue(true);

    const result = authGuard();
    expect(result).toBeTrue();
  });

  it('should redirect to login when not authenticated', () => {
    authState.isAuthenticated.and.returnValue(false);
    tokenService.isLoggedIn.and.returnValue(false);
    router.createUrlTree.and.returnValue(new UrlTree());

    const result = authGuard();

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toBeInstanceOf(UrlTree);
  });
});
```

## 13.5 authInterceptor Unit Tests

```typescript
describe('authInterceptor', () => {
  it('should add Authorization header when token exists', () => {
    const tokenService = TestBed.inject(TokenService);
    tokenService.saveToken('test-token');

    const req = new HttpRequest('GET', '/api/test');
    const next = jasmine.createSpy('next').and.returnValue(of(new HttpResponse()));

    authInterceptor(req, next).subscribe();

    const clonedReq = next.calls.first().args[0] as HttpRequest<unknown>;
    expect(clonedReq.headers.get('Authorization')).toBe('Bearer test-token');
  });

  it('should not add header when no token', () => {
    const req = new HttpRequest('GET', '/api/test');
    const next = jasmine.createSpy('next').and.returnValue(of(new HttpResponse()));

    authInterceptor(req, next).subscribe();

    const clonedReq = next.calls.first().args[0] as HttpRequest<unknown>;
    expect(clonedReq.headers.has('Authorization')).toBeFalse();
  });
});
```

## 13.6 LoginPage Integration Test

```typescript
describe('LoginPage', () => {
  it('should show error on failed login', fakeAsync(() => {
    // Arrange
    const authService = TestBed.inject(AuthService);
    spyOn(authService, 'login').and.returnValue(
      throwError(() => new HttpErrorResponse({
        status: 401,
        error: { message: 'Invalid credentials' },
      }))
    );

    const component = TestBed.createComponent(LoginPage).componentInstance;
    component.form.setValue({ email: 'a@b.com', password: 'wrong' });

    // Act
    component.submit();
    tick();

    // Assert
    expect(component.errorMessage()).toBe('Invalid credentials');
    expect(component.isLoading()).toBeFalse();
  }));

  it('should navigate on successful login', fakeAsync(() => {
    const authService = TestBed.inject(AuthService);
    spyOn(authService, 'login').and.returnValue(
      of({ token: 'jwt' } as AuthResponse)
    );
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    const component = TestBed.createComponent(LoginPage).componentInstance;
    component.form.setValue({ email: 'a@b.com', password: 'correct' });

    component.submit();
    tick();

    expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
  }));

  it('should not submit when form is invalid', () => {
    const authService = TestBed.inject(AuthService);
    spyOn(authService, 'login');

    const component = TestBed.createComponent(LoginPage).componentInstance;
    component.form.setValue({ email: 'invalid-email', password: '' });

    component.submit();

    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should prevent duplicate submission while loading', () => {
    const authService = TestBed.inject(AuthService);
    spyOn(authService, 'login').and.returnValue(never()); // never completes

    const component = TestBed.createComponent(LoginPage).componentInstance;
    component.form.setValue({ email: 'a@b.com', password: 'pass' });

    component.submit(); // First call — starts loading
    component.submit(); // Second call — blocked by isLoading

    expect(authService.login).toHaveBeenCalledTimes(1);
  });
});
```

---

# 14. Common Engineering Mistakes

## 14.1 Beginner Mistakes

**1. Not unsubscribing from observables**
```typescript
// Wrong: causes memory leak on component destroy
this.authService.currentUser$.subscribe(user => {...});

// Correct: async pipe auto-unsubscribes
me$ = this.authService.currentUser$;
// Template: {{ me$ | async }}

// Or: takeUntilDestroyed
this.authService.currentUser$.pipe(
  takeUntilDestroyed()
).subscribe(user => {...});
```

**2. Calling inject() outside injection context**
```typescript
// Wrong: throws NullInjectorError
setTimeout(() => {
  const auth = inject(AuthService);
}, 100);

// Correct: pass the dependency to the closure
const auth = inject(AuthService);
setTimeout(() => {
  auth.login(...);
}, 100);
```

**3. Using `value` instead of `getRawValue()`**
```typescript
// Bug: disabled controls are excluded from value
this.authService.login(this.form.value);

// Correct: getRawValue includes disabled controls
this.authService.login(this.form.getRawValue());
```

## 14.2 Architectural Mistakes

**1. Missing token refresh mechanism**
The app logs users out on every 401. In production, access tokens expire every 15 min. Users would be logged out constantly.

**2. No `InjectionToken` for configuration**
`API_BASE_URL` is a hardcoded const. Different environments (dev/staging/prod) require code changes.

**3. Guard hydration race**
The guard has a dual check to handle the window before `AuthService` constructor runs. This is a symptom of the underlying architectural issue: state hydration is decoupled from route activation.

## 14.3 Reactive Mistakes

**1. Missing `distinctUntilChanged` on `toObservable`**
```typescript
// Bug: emits even when signal value hasn't changed
this.isAuthenticatedObservable = toObservable(this.authState.isAuthenticated);

// Fix: only emit on actual changes
this.isAuthenticatedObservable = toObservable(this.authState.isAuthenticated).pipe(
  distinctUntilChanged()
);
```

**2. Misleading `loadMe` method**
```typescript
loadMe(): Observable<CurrentUser | null> {
  return of(this.toCurrentUser(this.authState.currentUser()));
}
```
This snapshots the current signal value into an observable. It does NOT react to changes. The name `loadMe` implies an HTTP call, but it's just a synchronous read wrapped in `of()`. Misleading naming violates the principle of least surprise.

## 14.4 Performance Mistakes

**1. JWT decoding without caching**
```typescript
// Decoded every time userFromToken is called
private userFromToken(token: string): AuthUser | null {
  const payload = this.decodeJwtPayload(token);
  ...
}
```
If `userFromToken` is called multiple times with the same token (constructor + login), JWT is decoded twice. Add a cache:
```typescript
private readonly tokenUserCache = new Map<string, AuthUser>();
```

**2. `toObservable` for unused observable**
`isAuthenticatedObservable` and its `isAuthenticated$()` method are created but may never be subscribed to. The effect and Subject are still allocated.

## 14.5 RxJS Anti-Patterns

**1. Nested subscriptions**
```typescript
// Anti-pattern (not in this codebase, but nearby risk)
this.authService.login(request).subscribe(response => {
  this.http.get('/api/something').subscribe(data => {
    // Nested subscription — should use switchMap
  });
});
```

**2. Missing error handling in `next` handler**
```typescript
// Current code is correct:
.subscribe({
  next: () => void this.router.navigate([...]),
  error: (error) => this.errorMessage.set(...)
});

// Wrong: unhandled error
.subscribe(() => {
  // If navigate throws, error is unhandled
  this.router.navigate([...]).catch(() => {});
});
```

---

# 15. Senior-Level Engineering Insights

## 15.1 Why Signals Were Chosen Over BehaviorSubject

`AuthStateService` uses `signal` instead of `BehaviorSubject`. This is a deliberate architectural choice:

| Aspect | signal | BehaviorSubject |
|--------|--------|-----------------|
| API | `.set(value)` | `.next(value)` |
| Read | `signal()` (function call) | `subject.value` or `.subscribe()` |
| Readonly | `.asReadonly()` | `.asObservable()` |
| Cleanup | Automatic (DestroyRef) | Manual `.unsubscribe()` |
| Change Detection | Direct → `markForCheck()` | Zone.js or manual |
| Fine-grained | Yes — per-signal consumer tracking | No — new emission triggers all subscribers |

**The senior engineer's reasoning**: Signals integrate directly with Angular's change detection. A signal change marks only the specific component's view node for check. A `BehaviorSubject` emission triggers Zone.js, which runs change detection on the entire component tree (unless OnPush is used).

**Tradeoff**: Signals are newer and have fewer utility functions. The `toObservable` bridge compensates but adds complexity.

## 15.2 Why TokenService and AuthStateService Are Separate

**Single Responsibility Principle at work**:

- `TokenService` handles **persistence** (what: `localStorage` read/write/delete)
- `AuthStateService` handles **reactive state** (how: signals for consumers)

If the storage mechanism changes (localStorage → sessionStorage → HttpOnly cookie → in-memory), only `TokenService` changes. If the state shape changes (add `lastLogin`, `permissions`), only `AuthStateService` changes.

## 15.3 Why the Guard Has a Dual Check

The guard checks BOTH the signal AND `localStorage`:

```typescript
return authState.isAuthenticated() || tokenService.isLoggedIn() ? true : router.createUrlTree(['/login']);
```

**Why this matters**: 

1. **Signal-first**: Fast path — if the signal is already `true`, no `localStorage` read needed
2. **localStorage fallback**: Covers the window between page load and `AuthService` injection

**Without the fallback**:
```
Page refresh → guard runs → signal is false (AuthService not created yet)
→ redirect to /login
→ AuthService creates on login page → signal becomes true
→ redirect back to original route (if login guard passes)
→ Flash of login page
```

**Senior engineer's solution**: The dual check prevents this flash with minimal complexity.

## 15.4 Why providedIn: 'root' Everywhere

All services use `@Injectable({ providedIn: 'root' })`. This means:
- **Singleton scope**: One instance for the entire application
- **Tree-shakable**: If a service is never injected, it's excluded from the bundle
- **No manual providers**: No `providers: [...]` arrays needed in modules or components

For auth services, root scope is correct — auth state must be consistent across the entire app. For non-auth services, this would be wrong (would create unnecessary singletons).

## 15.5 Architectural Evolution Paths

### Path 1: Add Token Refresh
```typescript
// Extend refreshTokenInterceptor:
1. On 401: check if refresh token exists
2. If yes: call /api/auth/refresh with refresh token
3. On success: save new access token, retry original request
4. On failure: clear all, redirect to login
5. Queue concurrent 401s to avoid multiple refresh calls
```

### Path 2: Add Role-Based Access
```typescript
// Extend AuthStateService:
readonly role = signal<string | null>(null);

// Add role guard:
export const roleGuard = (requiredRole: string): CanActivateFn => () => {
  const authState = inject(AuthStateService);
  return authState.role() === requiredRole
    ? true
    : inject(Router).createUrlTree(['/403']);
};

// Route config:
{ path: 'admin', canActivate: [authGuard, roleGuard('admin')] }
```

### Path 3: Migrate to Signals-Only
```typescript
// Remove toObservable usage entirely:
// AuthService exposes signals directly:
readonly currentUser = this.authState.currentUser.pipe(
  map(user => this.toCurrentUser(user))
); // Or just expose the signal as-is

// ProfilePage reads directly:
me = this.authService.currentUser;
// Template: {{ me()?.email }}
```

### Path 4: Add Biometric / OAuth
- Use strategy pattern for authentication providers
- `InjectionToken<AuthProvider>` for DI-based provider selection
- Each provider implements `login(request): Observable<AuthResponse>`

## 15.6 Hidden Framework Philosophy

### Why Angular Ships Signals in 17+

Before signals, Angular had two reactivity models:
1. **Zone.js** — monkey-patches browser APIs, triggers change detection on ANY async activity
2. **RxJS** — explicit observable pipelines, requires manual subscription management

Signals provide a THIRD model that combines the best of both:
- **Automatic dependency tracking** (like Zone.js but fine-grained)
- **Explicit value updates** (like RxJS but simpler)
- **Framework integration** (change detection, lifecycle, template bindings)

The philosophy: **reactive atoms compose into reactive systems without boilerplate**.

### Why HttpClient Returns Observables

`HttpClient.post<T>()` returns `Observable<T>` instead of `Promise<T>` because:
1. **Lazy execution**: Observables don't start the request until subscribed (with default `HttpBackend`)
2. **Operators**: Chaining, mapping, error recovery, retry logic
3. **Cancellation**: `unsubscribe()` aborts in-flight requests
4. **Interceptors**: The observable pipeline allows interceptors to modify the request/response

The `Observable<T>` contract gives more power than `Promise<T>` at the cost of complexity.

---

# 16. Interview Questions

## Conceptual Questions

**Q: What is the difference between `signal.set()` and `signal.update()`?**

A: `.set(v)` unconditionally sets the value to `v`. `.update(fn)` reads the current value, passes it to `fn`, and sets the result. `.update` is atomic — it guarantees that between reading and writing, no other reactive operations interleave. For example:

```typescript
// Counter with set:
counter.set(counter() + 1);  // Non-atomic: read, increment, write

// Counter with update:
counter.update(v => v + 1);  // Atomic: read-modify-write guaranteed
```

**Q: Why does the `authGuard` check both the signal AND localStorage?**

A: The signal is populated when `AuthService` constructor runs, which happens lazily on first injection. If a page refresh triggers the guard before `AuthService` is injected, the signal reads `false` even with a valid token. The `localStorage` fallback catches this window. Without it, every page refresh would briefly redirect to login.

**Q: What would happen if `login()` received a response without a token?**

A: `getResponseToken` would return `null`, the `if (token)` block would be skipped, `saveToken`/`setAuthenticated`/`setCurrentUser` would NOT be called. The Observable would still emit the response, but the caller's `subscribe.next` would navigate to dashboard even though the user is not authenticated. This is a potential bug — the caller should check for actual authentication before navigating.

**Q: How would you add token refresh to this architecture?**

A: I'd modify `refreshTokenInterceptor` to:
1. On 401, check if a refresh token exists in `TokenStoreService`
2. If yes, call `/api/auth/refresh` with the refresh token
3. Save the new access token
4. Retry the original request with the new token
5. Queue any concurrent requests that also got 401 (to avoid multiple refresh calls)
6. Only if refresh fails, clear all tokens and redirect

## Code Analysis Questions

**Q: What's the bug in `setCurrentUser(null)` preserving `isAuthenticated`?**

A: `setCurrentUser(null)` sets `isAuthenticated` to `!!null || this.isAuthenticatedSignal()` = `false || currentValue`. If currentValue is `true`, `isAuthenticated` remains `true`. This means calling `setCurrentUser(null)` alone does NOT log out the user — they're still considered authenticated even without a user object. Only `clear()` fully resets both.

**Q: Analyze the performance of `decodeJwtPayload`.**

A: O(n) in payload size. Each character is converted: `charCodeAt` → `toString(16)` → pad → prepend `%`. For a typical JWT payload (~200-500 bytes), this completes in microseconds. The main cost is `JSON.parse` which is O(n) anyway. Not a bottleneck.

**Q: What's the memory implication of `toObservable`?**

A: Each `toObservable` call creates an `effect` + `ReplaySubject(1)` + closure. The effect lives until the injector is destroyed (root level = app lifetime). Memory is negligible for 1-2 observables, but creating hundreds would be wasteful.

## Design Questions

**Q: Why `FormBuilder.nonNullable` instead of just using `null`?**

A: `nonNullable` changes the TypeScript type from `string | null` to `string`. This eliminates null checks throughout the component. For auth forms where every field is required, `null` has no semantic meaning — either the value is a valid string or the form is invalid. `nonNullable` communicates this intent.

**Q: What would you change if the backend used a different auth protocol (e.g., OAuth2)?**

A. I'd create an `InjectionToken<AuthProvider>` interface:
```typescript
interface AuthProvider {
  login(request: LoginRequest): Observable<AuthResponse>;
  refresh(token: string): Observable<AuthResponse>;
  logout(): void;
}
```
Then provide the correct implementation:
```typescript
providers: [
  { provide: AUTH_PROVIDER, useClass: OAuth2Provider }
]
```
`AuthService` would inject `AUTH_PROVIDER` instead of calling `http.post` directly.

---

# 17. File-by-File Reference

## `services/token.service.ts`
- **Purpose**: `localStorage` persistence for the primary access token
- **Key**: `cinemaverse_token`
- **Legacy migration**: Falls back to `cv_access_token` → `access_token`
- **Key method**: `getToken()` — the single source of token retrieval for the entire app
- **Cleanup**: `removeToken()` clears all possible keys

## `services/auth-state.service.ts`
- **Purpose**: Reactive state container for auth status and current user
- **Reactivity**: Two signals (`isAuthenticated`, `currentUser`) exposed as readonly
- **Key design**: Separate signals for independent reactivity; cross-sync in `setCurrentUser`

## `services/auth.service.ts`
- **Purpose**: Orchestration layer — HTTP calls, token management, state updates
- **Construction**: Rehydrates state from localStorage token
- **Key methods**: `login()` (stateful), `register()` (stateless), `logout()` (destructive)
- **JWT handling**: Client-side decode without signature verification (correct — verification is server's job)

## `token-store.service.ts`
- **Purpose**: Higher-level facade over token + refresh token + role storage
- **Why it exists**: Single place to change storage strategy for multiple auth-related values

## `models/login-request.ts`
- **Fields**: `email: string`, `password: string`
- **Design**: Minimal DTO — only contains what the backend needs

## `models/register-request.ts`
- **Fields**: 9 fields matching registration form
- **Design**: Complete user profile DTO

## `models/auth-response.ts`
- **Fields**: All possible response shapes — token, user, userId, email, role, message
- **Design**: Union of all possible backend response formats (success + error shapes)

## `guards/auth.guard.ts`
- **Type**: `CanActivateFn` (functional guard, Angular 15+)
- **Strategy**: Signal-first, localStorage fallback
- **Return**: `true` or `UrlTree('/login')`

## `interceptors/auth.interceptor.ts`
- **Type**: `HttpInterceptorFn` (functional interceptor, Angular 15+)
- **Purpose**: Inject `Authorization: Bearer <token>` header
- **Design**: Skips if no token exists (login/register requests)

## Service class: `auth-state.service.ts`
- **dependencies**: `TokenService`, `AuthStateService`, `HttpClient`
- **exposed observables**: `currentUser$`, `isAuthenticated$()`
- **internal signals**: accessed via `authState` property
- **Token hydration**: on construction from localStorage
- **Error handling**: delegated to UI components via `getErrorMessage`
