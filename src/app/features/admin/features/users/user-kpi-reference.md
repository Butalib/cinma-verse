# Component: UserKpi

## 1. Main Operation (العملية الرئيسية)

The UserKpiComponent displays key performance indicators (KPIs) for user management analytics in the admin dashboard. It renders a responsive grid of metric cards showing static metrics including total users, active users, new users this month, and average spend. Each card displays an icon, metric value, and title in a visually distinct card layout.

## 2. Sub-Operations & Technical Implementation (العمليات الفرعية والتقنيات)

### Sub-Operation 1: KPI Data Retrieval from Service

- **The Logic**: Fetches KPI metric data during component initialization from the UserKpiService.
- **State Management & Data Flow**: Injects `UserKpiService` via `inject()`. Calls `getUserKpis()` method which returns an array of `UserKpiItem` objects. Each item contains title, value, and Material icon name. Data is stored as a class property `kpiItems` and accessed directly in template.
- **Core Code Snippet**:

```typescript
private readonly userKpiService = inject(UserKpiService);
readonly kpiItems: UserKpiItem[] = this.userKpiService.getUserKpis();
```

### Sub-Operation 2: KPI Card Rendering with Loop & Tracking

- **The Logic**: Renders a grid of KPI cards, one for each metric. Uses Angular's `@for` loop with trackBy optimization to prevent unnecessary DOM updates.
- **State Management & Data Flow**: Template uses `@for (item of kpiItems; track item.title)` to iterate over the static KPI array. The `track` expression optimizes re-rendering by identifying each card by its title. No input bindings or event handlers; purely display-based.
- **Core Code Snippet**:

```html
@for (item of kpiItems; track item.title) {
<article class="user-kpi-card">
  <div class="user-kpi-card__icon-box" aria-hidden="true">
    <span class="material-symbols-outlined user-kpi-card__icon">{{ item.icon }}</span>
  </div>
  <p class="user-kpi-card__value">{{ item.value }}</p>
  <p class="user-kpi-card__title">{{ item.title }}</p>
</article>
}
```

### Sub-Operation 3: Icon & Value Interpolation

- **The Logic**: Dynamically displays Material Design icon names and metric values from KPI items.
- **State Management & Data Flow**: Uses string interpolation in template: `{{ item.icon }}` for icon name and `{{ item.value }}` for numeric/currency values. Icon names are rendered as Material Icons via `material-symbols-outlined` class. No computation or transformation; direct display of service data.
- **Core Code Snippet**:

```html
<span class="material-symbols-outlined user-kpi-card__icon">{{ item.icon }}</span>
<p class="user-kpi-card__value">{{ item.value }}</p>
```

## 3. Lifecycle & Angular Features (دورة الحياة وأدوات إط架العمل)

- **Standalone Component**: Uses `standalone: true` with minimal imports (only CommonModule).
- **Change Detection Strategy**: Implements `ChangeDetectionStrategy.OnPush` for optimized performance.
- **Loop Control Flow**: Uses new `@for` control flow syntax instead of `*ngFor` for iteration.
- **Material Icons**: Renders Material Design icon symbols via `material-symbols-outlined` CSS class.
- **Accessibility**: Uses `aria-label` on section for semantic labeling and `aria-hidden="true"` on icons (decoration-only).
- **No Lifecycle Hooks**: No implementation of OnInit, OnDestroy; initialization via service call in class field.
- **No Input/Output**: Component is standalone with no @Input or @Output bindings; data comes from injected service.
- **Static Data**: All KPI data is static; component does not respond to parent changes or manage internal state.

## 4. Dependencies (الاعتماديات)

### Injected Services

- `UserKpiService`: Provides KPI metric data; injectable via `inject()`

### Angular Modules/APIs

- `CommonModule`: For common Angular directives
- `ChangeDetectionStrategy.OnPush`: Performance optimization strategy
- `@for`: New control flow syntax for loops

### Exported/Imported Types

- `UserKpiItem`: Interface from UserKpiService with properties: title (string), value (string), icon (string)

### External Dependencies

- Material Design Icons: `material-symbols-outlined` CSS class for icon rendering
- No other direct external dependencies
