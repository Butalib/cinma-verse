# Component: CreateUserModal

## 1. Main Operation (العملية الرئيسية)

The CreateUserModalComponent serves as a modal dialog for creating new user accounts in the admin dashboard. It provides a comprehensive form interface that collects essential user information (personal details, contact information, credentials) and emits the collected data for parent component processing when validation passes. The modal is dismissible via backdrop click, close button, or cancel action.

## 2. Sub-Operations & Technical Implementation (العمليات الفرعية والتقنيات)

### Sub-Operation 1: Form Initialization & Control Definition

- **The Logic**: Initializes a reactive form group with 10 form controls representing user account fields. Each control is configured with appropriate default values and validators (required, email format).
- **State Management & Data Flow**: Uses `NonNullableFormBuilder` (dependency injection via `inject()`) to create a form group. Form structure is defined in the component's `form` property as a class member signal-like property using OnPush detection.
- **Core Code Snippet**:

```typescript
readonly form = this.fb.group({
  firstName: ['', [Validators.required]],
  lastName: ['', [Validators.required]],
  email: ['', [Validators.required, Validators.email]],
  phoneNumber: [''],
  title: [''],
  dateOfBirth: [''],
  password: ['', [Validators.required]],
  city: [''],
  gender: ['' as '' | 'Male' | 'Female'],
  address: [''],
});
```

### Sub-Operation 2: Form Validation & Error Display

- **The Logic**: Validates individual form controls and determines if they should display error messages based on validation state (invalid + dirty/touched).
- **State Management & Data Flow**: Tracks form control state through Angular's reactive forms API. The `isInvalid()` method checks both the invalid state and user interaction (dirty/touched) flags. Error messages are conditionally rendered in the template using the `@if` control flow.
- **Core Code Snippet**:

```typescript
isInvalid(controlName: keyof CreateUserPayload): boolean {
  const control = this.form.controls[controlName];
  return control.invalid && (control.dirty || control.touched);
}
```

### Sub-Operation 3: Form Submission Handling

- **The Logic**: Validates the entire form before submission. If invalid, marks all controls as touched to trigger error display. If valid, emits the form data to parent component via output event.
- **State Management & Data Flow**: Uses `onSubmit()` method bound to form submission event. Form validation state is checked using `form.invalid` property. Successfully validated form values are retrieved via `getRawValue()` and emitted through the `createUser` output emitter.
- **Core Code Snippet**:

```typescript
onSubmit(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }
  this.createUser.emit(this.form.getRawValue());
}
```

### Sub-Operation 4: Modal Dismissal

- **The Logic**: Provides two methods to close the modal: explicit cancel/close button clicks and backdrop clicks (clicking outside the modal).
- **State Management & Data Flow**: Both `onCancel()` and `onBackdropClick()` methods emit through the `closeModal` output emitter to notify parent component of dismissal.
- **Core Code Snippet**:

```typescript
onCancel(): void {
  this.closeModal.emit();
}

onBackdropClick(): void {
  this.closeModal.emit();
}
```

## 3. Lifecycle & Angular Features (دورة الحياة وأدوات إطار العمل)

- **Standalone Component**: Uses `standalone: true` configuration, no NgModule dependency required.
- **Change Detection Strategy**: Implements `ChangeDetectionStrategy.OnPush` for optimal performance, manually controlled change detection.
- **Reactive Forms**: Utilizes `ReactiveFormsModule` for form management with `FormBuilder`, `ReactiveFormsModule`, and form validators.
- **Angular Features Used**:
  - `@Output()`: Two output emitters (`createUser` and `closeModal`) using new output API
  - Control Flow: Built-in `@if` control flow syntax for conditional error message rendering
  - Dependency Injection: `inject()` function for injecting `NonNullableFormBuilder`
  - Event Binding: Template event bindings for form submission, click handlers, backdrop interactions
- **No Lifecycle Hooks**: Component does not implement `OnInit`, `OnDestroy`, or other lifecycle hooks; all initialization occurs in class field definitions.

## 4. Dependencies (الاعتماديات)

### Injected Services

- `NonNullableFormBuilder`: Angular Forms API for reactive form creation and management

### Angular Modules/APIs

- `CommonModule`: For common Angular directives
- `ReactiveFormsModule`: For reactive form controls (`formGroup`, `formControlName`)
- `Validators`: From `@angular/forms` for form validation rules (required, email)

### Exported Types

- `CreateUserPayload`: Interface defining the shape of emitted user creation data with properties: firstName, lastName, email, phoneNumber, title, dateOfBirth, password, city, gender, address

### No Direct Service Dependencies

- Does not inject custom services; relies solely on Angular Forms API and builder pattern
