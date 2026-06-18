# Interceptors Module — Progressive Reverse Engineering Guide

---

# Part 1: Let's Start With Intuition

Before any code, before any Angular internals — let me ask you a question.

Imagine you're building an app where every HTTP request to your API needs to carry an Authorization header. You have 50 API calls across your app. What do you do?

**Option A**: Add the header manually in every single service call.
**Option B**: Write one piece of code that intercepts EVERY request and adds the header automatically.

If you chose B, congratulations — you've just intuited why interceptors exist.

An **interceptor** is a function that sits in the middle of every HTTP request your app makes. Think of it like a security checkpoint at an airport:

```
Your App (HttpClient) ──→ [INTERCEPTOR] ──→ Internet (Backend API)
```

Every request passes through the interceptor. The interceptor can:
- **Look at** the request (read headers, URL, body)
- **Modify** the request (add auth token, change headers)
- **Pass it through** unchanged
- **Block it** entirely (redirect, show error)
- **Handle the response** (catch errors, transform data)

That's the high-level intuition. Now let's build up from there.

---

# Part 2: The Two Interceptors — What They Do

This module has two interceptors. Each handles ONE specific concern:

## authInterceptor — The Token Injector

```typescript
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(TokenService).getToken();

  if (!token) {
    return next(request);            // No token? Just pass through.
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,  // Add the header
      },
    }),
  );
};
```

**What it does**: Every outgoing HTTP request gets an `Authorization: Bearer <token>` header automatically.

## refreshTokenInterceptor — The 401 Handler

```typescript
export const refreshTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStore = inject(TokenStoreService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        tokenStore.clear();                          // Wipe all tokens
        void router.navigate(['/auth/login']);       // Redirect to login
      }
      return throwError(() => error);                // Re-throw the error
    })
  );
};
```

**What it does**: When any API returns 401 (Unauthorized), it clears all stored tokens and redirects the user to the login page.

## The Division of Labor

```
Request going OUT:   authInterceptor adds Bearer token
Response coming IN:  refreshTokenInterceptor watches for 401
```

Two interceptors, two responsibilities. One adds auth, the other handles auth failure. Clean separation.

---

# Part 3: Understanding HttpInterceptorFn

## Layer 1 — Simple Mental Model

`HttpInterceptorFn` is a function that:
1. Receives every HTTP request your app makes
2. Can modify it before it's sent
3. Must return the request (modified or original) to the next handler
4. Can also modify the response (or handle errors)

Think of it as middleware in Express.js or a decorator pattern — you wrap the original request with additional behavior.

## Layer 2 — Basic Syntax

```typescript
type HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => Observable<HttpEvent<unknown>>;
```

**Parameters**:
- `req` — The outgoing HTTP request (immutable — you cannot change it directly)
- `next` — The next function in the chain (either another interceptor or the actual HTTP backend)

**Return**:
- An `Observable<HttpEvent<unknown>>` — this is the response stream

**Minimal interceptor** (does nothing, passes through):
```typescript
export const noopInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};
```

**Interceptors always return `next(...)`**. If you don't call `next`, the request never gets sent. The app hangs forever.

## Layer 3 — Runtime Flow

When you call `this.http.get('/api/users')`, here's what happens:

```
1. HttpClient.get('/api/users') called
   ↓
2. HttpClient creates HttpRequest object
   ↓
3. Interceptor chain starts:
   ↓
   authInterceptor runs:
     ├─ inject(TokenService).getToken() → reads localStorage
     ├─ found token: "eyJ..."
     ├─ request.clone({ setHeaders: { Authorization: `Bearer eyJ...` } })
     └─ next(clonedRequest)
        ↓
   refreshTokenInterceptor runs:
     ├─ next(req)  (passes through immediately)
     ↓
   HttpBackend (actual HTTP sender):
     ├─ fetch('https://api.example.com/users', {
     │     headers: { Authorization: 'Bearer eyJ...' }
     │   })
     └─ returns Observable<HttpEvent>
        ↓
   Response flows BACK through interceptors
        ↓
   refreshTokenInterceptor catches response:
     ├─ ✅ 200 OK → pass through
     └─ ❌ 401 → clear tokens, redirect
        ↓
   Your component receives response
```

**Key insight**: The interceptor chain is a NESTED function call, not a sequential pipeline. Each interceptor wraps the next one:

```
authInterceptor(
  refreshTokenInterceptor(
    HttpBackend(request)
  )
)
```

Execution goes:
- `authInterceptor` runs (adds Bearer header)
- calls `refreshTokenInterceptor`
- which calls `HttpBackend`
- response comes back
- `refreshTokenInterceptor` sees it (catches errors)
- completes
- `authInterceptor` sees the response (but does nothing with it)

The request goes DOWN the chain (one direction), the response comes UP the chain (opposite direction).

## Layer 4 — Architecture Reasoning

**Why interceptors instead of a wrapper service?**

Before interceptors existed, developers would create a wrapper:
```typescript
class ApiService {
  get<T>(url: string): Observable<T> {
    return this.http.get<T>(url, {
      headers: { Authorization: `Bearer ${this.auth.getToken()}` }
    });
  }
}
```

Problems with this approach:
- **Every team member must remember** to use `ApiService` instead of `HttpClient`
- **Third-party libraries** that use `HttpClient` directly bypass the wrapper
- **No interception of responses** (can't globally handle 401)

Interceptors solve ALL of these:
- **Automatic**: Every request goes through the interceptor, regardless of who made it
- **Centralized**: One place to add auth, one place to handle auth errors
- **Non-invasive**: No changes needed to existing services

**Why functional interceptors instead of class-based?**

```typescript
// Old way (Angular <15)
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // ...
  }
}

// New way (Angular 15+)
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // ...
};
```

Angular moved from classes to functions because:
1. **Less boilerplate** — no `@Injectable()`, no `implements`, no class
2. **Tree-shakable** — if an interceptor is unused, the bundler can eliminate it
3. **Simpler mental model** — a function is easier to reason about than a class

## Layer 5 — Internal Mechanics

### How Angular Runs Interceptors

When `provideHttpClient(withInterceptors([...]))` is called:

```
provideHttpClient(withInterceptors([authInterceptor, refreshTokenInterceptor]))
   ↓
Angular creates an HttpInterceptorHandler chain:
   ↓
For each interceptor in the array:
  Creates a wrapper function:
    (req, next) => interceptor(req, wrappedNext)
  Where wrappedNext calls the next interceptor in the chain
   ↓
The final "next" in the chain is HttpBackend
   ↓
HttpBackend is the actual HTTP implementation (fetch or XHR)
```

At runtime, the chain is a linked list of functions. Each interceptor receives the request and calls `next()` to pass it down.

### The `inject()` Inside Interceptors

```typescript
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(TokenService).getToken();
  //         ^
  //         How does inject() work here?
  //         It's not a constructor, not a factory...
};
```

Angular sets up an injection context before calling each interceptor. This is the same mechanism that makes `inject()` work in guards, resolvers, and pipes.

**Internally**:
```typescript
// Conceptual — Angular's interceptor runner:
function runInterceptorChain(interceptors, req) {
  // Set injection context
  const previousInjector = setCurrentInjector(rootInjector);
  try {
    return interceptors[0](req, (nextReq) => {
      // call next interceptor...
    });
  } finally {
    // Restore previous context
    setCurrentInjector(previousInjector);
  }
}
```

The `try/finally` is critical. If an interceptor throws, the injector context is always restored, preventing "injector leakage" into other code.

### The Immutable HttpRequest

```typescript
request.clone({
  setHeaders: {
    Authorization: `Bearer ${token}`,
  },
})
```

`HttpRequest` is **immutable**. You cannot do:
```typescript
request.headers.set('Authorization', `Bearer ${token}`); // ERROR!
request.headers = newHeaders; // ERROR! (readonly)
```

`clone()` creates a NEW `HttpRequest` with the specified changes merged:
- Original headers preserved
- `setHeaders` adds/replaces specific headers
- Returns a new object — original is unchanged

**Why immutability?** Multiple interceptors might modify the request. If one interceptor mutated the original, another interceptor upstream (that already ran) would see the changes retroactively. Immutability prevents this — each interceptor gets a consistent snapshot of the request.

## Layer 6 — Interview Questions

**Q: What happens if you don't call `next()` in an interceptor?**

A: The request is never sent. The observable returned by `HttpClient` never emits. Any subscriber hangs indefinitely. This is almost always a bug — every interceptor must call `next()`.

**Q: In what order do interceptors run?**

A: In the order they're registered in `withInterceptors([...])`. The first interceptor in the array runs first for OUTGOING requests (wraps the next one). For INCOMING responses, the order is reversed — the last interceptor sees the response first.

**Q: Can an interceptor be async?**

A: Sort of. Interceptors return `Observable`, so they can be async internally. But you cannot `await` inside a synchronous function. You'd use RxJS operators:
```typescript
return next(req).pipe(
  delay(1000), // Wait 1 second before proceeding
  tap(response => console.log('Got response', response))
);
```

---

# Part 4: Understanding `inject()` in Interceptors

## Layer 1 — Simple Mental Model

`inject()` is like asking Angular: "Give me the instance of this service."

Normally you'd write:
```typescript
class MyComponent {
  constructor(private auth: AuthService) {}
}
```

But interceptors are functions, not classes. They don't have constructors. `inject()` is how functions get dependencies in Angular.

## Layer 2 — Basic Syntax

```typescript
const token = inject(TokenService).getToken();
```

- **Parameter**: A class or `InjectionToken`
- **Returns**: The singleton instance (for `providedIn: 'root'` services)
- **Constraint**: Must be called in an "injection context" (constructor, factory, guard, interceptor)

## Layer 3 — Where inject() Works

| Context | Works? |
|---------|--------|
| Component constructor | ✅ |
| Guard function | ✅ |
| Interceptor function | ✅ |
| Factory function | ✅ |
| setTimeout callback | ❌ |
| Promise.then callback | ❌ |
| Event listener callback | ❌ |
| Plain function called by you | ❌ |

If you call `inject()` outside an injection context, Angular throws:
```
NG0203: inject() must be called from an injection context
```

## Layer 4 — Why inject() in Interceptors

In the old class-based interceptors, dependencies came via constructor injection:
```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private tokenService: TokenService) {} // DI in constructor
  intercept(req, next) { ... }
}
```

But this requires:
1. An `@Injectable()` decorator
2. A class
3. Registration in providers

Functional interceptors with `inject()` eliminate all three. The interceptor is JUST a function, and it gets its dependencies at runtime when Angular calls it.

This is a key part of Angular's evolution: **from decorator-and-class-heavy to function-and-inject**.

---

# Part 5: Understanding `catchError` and `throwError`

## refreshTokenInterceptor — Deep Dive

This interceptor demonstrates an important RxJS pattern: **error interception**.

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

## Layer 1 — Mental Model for catchError

`catchError` is a safety net. It catches errors that happen in the observable pipeline and lets you decide what to do:

**Normal flow**: `next(req)` → HTTP request → response → your code
**Error flow**: `next(req)` → HTTP request → ERROR → `catchError` catches it → you handle it

Three things can happen in `catchError`:
1. **Recover**: Return a fallback value — the error is handled, stream continues
2. **Re-throw**: Return `throwError(() => error)` — the error continues to the subscriber
3. **Side effect + re-throw**: Clear tokens + re-throw (what this code does)

## Layer 2 — Why `catchError` and Not `subscribe.error`

You might think: "Why not handle 401 in the component's `.subscribe({ error: ... })`?"

```typescript
// In a component:
this.http.get('/api/data').subscribe({
  error: (err) => {
    if (err.status === 401) {
      // Handle 401 here
    }
  }
});
```

Problems:
- **Duplication**: Every single HTTP call needs the same 401 handling
- **Inconsistency**: Someone forgets to add it → user sees raw error
- **Maintenance nightmare**: Change the 401 handling → change every file

`catchError` in an interceptor handles it ONCE for ALL requests. This is the **Don't Repeat Yourself** principle in action.

## Layer 3 — The Flow

```
Request to /api/sensitive-data
  ↓
authInterceptor adds Bearer token
  ↓
refreshTokenInterceptor passes through (no error yet)
  ↓
Server responds: 401 Unauthorized
  ↓
HttpClient creates HttpErrorResponse
  ↓
Observable errors
  ↓
refreshTokenInterceptor.catchError fires:
  ├─ Check: error instanceof HttpErrorResponse? ✅
  ├─ Check: status === 401? ✅
  ├─ tokenStore.clear()
  │     ├─ removeToken() → localStorage.removeItem('cinemaverse_token')
  │     ├─ removeItem('cv_refresh_token')
  │     ├─ removeItem('refresh_token')
  │     ├─ removeItem('cv_role')
  │     └─ removeItem('role')
  ├─ router.navigate(['/auth/login']) → async navigation
  └─ throwError(() => error) → re-throw
    ↓
Original subscriber still receives the error (can handle it too)
```

Two things happen:
1. **User is logged out**: All tokens cleared, redirected to login
2. **Error still propagates**: The calling component's `.subscribe({ error })` still runs

This is intentional. The component might want to show a message ("Your session expired") even though the interceptor already handled the redirect.

## Layer 4 — catchError vs catch (Promise)

If you're coming from Promises:

```javascript
// Promise style:
fetch('/api/data')
  .catch(error => {
    if (error.status === 401) {
      // Handle 401
    }
    throw error; // Re-throw
  });

// RxJS style (same pattern!):
http.get('/api/data').pipe(
  catchError(error => {
    if (error.status === 401) {
      // Handle 401
    }
    return throwError(() => error); // Re-throw
  })
);
```

The pattern is identical conceptually. `catchError` catches, you handle, then re-throw if needed.

## Layer 5 — Why `throwError(() => error)` and Not `throwError(error)`

Both do the same thing at runtime, but:

```typescript
// Modern (Angular 15+, RxJS 7+):
return throwError(() => error);

// Legacy (deprecated):
return throwError(error);
```

The factory function `() => error` defers error creation. In this case, it doesn't matter because `error` is already created (`HttpErrorResponse` is already instantiated). But the factory form is the new standard — it's more tree-shakeable and doesn't eagerly create error objects.

## Layer 6 — The `unknown` Type

```typescript
catchError((error: unknown) => {
```

**Why `unknown` and not `any` or `HttpErrorResponse`?**

- `any`: Disables all type checking. You can access `error.status` without TypeScript complaining, even if `error` might not have a `.status` property.
- `HttpErrorResponse`: Over-promises. Not every error is an `HttpErrorResponse` — network failures, JSON parse errors, or manually thrown errors could be anything.
- `unknown`: Forces a type check. You MUST verify the type before using it.

The `instanceof HttpErrorResponse` check narrows `unknown` to `HttpErrorResponse`:
```typescript
if (error instanceof HttpErrorResponse && error.status === 401) {
  // Inside this block: error is narrowed to HttpErrorResponse
  // TypeScript knows error.status, error.error, error.message exist
}
```

If you forget the `instanceof` check and try to access `error.status`, TypeScript won't let you:
```typescript
// TypeScript error: Object is of type 'unknown'
error.status;
```

**This is a deliberate Angular pattern** — the framework forces you to be type-safe about errors.

## Layer 7 — HttpErrorResponse

```typescript
if (error instanceof HttpErrorResponse && error.status === 401)
```

`HttpErrorResponse` is the class Angular creates for HTTP errors. It looks like:

```typescript
class HttpErrorResponse {
  status: number;         // 401, 404, 500, etc.
  statusText: string;     // "Unauthorized", "Not Found", etc.
  url: string | null;     // The request URL
  error: any;             // The response body (could be parsed JSON, string, etc.)
  message: string;        // Angular-generated error message
}
```

The `instanceof` check verifies this is truly an HTTP error (not a JavaScript error, not a network timeout, not a custom error). Only if it's `HttpErrorResponse` AND status is 401 do we clear tokens.

## Layer 8 — Common Mistakes

**1. Catching but not re-throwing**
```typescript
catchError((error) => {
  if (error.status === 401) {
    tokenStore.clear();
    router.navigate(['/login']);
    // BUG: forgot to re-throw!
    // The component receives success, not error
  }
  return throwError(() => error);
})
```

If you don't re-throw, the component doesn't know an error occurred. It might try to render data that doesn't exist.

**2. Rethrowing but forgetting to return**
```typescript
catchError((error) => {
  throwError(() => error); // BUG: missing 'return'
  // The catchError callback returns undefined
  // RxJS treats undefined as a valid emission!
})
```

Every path in `catchError` must return an `ObservableInput`. Missing `return` means the callback returns `undefined`, which RxJS interprets as a value emission (not an error).

**3. Navigating without `void`**
```typescript
router.navigate(['/auth/login']); // Returns Promise<boolean>
```

The `void` keyword is a TypeScript convention that says "I'm intentionally discarding this promise." Without it, linters might warn about unhandled promise rejections.

## Layer 9 — Interview Questions

**Q: What happens if a request fails with status 500? Does the refreshTokenInterceptor handle it?**

A: No. The interceptor only handles status 401. A 500 error passes the `status === 401` check and falls through to `throwError(() => error)`, which re-throws the error to the calling code. The component must handle it.

**Q: Can you have multiple catchError operators in one pipeline?**

A: Yes. Each `catchError` can handle different error types:
```typescript
return next(req).pipe(
  catchError(err => {
    if (err.status === 401) { /* handle auth */ }
    return throwError(() => err);
  }),
  catchError(err => {
    if (err.status === 500) { /* handle server error */ }
    return throwError(() => err);
  })
);
```

**Q: What's wrong with this interceptor?**

```typescript
export const badInterceptor: HttpInterceptorFn = (req, next) => {
  if (!inject(TokenService).getToken()) {
    inject(Router).navigate(['/login']);
  }
  return next(req);
};
```

A: Three issues:
1. The navigation happens BEFORE the request is sent (might redirect even on legitimate failures)
2. Doesn't cancel the request after navigating (request still goes out)
3. Multiple `inject()` calls when one would suffice

---

# Part 6: Understanding `request.clone()` and Immutability

## Layer 1 — Why Immutable?

The `HttpRequest` object represents a request that will be sent. If you could mutate it directly:

```typescript
request.headers.set('Authorization', 'Bearer abc123');
// What happens to interceptors that already ran?
// They see the modified headers retroactively!
```

Multiple interceptors might inspect or modify the same request. Immutability ensures that each interceptor sees a consistent snapshot.

## Layer 2 — clone() Options

```typescript
request.clone({
  setHeaders: {
    Authorization: `Bearer ${token}`,
  },
});
```

`clone()` accepts a partial `HttpRequest` with these modification options:

| Option | Effect | Example |
|--------|--------|---------|
| `setHeaders` | Add/replace headers | `{ Authorization: 'Bearer x' }` |
| `setParams` | Add/replace URL params | `{ page: '2' }` |
| `url` | Change URL | `'/api/v2/users'` |
| `body` | Change body | `{ query: 'search' }` |
| `withCredentials` | Change CORS | `true` |

**Important**: `setHeaders` ADDS to existing headers. It doesn't replace all headers. There's also `headers` (replace all) if needed.

## Layer 3 — What clone Copies

```
clone(overrides)
  ↓
New HttpRequest:
├─ url:          cloned from original (or overridden)
├─ method:       cloned from original
├─ body:         cloned from original (or overridden)
├─ headers:      ORIGINAL + setHeaders merged
├─ params:       ORIGINAL + setParams merged
├─ responseType: cloned from original
└─ withCredentials: cloned from original
```

The original `HttpRequest` is NEVER modified. You can verify this:
```typescript
const original = new HttpRequest('GET', '/api/data');
const cloned = original.clone({ setHeaders: { Authorization: 'Bearer x' } });

original.headers.has('Authorization'); // false
cloned.headers.has('Authorization');   // true
```

---

# Part 7: How Interceptors Are Registered

## app.config.ts

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
```

**Wait — where's `refreshTokenInterceptor`?**

Looking at the code, only `authInterceptor` is registered in `app.config.ts`. The `refreshTokenInterceptor` exists in the file but is NOT registered.

This is either:
1. A bug — the interceptor exists but isn't activated
2. A work-in-progress — it was written but not yet wired up
3. A design decision — maybe it's registered elsewhere

For a developer reading this code: this is a critical observation. If you expect 401 handling and it's not working, this is why.

## How `withInterceptors` Works

```typescript
provideHttpClient(withInterceptors([authInterceptor]))
```

1. `provideHttpClient()` creates the `HttpClient` provider
2. `withInterceptors([...])` is a feature function that adds interceptor configuration
3. Angular stores the interceptor array in the injector
4. When `HttpClient` creates a request, it builds the interceptor chain from this array
5. Each interceptor is called in order

**Order matters**! The array order is the interceptor chain order:
- Index 0 (`authInterceptor`): Runs first for outgoing requests
- Index N: Runs last for outgoing requests (closest to the wire)

If both interceptors were registered:
```typescript
withInterceptors([authInterceptor, refreshTokenInterceptor])
```

The flow would be:
```
Outgoing:  authInterceptor → refreshTokenInterceptor → wire
Incoming:  authInterceptor ← refreshTokenInterceptor ← wire
```

The `refreshTokenInterceptor` (index 1) sees the response BEFORE `authInterceptor` (index 0). This is correct — error handling should be close to the wire.

---

# Part 8: Architecture Reasoning — Why Two Interceptors?

## Separation of Concerns

| Concern | Interceptor | Why Separate? |
|---------|-------------|---------------|
| Adding auth header | `authInterceptor` | Every request needs a token |
| Handling auth failure | `refreshTokenInterceptor` | Only failed requests need handling |

These are TWO different concerns that happen at different times:
- Token injection: happens ON THE WAY OUT (before request is sent)
- 401 handling: happens ON THE WAY BACK (after response is received)

Combining them into one interceptor would violate the Single Responsibility Principle:
```typescript
// BAD: one interceptor doing two things
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Add auth header
  const token = inject(TokenService).getToken();
  const clonedReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  // Handle 401
  return next(clonedReq).pipe(
    catchError(err => {
      if (err.status === 401) { tokenStore.clear(); router.navigate(['/login']); }
      return throwError(() => err);
    })
  );
};
```

This works but mixes concerns. If you want to disable token injection (for testing) but keep 401 handling, you can't. Separate interceptors give you that flexibility.

## What's Missing: Token Refresh

The current `refreshTokenInterceptor` just clears tokens and redirects. A production-grade interceptor would attempt to REFRESH the token first:

```
1. Request fails with 401
2. Check if refresh token exists
3. If yes: call /api/auth/refresh
   a. Success: save new token, retry original request
   b. Failure: clear all, redirect to login
4. If no refresh token: clear all, redirect to login
```

This is NOT implemented here (the interceptor just clears + redirects). In a real app, users would be logged out every time their access token expires (typically every 15-60 minutes). A token refresh mechanism is essential for a good UX.

---

# Part 9: Production-Grade Concerns

## The Concurrent 401 Problem

Consider this scenario:
```
User opens a page that makes 10 API calls simultaneously.
The access token is expired.
ALL 10 requests return 401 at the same time.
```

With the current code:
```
Request 1: 401 → clear() → navigate() → throwError
Request 2: 401 → clear() → navigate() → throwError
Request 3: 401 → clear() → navigate() → throwError
...
```

10 `clear()` calls (wasteful but safe). 10 `navigate()` calls (Angular handles duplicates, only one redirect happens).

In a token refresh scenario, this would be worse: 10 refresh API calls, 10 new tokens, 10 retries. A proper fix:

```typescript
// Conceptual — concurrent request handling
let isRefreshing = false;
let pendingRequests: ((token: string) => void)[] = [];

catchError(err => {
  if (err.status !== 401) return throwError(() => err);

  if (!isRefreshing) {
    isRefreshing = true;
    return refreshToken().pipe(
      switchMap(newToken => {
        isRefreshing = false;
        // Retry all pending requests
        pendingRequests.forEach(cb => cb(newToken));
        pendingRequests = [];
        // Retry original request
        return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
      })
    );
  } else {
    // Queue this request — refresh is already in progress
    return new Observable(subscriber => {
      pendingRequests.push(newToken => {
        subscriber.next(next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })));
      });
    });
  }
})
```

## The Routing Concern

```typescript
void router.navigate(['/auth/login']);
```

This navigates to `/auth/login`. But what if the user is ALREADY on `/auth/login`? The navigation would be a no-op, but the tokens are still cleared. That's correct behavior — clearing tokens on login page is safe.

A more robust approach would redirect to the current page the user was trying to access, so after login they return there:
```typescript
const returnUrl = router.url;
void router.navigate(['/auth/login'], { queryParams: { returnUrl } });
```

---

# Part 10: Summary — The Interceptor Mental Model

```
┌──────────────────────────────────────────────────────────────┐
│                    Your App (HttpClient)                      │
│  http.get('/api/users').subscribe(...)                       │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
              ┌───────────────────────┐
              │   authInterceptor     │
              │   Adds Bearer token   │
              │   (request going OUT) │
              └──────────┬────────────┘
                         │
                         ▼
              ┌───────────────────────┐
              │ refreshTokenInterceptor│
              │ Catches 401 errors    │
              │ (response coming IN)  │
              └──────────┬────────────┘
                         │
                         ▼
              ┌───────────────────────┐
              │     HttpBackend       │
              │  (fetch / XHR)        │
              │  Sends HTTP request   │
              │  Receives response    │
              └───────────────────────┘
```

**Key takeaways**:

1. **Interceptors are middleware** — they sit between your app and the network
2. **Request goes down, response comes up** — the chain is nested
3. **`next()` must be called** — otherwise the request hangs
4. **`HttpRequest` is immutable** — always use `clone()` to modify
5. **`catchError` catches errors on the way back** — use it for response error handling
6. **Two interceptors, two responsibilities** — keep them separate
7. **Registration in `app.config.ts`** — `withInterceptors([...])`
8. **`inject()` works because Angular sets up injection context** — before calling interceptor functions
9. **`unknown` type forces proper error checking** — always use `instanceof`
10. **What's currently missing: token refresh** — current code just clears + redirects
