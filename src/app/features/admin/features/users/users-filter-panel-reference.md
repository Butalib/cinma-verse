# Component: UsersFilterPanel

## 1. Main Operation (العملية الرئيسية)

The UsersFilterPanelComponent provides an advanced filtering UI for the users management list. It allows administrators to apply multiple filter criteria simultaneously including user status (active/suspended), email confirmation status, gender, city, and date ranges for account creation and date of birth. The component emits filter objects to the parent component and provides reset functionality to clear all filters.

## 2. Sub-Operations & Technical Implementation (العمليات الفرعية والتقنيات)

### Sub-Operation 1: Filter Form Creation & Initialization

- **The Logic**: Initializes a reactive form with 8 form controls representing different filter criteria. Each control has a default value representing "no filter" state.
- **State Management & Data Flow**: Uses `FormBuilder` injected via constructor to create a `FormGroup` called `filterForm`. Form controls are: isActive (default 'All Status'), emailConfirmed (default 'All Email'), gender (default 'All'), city (default ''), createdFrom (null), createdTo (null), dateOfBirthFrom (null), dateOfBirthTo (null). Form is bound to template via `[formGroup]` and `formControlName`.
- **Core Code Snippet**:

```typescript
filterForm: FormGroup;

constructor(private fb: FormBuilder) {
  this.filterForm = this.fb.group({
    isActive: ['All Status'],
    emailConfirmed: ['All Email'],
    gender: ['All'],
    city: [''],
    createdFrom: [null],
    createdTo: [null],
    dateOfBirthFrom: [null],
    dateOfBirthTo: [null]
  });
}
```

### Sub-Operation 2: Visibility Control via Input Binding

- **The Logic**: Controls whether the filter panel is displayed or hidden based on parent component state.
- **State Management & Data Flow**: Uses `@Input() isOpen` property (decorator-based, not signal). When `isOpen` is true, the template renders the filter panel using `@if (isOpen)`. Parent component controls this binding.
- **Core Code Snippet**:

```typescript
@Input() isOpen = false;
```

### Sub-Operation 3: Filter Data Transformation & Validation

- **The Logic**: Converts raw form values to a `UsersFilter` object by applying conditional logic. Only includes filters that are explicitly set (non-default values). Converts string values to appropriate types (Date objects for date fields, boolean for status/email confirmation).
- **State Management & Data Flow**: `onApply()` method reads `filterForm.value`, iterates through each field, and conditionally adds it to the `filterData` object if it differs from default values. For status/email fields, compares string values ('Active' → true, 'Confirmed' → true). For date fields, converts strings to Date objects.
- **Core Code Snippet**:

```typescript
onApply() {
  const rawValue = this.filterForm.value;
  const filterData: UsersFilter = {};

  if (rawValue.isActive !== 'All Status') {
    filterData.isActive = rawValue.isActive === 'Active';
  }

  if (rawValue.emailConfirmed !== 'All Email') {
    filterData.emailConfirmed = rawValue.emailConfirmed === 'Confirmed';
  }

  if (rawValue.city && rawValue.city.trim() !== '') {
    filterData.city = rawValue.city;
  }

  if (rawValue.createdFrom) {
    filterData.createdFrom = new Date(rawValue.createdFrom);
  }

  this.applyFilters.emit(filterData);
}
```

### Sub-Operation 4: Filter Application Output

- **The Logic**: Emits the processed filter object to parent component when user clicks "Apply Filters" button.
- **State Management & Data Flow**: Uses `@Output() applyFilters` event emitter to send `UsersFilter` object to parent. Triggered by form submission (ngSubmit) or apply button click.
- **Core Code Snippet**:

```typescript
@Output() applyFilters = new EventEmitter<UsersFilter>();
// ... in onApply():
this.applyFilters.emit(filterData);
```

### Sub-Operation 5: Filter Reset with State Restoration

- **The Logic**: Resets the form to default values and emits reset signal to parent.
- **State Management & Data Flow**: `onReset()` calls `filterForm.reset()` with an object containing all default values matching initialization state. Simultaneously emits empty event via `@Output() resetFilters` to signal parent to clear filters.
- **Core Code Snippet**:

```typescript
@Output() resetFilters = new EventEmitter<void>();

onReset() {
  this.filterForm.reset({
    isActive: 'All Status',
    emailConfirmed: 'All Email',
    gender: 'All',
    city: '',
    createdFrom: null,
    createdTo: null,
    dateOfBirthFrom: null,
    dateOfBirthTo: null
  });
  this.resetFilters.emit();
}
```

### Sub-Operation 6: Form Layout & Grouped Filter Categories

- **The Logic**: Organizes form controls into logical groups: status/email, gender/city, and date ranges. Renders as a flexible form with semantic grouping.
- **State Management & Data Flow**: Template structure groups controls within `filter-group` divs with group labels. Layout uses CSS flexbox with responsive wrapping. Two-column layout for status/email and gender/city pairs, four-column layout for date ranges.
- **Core Code Snippet**:

```html
<div class="filter-group">
  <p class="group-label">STATUS & EMAIL</p>
  <div class="group-row two-columns">
    <select id="isActive" formControlName="isActive" ...></select>
    <select id="emailConfirmed" formControlName="emailConfirmed" ...></select>
  </div>
</div>
```

### Sub-Operation 7: Date Range Input Handling

- **The Logic**: Provides separate from/to date inputs for both creation date and date of birth filtering.
- **State Management & Data Flow**: Four date input fields (HTML type="date") are bound to form controls: createdFrom, createdTo, dateOfBirthFrom, dateOfBirthTo. Browser date picker handles input formatting. Values are null when empty and converted to Date objects on apply.
- **Core Code Snippet**:

```html
<input type="date" formControlName="createdFrom" ... />
<input type="date" formControlName="createdTo" ... />
```

## 3. Lifecycle & Angular Features (دورة الحياة وأدوات إطار العمل)

- **Standalone Component**: Uses `standalone: true` with explicit imports.
- **Change Detection Strategy**: Does NOT explicitly set OnPush (uses default change detection).
- **Input/Output Decorators**: Uses legacy `@Input()` and `@Output()` decorators (not signal-based inputs).
- **Reactive Forms**: Uses `ReactiveFormsModule`, `FormBuilder`, and `FormGroup` for form management.
- **Conditional Rendering**: Uses new `@if` control flow to conditionally display panel based on `isOpen` input.
- **Template Forms**: All form controls bound via `[formGroup]` and `formControlName` directives.
- **Event Handling**: Form submission via `(ngSubmit)` and button click handlers.
- **No Lifecycle Hooks**: No implementation of OnInit, OnDestroy; initialization in constructor.
- **Legacy Pattern**: Uses class-based component with decorator-based @Input/@Output rather than signals.

## 4. Dependencies (الاعتماديات)

### Injected Services

- `FormBuilder`: From `@angular/forms`, injected via constructor for reactive form creation

### Angular Modules/APIs

- `CommonModule`: For common Angular directives
- `ReactiveFormsModule`: For reactive form controls and bindings
- `FormBuilder`: For creating FormGroup instances
- `Validators`: Not imported but available for use
- `@Input()` and `@Output()`: Decorators for component communication

### Exported Types

- `UsersFilter`: Interface exported from component with properties: isActive (boolean), emailConfirmed (boolean), gender (string), city (string), createdFrom (Date), createdTo (Date), dateOfBirthFrom (Date), dateOfBirthTo (Date)

### Form Control Names

- isActive, emailConfirmed, gender, city, createdFrom, createdTo, dateOfBirthFrom, dateOfBirthTo

### No Direct Service Dependencies

- Relies only on Angular Forms API
- No custom services or external dependencies
