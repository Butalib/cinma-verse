# شرح نظام الـ Auth والتوكن بالتفصيل (CinemaVerse Web)

الملف ده يشرح **الرحلة الكاملة** للمصادقة في المشروع الحالي:  
من إدخال البيانات في صفحات Login/Register، لحد إرسال الـ API، وتخزين التوكن، وإضافته تلقائيًا لكل Request، والتحقق من الدخول داخل الـ Guards.

---

## 1) المكونات الأساسية (مين مسؤول عن إيه؟)

| الجزء | الملف | المسؤولية |
|---|---|---|
| صفحة تسجيل الدخول | `src/app/features/auth/pages/login/login.page.ts` | جمع بيانات المستخدم + validation + استدعاء `authService.login` |
| صفحة إنشاء حساب | `src/app/features/auth/pages/register/register.page.ts` | جمع بيانات التسجيل + تحويل `dateOfBirth` + استدعاء `authService.register` |
| خدمة الـ Auth الرئيسية | `src/app/core/auth/services/auth.service.ts` | تنفيذ `login/register/logout` + تحديث حالة المستخدم + قراءة بيانات المستخدم من JWT |
| تخزين التوكن | `src/app/core/auth/services/token.service.ts` | حفظ/قراءة/حذف access token من `localStorage` |
| حالة المصادقة في الذاكرة | `src/app/core/auth/services/auth-state.service.ts` | Signals (`isAuthenticated`, `currentUser`) لحالة الدخول داخل runtime |
| Interceptor إضافة التوكن | `src/app/core/auth/interceptors/auth.interceptor.ts` | إضافة `Authorization: Bearer <token>` تلقائيًا |
| Route Guard | `src/app/core/auth/guards/auth.guard.ts` | منع دخول صفحات محمية بدون تسجيل دخول |
| API Base URL | `src/app/core/config/api.config.ts` | عنوان الـ backend الأساسي |
| تسجيل الـ Interceptor | `src/app/app.config.ts` | تفعيل `authInterceptor` لكل طلبات HTTP |

---

## 2) فين الداتا بتتخزن؟ (Memory vs Storage)

## A) تخزين دائم (Persistent) في المتصفح
- المفتاح الأساسي للتوكن:
  - `cinemaverse_token`
- مفاتيح قديمة للـ fallback (قراءة فقط):
  - `cv_access_token`
  - `access_token`

الكود المسؤول:

```ts
// src/app/core/auth/services/token.service.ts
const TOKEN_KEY = 'cinemaverse_token';
const LEGACY_TOKEN_KEYS = ['cv_access_token', 'access_token'];

saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? this.getLegacyToken();
}
```

## B) تخزين مؤقت في الذاكرة (Runtime)
- `AuthStateService` يحتفظ بـ:
  - `isAuthenticated` (Signal boolean)
  - `currentUser` (Signal of `AuthUser | null`)

```ts
// src/app/core/auth/services/auth-state.service.ts
private readonly isAuthenticatedSignal = signal(false);
private readonly currentUserSignal = signal<AuthUser | null>(null);
```

يعني:
- لو عملت Refresh للصفحة: الـ signals بتتصفر.
- لكن `AuthService` constructor بيرجع يبني الحالة من التوكن الموجود في `localStorage`.

---

## 3) خوارزمية تسجيل الدخول Login (خطوة بخطوة)

## المرحلة 1: Validation في الـ UI
في `login.page.ts`:
- الفورم لازم يكون valid (`email`, `password`).
- لو invalid → لا يتم إرسال request.

```ts
if (this.form.invalid || this.isLoading()) {
  return;
}
```

## المرحلة 2: إرسال الطلب

```ts
this.authService.login(this.form.getRawValue())
```

وفي `AuthService`:

```ts
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
```

## المرحلة 3: استخراج التوكن
الدالة:

```ts
private getResponseToken(response: AuthResponse): string | null {
  return response.token ?? response.accessToken ?? null;
}
```

يعني الـ backend لو رجّع `token` أو `accessToken` الاتنين مدعومين.

## المرحلة 4: بناء بيانات المستخدم
أولوية استخراج المستخدم:
1. `response.user` إن وجد
2. من JWT payload (`userFromToken`)
3. من الحقول المفككة في response (`userId/email/role`)

---

## 4) خوارزمية إنشاء الحساب Register

## المرحلة 1: Validation محلي
في `register.page.ts`:
- التحقق من required fields + min/max constraints.

## المرحلة 2: تجهيز payload قبل الإرسال
تم إضافة تحويل `dateOfBirth` إلى ISO:

```ts
private toRegisterRequest(): RegisterRequest {
  const rawValue = this.form.getRawValue();
  return {
    ...rawValue,
    dateOfBirth: this.toIsoDate(rawValue.dateOfBirth),
  };
}

private toIsoDate(value: string): string {
  if (!value) return value;
  const normalized = value.includes('T') ? value : `${value}T00:00:00.000Z`;
  const parsedDate = new Date(normalized);
  return Number.isNaN(parsedDate.getTime()) ? value : parsedDate.toISOString();
}
```

ده كان مهم لأن input نوعه `date` بيرجع `YYYY-MM-DD`، والـ API غالبًا متوقع `DateTime`.

## المرحلة 3: إرسال الطلب

```ts
this.authService.register(request)
```

وفي `AuthService`:

```ts
register(request: RegisterRequest): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(`${API_BASE_URL}/api/auth/register`, request);
}
```

> ملاحظة: بعد التسجيل الناجح، الصفحة الحالية تعمل Redirect لـ `/login`، وليس Login تلقائي.

---

## 5) خوارزمية فك JWT واستخراج claims

داخل `AuthService`:

```ts
private userFromToken(token: string): AuthUser | null {
  const payload = this.decodeJwtPayload(token);
  if (!payload) return null;

  return {
    id: this.readClaim(payload, 'sub') ?? this.readClaim(payload, 'nameid'),
    email: this.readClaim(payload, 'email'),
    firstName: this.readClaim(payload, 'firstName') ?? this.readClaim(payload, 'given_name'),
    lastName: this.readClaim(payload, 'lastName') ?? this.readClaim(payload, 'family_name'),
    role: this.readClaim(payload, 'role'),
  };
}
```

## Algorithm:
1. تقسيم JWT على `.`
2. أخذ الجزء الثاني (payload)
3. Base64Url normalize (`-`→`+`, `_`→`/`)
4. `atob` ثم decode UTF-8
5. `JSON.parse`
6. قراءة claims المطلوبة فقط لو string

---

## 6) خوارزمية إضافة التوكن تلقائيًا لكل API Requests

`authInterceptor`:

```ts
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(TokenService).getToken();
  if (!token) return next(request);

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
```

ومسجل في `app.config.ts`:

```ts
provideHttpClient(withInterceptors([authInterceptor]))
```

يعني أي `HttpClient` call في التطبيق هيتحقن فيه التوكن تلقائيًا (لو موجود).

---

## 7) خوارزمية حماية الصفحات (Auth Guard)

`auth.guard.ts`:

```ts
return authState.isAuthenticated() || tokenService.isLoggedIn()
  ? true
  : router.createUrlTree(['/login']);
```

المنطق:
1. لو الحالة في الذاكرة authenticated → اسمح.
2. لو الذاكرة فاضية لكن لسه فيه token في localStorage → اسمح.
3. غير كده → Redirect لـ `/login`.

والـ admin routes محمية فعليًا:

```ts
canActivate: [authGuard]
```

---

## 8) معالجة الأخطاء والـ Validation Messages

### Login
يعرض message من:
- `error.error` لو string
- أو `message/error/title`
- أو أول عنصر داخل `errors`
- fallback: `Invalid email or password`

### Register
تم تحسينه ليعرض errors التفصيلية أولًا:

```ts
const errors = apiError['errors'] ?? apiError['Errors'];
// ...
return validationErrors.join(' ');
```

ثم fallback إلى:
- `message/error/detail/title`

ده يمنع ظهور رسالة عامة فقط زي:
`One or more validation errors occurred.`
ويظهر السبب الحقيقي (مثال: `Password must contain ...` أو `DateOfBirth is invalid`).

---

## 9) startup / bootstrap flow بعد Refresh

عند إنشاء `AuthService`:

```ts
const token = this.tokenService.getToken();
if (token) {
  this.authState.setAuthenticated(true);
  this.authState.setCurrentUser(this.userFromToken(token));
}
```

يعني بمجرد تحميل التطبيق:
1. يقرأ token من localStorage
2. يفعّل حالة logged in في memory
3. يحاول استخراج user من JWT

---

## 10) ملاحظات معمارية مهمة

1. `refresh-token.interceptor.ts` موجود لكن **غير مسجل** في `app.config.ts`، لذلك حاليًا لا يوجد refresh flow تلقائي مفعل.
2. يوجد `TokenStoreService` (لـ access/refresh/role)، لكنه ليس المسار الأساسي للـ login الحالي (المسار الأساسي يستخدم `TokenService` + `AuthStateService`).
3. الـ API Base URL ثابت حاليًا:
   - `https://cinemaverse-api.tryasp.net`

---

## 11) Sequence مختصر (من أول Login لحد أول API بعده)

1. المستخدم يملأ login form.
2. `LoginPage.submit` يتحقق من validity.
3. `AuthService.login` يرسل POST `/api/auth/login`.
4. عند النجاح: يحفظ token في `localStorage`.
5. يحدّث `AuthStateService` في الذاكرة.
6. ينتقل المستخدم لـ `/admin/dashboard`.
7. أي request بعد كده:
   - `authInterceptor` يضيف `Authorization: Bearer <token>`.
8. لو المستخدم فتح الصفحة مباشرة بعد refresh:
   - `AuthService` constructor يعيد بناء الحالة من token المخزّن.

---

## 12) الخلاصة العملية

- **التوكن بيتخزن في:** `localStorage` تحت `cinemaverse_token`.
- **حالة الدخول اللحظية بتتخزن في:** Signals داخل `AuthStateService`.
- **التوكن بيتبعت فين؟** في Header `Authorization` عبر `authInterceptor`.
- **التحقق من صلاحية الدخول للصفحات المحمية:** عبر `authGuard`.
- **رسائل فشل التسجيل:** الآن بتطلع بالتفاصيل الفعلية من `errors` بدل الرسالة العامة فقط.

