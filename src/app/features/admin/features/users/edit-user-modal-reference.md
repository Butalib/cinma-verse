# Component: EditUserModal

## 1. Main Operation (العملية الرئيسية)

The EditUserModalComponent provides a modal dialog for editing user account permissions and settings in the admin dashboard. It displays read-only user information and allows modification of account management settings (role assignment, active status, email confirmation). The component uses Angular signals for reactive input handling and persists changes back to the parent component with saving state feedback.

## 2. Sub-Operations & Technical Implementation (العمليات الفرعية والتقنيات)

### Sub-Operation 1: Component Input Signal Setup

- **The Logic**: Receives and displays user data through reactive input signals. The component accepts user details object and a loading flag to manage UI state during save operations.
- **State Management & Data Flow**: Uses Angular's new `input()` API to declare reactive inputs. Two inputs are defined: `user` (EditUserDetails object, defaults to null) and `isSaving` (boolean, defaults to false). Both are accessed via function-call syntax in templates and component code (`user()`, `isSaving()`).
- **Core Code Snippet**:

```typescript
readonly user = input<EditUserDetails | null>(null);
readonly isSaving = input(false);
```

### Sub-Operation 2: Form Synchronization via Effect

- **The Logic**: Watches for changes to the input user signal and automatically synchronizes the form with the latest user data whenever the user changes.
- **State Management & Data Flow**: Uses Angular's `effect()` function (constructor dependency) to create a reactive side-effect. When the `user()` signal changes, the effect retrieves the current user value and updates the form using `setValue()`. This ensures form always reflects the input data.
- **Core Code Snippet**:

```typescript
constructor() {
  effect(() => {
    const currentUser = this.user();
    if (!currentUser) {
      return;
    }

    this.form.setValue({
      role: currentUser.role,
      isActive: currentUser.isActive,
      emailConfirmed: currentUser.emailConfirmed,
    });
  });
}
```

### Sub-Operation 3: Editable Form Controls for Permissions

- **The Logic**: Manages a reactive form containing three editable fields for user account settings: role assignment (dropdown), active status (checkbox), and email confirmation (checkbox).
- **State Management & Data Flow**: Form is created using `NonNullableFormBuilder` with three form controls. The role control has a required validator. Form data is bound to template using `[formGroup]` and `formControlName` directives. Form values are retrieved via `getRawValue()` when saving.
- **Core Code Snippet**:

```typescript
readonly form = this.fb.group({
  role: this.fb.control<'user' | 'admin'>('user', [Validators.required]),
  isActive: this.fb.control(true),
  emailConfirmed: this.fb.control(false),
});
```

### Sub-Operation 4: Read-Only User Information Display

- **The Logic**: Presents a non-editable section displaying user's personal information (fullName, email, phoneNumber, dateOfBirth, gender, city, address) retrieved from the input signal.
- **State Management & Data Flow**: Data flows from `user()` input signal directly to template using interpolation with null-coalescing operator (`user()?.fieldName || '-'`). No form control or state management involved; purely display-focused.
- **Core Code Snippet**:

```html
<div>
  <span class="label">Full Name</span>
  <p>{{ user()?.fullName || '-' }}</p>
</div>
```

### Sub-Operation 5: Save Operation with Validation & State Check

- **The Logic**: Validates the form before emitting changes. Prevents save operations while already saving (isSaving flag is true). Marks all fields as touched if validation fails.
- **State Management & Data Flow**: `onSave()` method checks both `form.invalid` and `isSaving()` conditions. If form is invalid, marks all fields touched to display validation errors. If valid and not currently saving, emits form values through `saveChanges` output as `UpdateUserPayload` type.
- **Core Code Snippet**:

```typescript
onSave(): void {
  if (this.form.invalid || this.isSaving()) {
    this.form.markAllAsTouched();
    return;
  }

  const value = this.form.getRawValue();
  this.saveChanges.emit({
    role: value.role,
    isActive: value.isActive,
    emailConfirmed: value.emailConfirmed,
  });
}
```

### Sub-Operation 6: Modal Dismissal with Saving Prevention

- **The Logic**: Allows users to close the modal via backdrop click or cancel button, but prevents dismissal while save operation is in progress (isSaving is true).
- **State Management & Data Flow**: Both `onBackdropClick()` and `onCancel()` methods check `isSaving()` flag. If saving is in progress, the operation is aborted. Otherwise, `closeModal` output is emitted to notify parent.
- **Core Code Snippet**:

```typescript
onCancel(): void {
  if (this.isSaving()) {
    return;
  }
  this.closeModal.emit();
}
```

## 3. Lifecycle & Angular Features (دورة الحياة وأدوات إطار العمل)

- **Standalone Component**: Uses `standalone: true` configuration, no NgModule dependency.
- **Change Detection Strategy**: Implements `ChangeDetectionStrategy.OnPush` for optimized performance.
- **Signal-Based Reactivity**: Uses Angular's new signal API for reactive inputs (`input()`), not `@Input()` decorator.
- **Effect for Side Effects**: Uses `effect()` constructor function for reactive side-effect handling (form synchronization).
- **Reactive Forms**: Utilizes `ReactiveFormsModule` with `FormBuilder` and form validators.
- **Angular Features Used**:
  - `@Output()`: Two output emitters (`closeModal` and `saveChanges`) using new output API
  - `input()` signals: For reactive component inputs
  - `effect()`: For reactive side-effect based form synchronization
  - Control Flow: Built-in `@if` control flow syntax for conditional button label rendering
  - Event Binding: Template event bindings for form interactions and button clicks
- **No Explicit Lifecycle Hooks**: No implementation of OnInit, OnDestroy, or other lifecycle hooks; initialization and reactive updates handled via signals and effects.

## 4. Dependencies (الاعتماديات)

### Injected Services & APIs

- `NonNullableFormBuilder`: Angular Forms API for reactive form creation and management

### Angular Modules/APIs

- `CommonModule`: For common Angular directives
- `ReactiveFormsModule`: For reactive form controls (`formGroup`, `formControlName`)
- `Validators`: From `@angular/forms` for form validation (required)
- `effect()`: Angular reactivity API for side-effect management
- `input()`: Angular signals API for reactive inputs

### Imported Types

- `UpdateUserPayload`: Interface imported from `../users-managemen/services/users.service` defining the shape of data emitted on save (role, isActive, emailConfirmed)

### Exported Types

- `EditUserDetails`: Interface defining the shape of user data received via input signal with properties: id, fullName, email, phoneNumber, dateOfBirth, gender, city, address, role, isActive, emailConfirmed

### External Dependencies

- No custom service dependencies; only Angular Forms API and signals
