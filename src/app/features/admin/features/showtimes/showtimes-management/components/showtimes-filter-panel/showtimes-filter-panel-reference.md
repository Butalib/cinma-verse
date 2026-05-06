# Component: ShowtimesFilterPanel

## 1. Main Operation (العملية الرئيسية)

The ShowtimesFilterPanelComponent is the advanced filtering panel for the showtimes management feature. Its role is to collect filter criteria from an admin user, normalize those values into a compact filter object, and emit that object to the parent showtimes management screen. Architecturally, it is a standalone, form-driven presentation component that stays stateless relative to the data set itself and only owns transient UI state inside a reactive form.

## 2. Sub-Operations & Technical Implementation (العمليات الفرعية والتقنيات)

### Sub-Operation 1: Panel Visibility Gate

- **A. The Logic**: The panel only renders when the parent marks it as open.
- **B. The Algorithm (خوارزمية العمل)**:
  1. The parent passes a boolean into the `isOpen` input.
  2. The template evaluates `@if (isOpen)`.
  3. If `true`, the filter panel DOM subtree is created.
  4. If `false`, the entire form markup is skipped.
- **C. Core Code Snippet**:

```typescript
@Input() isOpen = false;
```

```html
@if (isOpen) {

<section class="filter-panel" aria-label="Showtimes filters"></section>
```

- **D. Mechanics & Integration (طريقة العمل والتأثير التقني)**: `@Input()` is Angular’s parent-to-child binding mechanism. At runtime, Angular writes the parent value into the component instance before change detection evaluates the template. The `@if` block then participates in Angular’s built-in control flow, which creates or destroys the embedded view rather than merely hiding it with CSS. That means the form controls, listeners, and DOM nodes exist only while the panel is open, which reduces live DOM size and slightly lowers memory and change-detection work.
- **E. The Reasoning (السبب التقني)**: This approach keeps the feature simple and explicit. Visibility is controlled by the parent, while the child remains focused on rendering and emitting filter state. Using `@if` avoids keeping a hidden form alive unnecessarily and keeps the component architecture easy to reason about.

### Sub-Operation 2: Reactive Form Construction

- **A. The Logic**: Builds a form model that holds all filter fields with default "no filter" values.
- **B. The Algorithm (خوارزمية العمل)**:
  1. Angular injects `FormBuilder` through the constructor.
  2. The constructor calls `this.fb.group(...)`.
  3. Each filter field is registered as a control with its initial value.
  4. The resulting `FormGroup` is stored in `filterForm` and bound to the template.
- **C. Core Code Snippet**:

```typescript
filterForm: FormGroup;

constructor(private fb: FormBuilder) {
  this.filterForm = this.fb.group({
    status: ['All Status'],
    branchName: [''],
    movieTitle: [''],
    dateFrom: [null],
    dateTo: [null],
    priceMin: [null],
    priceMax: [null]
  });
}
```

- **D. Mechanics & Integration (طريقة العمل والتأثير التقني)**: `FormBuilder.group()` creates a `FormGroup` instance that owns a set of `FormControl` instances. Each control tracks its current value, dirty/touched state, and validation status. Angular’s reactive forms directives then connect the template inputs to those controls via `formGroup` and `formControlName`, so DOM events update the controls and control state updates the DOM. Because the component does not mirror each input into individual class properties, it keeps memory overhead lower and consolidates form state into one managed structure.
- **E. The Reasoning (السبب التقني)**: A reactive form is the right fit because the panel has multiple independent fields, several type conversions, and a need to emit a normalized object. A single `FormGroup` makes that mapping predictable and keeps the parent component free from UI-state bookkeeping.

### Sub-Operation 3: Filter Normalization and Emission

- **A. The Logic**: Converts the raw form values into a `ShowtimesFilter` object that only includes active criteria, then emits that object to the parent.
- **B. The Algorithm (خوارزمية العمل)**:
  1. Read the current form snapshot from `this.filterForm.value`.
  2. Create an empty `filterData` object.
  3. For each field, check whether it still holds its default or empty value.
  4. If a field contains a real filter value, copy it into `filterData`.
  5. Convert date strings into `Date` objects.
  6. Convert numeric inputs into numbers with `Number(...)`.
  7. Emit the final object through `applyFilters`.
- **C. Core Code Snippet**:

```typescript
onApply() {
  const rawValue = this.filterForm.value;
  const filterData: ShowtimesFilter = {};

  if (rawValue.status !== 'All Status') {
    filterData.status = rawValue.status;
  }

  if (rawValue.branchName && rawValue.branchName.trim() !== '') {
    filterData.branchName = rawValue.branchName;
  }

  if (rawValue.movieTitle && rawValue.movieTitle.trim() !== '') {
    filterData.movieTitle = rawValue.movieTitle;
  }

  if (rawValue.dateFrom) {
    filterData.dateFrom = new Date(rawValue.dateFrom);
  }

  if (rawValue.dateTo) {
    filterData.dateTo = new Date(rawValue.dateTo);
  }

  if (rawValue.priceMin !== null && rawValue.priceMin !== '') {
    filterData.priceMin = Number(rawValue.priceMin);
  }

  if (rawValue.priceMax !== null && rawValue.priceMax !== '') {
    filterData.priceMax = Number(rawValue.priceMax);
  }

  this.applyFilters.emit(filterData);
}
```

- **D. Mechanics & Integration (طريقة العمل والتأثير التقني)**: `this.filterForm.value` returns the current aggregate form value as a plain object. Angular keeps that object in sync with the controls through reactive form event propagation. The `EventEmitter` instance behind `applyFilters` is Angular’s output channel; calling `emit()` synchronously notifies listeners registered by the parent template binding. Each emitted payload is compact because empty/default fields are excluded, which reduces downstream branching in the parent and keeps the object easy to serialize or pass into query logic. The explicit `Date` and `Number` conversions also matter: they shift type normalization to the UI boundary, so parent filtering code receives typed values rather than raw browser strings.
- **E. The Reasoning (السبب التقني)**: The component normalizes data before emission so the parent does not need to understand template defaults or HTML input string formats. Emitting only meaningful criteria keeps the contract between child and parent clean and minimizes coupling.

### Sub-Operation 4: Resetting the Filter State

- **A. The Logic**: Restores the filter form to its default state and tells the parent that filters should be cleared.
- **B. The Algorithm (خوارزمية العمل)**:
  1. Call `filterForm.reset(...)` with the same defaults used during initialization.
  2. Clear all user-entered values from the form controls.
  3. Emit a void reset event through `resetFilters`.
  4. Let the parent remove any active filtering constraints.
- **C. Core Code Snippet**:

```typescript
onReset() {
  this.filterForm.reset({
    status: 'All Status',
    branchName: '',
    movieTitle: '',
    dateFrom: null,
    dateTo: null,
    priceMin: null,
    priceMax: null
  });
  this.resetFilters.emit();
}
```

- **D. Mechanics & Integration (طريقة العمل والتأثير التقني)**: `FormGroup.reset()` writes each provided value back into its control and also resets control state such as dirty/touched flags. The output `EventEmitter<void>` then signals a discrete reset action to the parent. Since the payload is void, no extra data is copied across the component boundary, which is efficient and appropriate for a simple command-style event. From a change-detection standpoint, Angular will refresh the form bindings after the control values change, keeping the UI synchronized with the reset form model.
- **E. The Reasoning (السبب التقني)**: Reset is modeled as a separate operation because it is semantically different from applying filters. That separation keeps the API clear and makes the parent’s response to reset unambiguous.

### Sub-Operation 5: Filter Panel Template Structure

- **A. The Logic**: Organizes the UI into logical groups for status/branch, movie/price, and date range.
- **B. The Algorithm (خوارزمية العمل)**:
  1. Render the form shell only when the panel is open.
  2. Bind the form to `filterForm` using `[formGroup]`.
  3. Map each control to its corresponding input or select through `formControlName`.
  4. Submit the form with `ngSubmit` to call `onApply()`.
  5. Render Reset and Apply buttons as the action footer.
- **C. Core Code Snippet**:

```html
<form [formGroup]="filterForm" (ngSubmit)="onApply()" class="filter-form">
  <div class="filter-groups">
    <div class="filter-group">
      <p class="group-label">STATUS &amp; BRANCH</p>
      <div class="group-row two-columns">
        <select id="status" formControlName="status" class="form-control" aria-label="Status">
          <option value="All Status">All Status</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="NOW_SHOWING">Now Showing</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <input
          type="text"
          id="branchName"
          formControlName="branchName"
          class="form-control"
          placeholder="Branch..."
          aria-label="Branch name"
        />
      </div>
    </div>
    ...
  </div>
</form>
```

- **D. Mechanics & Integration (طريقة العمل والتأثير التقني)**: `formGroup` registers the `FormGroupDirective` on the form element, which then coordinates all child `formControlName` directives. When a user changes any field, Angular propagates the value through the control tree, updates the model object, and schedules template updates in the current change-detection cycle. The `ngSubmit` binding hooks into Angular’s form submission handling so the submit button and Enter key both follow the same path.
- **E. The Reasoning (السبب التقني)**: The grouped layout mirrors the domain model of showtime filtering. It keeps the form readable for admins and keeps the implementation aligned with the structure of the emitted filter object.

## 3. Lifecycle & Angular Features (دورة الحياة وأدوات إطار العمل)

- **Lifecycle Hooks Used**: None. The component does not implement `OnInit`, `OnDestroy`, or any other Angular lifecycle hook.
- **Angular Core Features Utilized**:
  - `standalone: true`: Makes the component self-contained and importable without a feature NgModule.
  - `CommonModule`: Supplies common Angular template directives and foundational template functionality.
  - `ReactiveFormsModule`: Enables the reactive forms API, including `[formGroup]` and `formControlName`.
  - `FormBuilder` and `FormGroup`: Define and manage the form model.
  - `@Input()`: Accepts `isOpen` from the parent so the parent controls when the panel is visible.
  - `@Output()` with `EventEmitter`: Exposes `applyFilters` and `resetFilters` events for parent communication.
  - `@if`: Conditionally instantiates the panel markup based on visibility.
  - `(ngSubmit)`: Routes form submission through Angular’s form handling instead of a manual DOM listener.

## 4. Dependencies (الاعتماديات)

- `FormBuilder`: Injected via the constructor to build the reactive `FormGroup`.
- `CommonModule`: Provides standard Angular template support used by the standalone component.
- `ReactiveFormsModule`: Provides reactive form directives and control wiring.
- No routers are used.
- No external libraries are used.
- The component exports and emits `ShowtimesFilter`, which is the data contract consumed by the parent showtimes management component.
