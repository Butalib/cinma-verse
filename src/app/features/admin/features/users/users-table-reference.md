# Component: UsersTable

## 1. Main Operation (العملية الرئيسية)

The UsersTableComponent displays a data table of users with comprehensive user information and interactive action controls. It renders a responsive HTML table with user details (ID, name, contact, city, role, status, email confirmation) and provides per-row action buttons for viewing, editing, and deleting users. The component handles empty states, manages action menu positioning, and emits user interactions back to the parent component.

## 2. Sub-Operations & Technical Implementation (العمليات الفرعية والتقنيات)

### Sub-Operation 1: Users Data Binding via Required Input Signal

- **The Logic**: Receives the array of users to display as a required input signal. Cannot render without this data.
- **State Management & Data Flow**: Uses `input.required<UsersTableRow[]>()` to declare that users data is mandatory. Data flows from parent (layout component) which provides the paginated user list via `[users]="pagedUsers()"`. Accessed in template via `users()` function call syntax.
- **Core Code Snippet**:

```typescript
readonly users = input.required<UsersTableRow[]>();

// In template:
@for (user of users(); track user.id) {
  <tr>...</tr>
}
```

### Sub-Operation 2: Empty State Handling

- **The Logic**: Displays a "No users found" message when the users array is empty.
- **State Management & Data Flow**: Template uses `@if (users().length === 0)` control flow to conditionally render empty state div. Otherwise renders the table structure.
- **Core Code Snippet**:

```html
@if (users().length === 0) {
<div class="users-table-empty">No users found.</div>
} @else {
<div class="users-table-shell">
  <!-- table content -->
</div>
}
```

### Sub-Operation 3: Table Row Rendering with Loop & Tracking

- **The Logic**: Iterates through the users array and renders one table row per user with all user information fields.
- **State Management & Data Flow**: Uses `@for (user of users(); track user.id)` to loop through users. The `track user.id` expression optimizes re-rendering by tracking by unique ID. Displays: user.id, user.name, user.contact, user.city, user.role, user.status, user.emailConfirmed.
- **Core Code Snippet**:

```html
@for (user of users(); track user.id) {
<tr>
  <td class="users-table__mono">{{ user.id }}</td>
  <td class="users-table__name">{{ user.name }}</td>
  <td>{{ user.contact }}</td>
  <td>{{ user.city }}</td>
  <!-- more cells... -->
</tr>
}
```

### Sub-Operation 4: Status & Role Badge Rendering with Dynamic CSS Classes

- **The Logic**: Renders user role, account status, and email confirmation status as styled badges with color-coded appearance based on their values.
- **State Management & Data Flow**: Badges are span elements with class bindings that conditionally apply styling based on data values. Role badge shows 'Customer' or 'Admin' with special admin styling. Status badge shows 'ACTIVE' or 'SUSPENDED' with color coding. Email badge shows 'CONFIRMED' or 'NOT CONFIRMED' with color coding.
- **Core Code Snippet**:

```html
<span class="badge badge--role" [class.badge--role-admin]="user.role === 'Admin'">
  {{ user.role }}
</span>

<span
  class="badge"
  [class.badge--status-active]="user.status === 'ACTIVE'"
  [class.badge--status-suspended]="user.status === 'SUSPENDED'"
>
  {{ user.status }}
</span>
```

### Sub-Operation 5: Desktop Action Buttons (View, Edit, Delete)

- **The Logic**: Renders inline icon buttons for quick user actions (view, edit, delete) displayed only on desktop viewports.
- **State Management & Data Flow**: Three icon buttons are rendered in a flex container with class `users-table__actions--desktop` (hidden on mobile). Each button calls a respective handler method: `onView()`, `onEdit()`, `onDelete()`. The delete button has danger styling.
- **Core Code Snippet**:

```html
<div class="users-table__actions users-table__actions--desktop">
  <button type="button" class="icon-btn" aria-label="View user" (click)="onView(user.id)">
    <span class="material-symbols-outlined" aria-hidden="true">visibility</span>
  </button>
  <button type="button" class="icon-btn" aria-label="Edit user" (click)="onEdit(user)">
    <span class="material-symbols-outlined" aria-hidden="true">edit</span>
  </button>
  <button
    type="button"
    class="icon-btn icon-btn--danger"
    aria-label="Delete user"
    (click)="onDelete(user.id)"
  >
    <span class="material-symbols-outlined" aria-hidden="true">delete</span>
  </button>
</div>
```

### Sub-Operation 6: Mobile-Responsive Actions Menu (Details/Summary)

- **The Logic**: Provides a collapsible menu for user actions on mobile/tablet viewports. Uses native HTML `<details>` element for accessibility and progressive enhancement.
- **State Management & Data Flow**: Uses `<details>` element with class `users-table__actions-menu` and name attribute "user-actions" to ensure only one menu is open at a time. The `<summary>` element is a trigger button. Menu items are buttons inside a div with role="menu". The `(toggle)` event binding calls `onActionsMenuToggle()` for smart positioning.
- **Core Code Snippet**:

```html
<details
  class="users-table__actions-menu"
  name="user-actions"
  (toggle)="onActionsMenuToggle($event)"
>
  <summary class="icon-btn users-table__menu-trigger" aria-label="Open actions menu">
    <span class="material-symbols-outlined" aria-hidden="true">more_vert</span>
  </summary>
  <div class="users-table__menu-list" role="menu" aria-label="User actions">
    <button
      type="button"
      class="users-table__menu-item"
      role="menuitem"
      (click)="onMenuView($event, user.id)"
    >
      <span>View</span>
    </button>
    <!-- Edit and Delete items... -->
  </div>
</details>
```

### Sub-Operation 7: Menu Action Handlers with Auto-Close

- **The Logic**: When user clicks a menu item, the action is performed and the menu is automatically closed.
- **State Management & Data Flow**: Three methods (`onMenuView()`, `onMenuEdit()`, `onMenuDelete()`) receive the click event and user data, call `closeMenu()` to close the parent `<details>` element, then call the respective output emitter. The `closeMenu()` method finds the closest `<details>` element and removes the `open` attribute.
- **Core Code Snippet**:

```typescript
onMenuView(event: Event, id: string): void {
  this.closeMenu(event);
  this.onView(id);
}

private closeMenu(event: Event): void {
  const target = event.currentTarget as HTMLElement | null;
  const details = target?.closest('details');
  if (details) {
    details.removeAttribute('open');
  }
}
```

### Sub-Operation 8: Smart Menu Positioning (Drop-Up Detection)

- **The Logic**: Automatically repositions action menu upward if it would overflow the bottom of the viewport.
- **State Management & Data Flow**: `onActionsMenuToggle()` is called on every details toggle event. When the menu opens, it uses `requestAnimationFrame()` to measure the menu's bounding rectangle. If the bottom would exceed the viewport height, it adds the `users-table__actions-menu--drop-up` CSS class which repositions the menu above the trigger button. Prevents multiple menus from being open simultaneously.
- **Core Code Snippet**:

```typescript
onActionsMenuToggle(event: Event): void {
  const target = event.currentTarget;
  if (!(target instanceof HTMLDetailsElement) || !target.classList.contains('users-table__actions-menu')) {
    return;
  }

  if (!target.open) {
    target.classList.remove('users-table__actions-menu--drop-up');
    return;
  }

  const openMenus = this.hostRef.nativeElement.querySelectorAll('.users-table__actions-menu[open]');
  for (const node of openMenus) {
    if (node instanceof HTMLDetailsElement && node !== target) {
      node.removeAttribute('open');
    }
  }

  requestAnimationFrame(() => {
    const menu = target.querySelector('.users-table__menu-list');
    if (!menu) return;
    const rect = menu.getBoundingClientRect();
    if (rect.bottom > window.innerHeight - 8) {
      target.classList.add('users-table__actions-menu--drop-up');
    }
  });
}
```

### Sub-Operation 9: Output Event Emission for Parent Handling

- **The Logic**: Emits three distinct events to parent component when user performs actions: view, edit, delete.
- **State Management & Data Flow**: Three `@Output()` emitters emit events with different payloads:
  - `viewUser`: Emits user ID string
  - `editUser`: Emits complete UsersTableRow object
  - `deleteUser`: Emits user ID string
    Parent component (layout) subscribes to these events and handles API calls and state updates.
- **Core Code Snippet**:

```typescript
readonly viewUser = output<string>();
readonly editUser = output<UsersTableRow>();
readonly deleteUser = output<string>();

onView(id: string): void {
  this.viewUser.emit(id);
}

onEdit(user: UsersTableRow): void {
  this.editUser.emit(user);
}

onDelete(id: string): void {
  this.deleteUser.emit(id);
}
```

### Sub-Operation 10: DOM Reference Management via ElementRef

- **The Logic**: Provides access to the component's host element for DOM query operations needed for menu positioning logic.
- **State Management & Data Flow**: Injects `ElementRef<HTMLElement>` via `inject()`. Used in `onActionsMenuToggle()` to query all open details menus using `hostRef.nativeElement.querySelectorAll()`.
- **Core Code Snippet**:

```typescript
private readonly hostRef = inject(ElementRef<HTMLElement>);

const openMenus = this.hostRef.nativeElement.querySelectorAll('.users-table__actions-menu[open]');
```

## 3. Lifecycle & Angular Features (دورة الحياة وأدوات إطار العمل)

- **Standalone Component**: Uses `standalone: true` with CommonModule import.
- **Change Detection Strategy**: Implements `ChangeDetectionStrategy.OnPush` for optimized performance.
- **Input Signals**: Uses `input.required()` for required reactive input (signals-based, not decorators).
- **Output Signals**: Uses `output()` API for event emission (signals-based, not decorators).
- **Control Flow**: Uses new `@if` and `@for` control flow syntax.
- **HTML Native Elements**: Uses native `<details>` and `<summary>` elements for accessible menus (no custom dropdown library).
- **DOM Queries**: Uses `querySelectorAll()` and `closest()` for DOM manipulation and navigation.
- **RequestAnimationFrame**: Uses for measuring DOM after layout changes (smooth menu positioning).
- **Accessibility**: Proper ARIA labels, roles, and semantic HTML structure.
- **No Lifecycle Hooks**: No OnInit, OnDestroy implementation; all logic in event handlers.
- **Material Icons**: Renders Material symbols via CSS class.

## 4. Dependencies (الاعتماديات)

### Injected Services

- `ElementRef<HTMLElement>`: For accessing component host element and DOM queries

### Angular Modules/APIs

- `CommonModule`: For common directives
- `input.required()`: Signal API for required inputs
- `output()`: Signal API for outputs
- `ChangeDetectionStrategy.OnPush`: Performance optimization
- `inject()`: Dependency injection function
- `@if` and `@for`: Control flow syntax

### Exported Types

- `UsersTableRow`: Interface with properties: id, name, joinedDate, contact, city, gender, role, status, emailConfirmed, createdAt, dateOfBirth (optional)
- `UserRole`: Type union 'Customer' | 'Admin'
- `UserStatus`: Type union 'ACTIVE' | 'SUSPENDED'
- `EmailConfirmation`: Type union 'CONFIRMED' | 'NOT CONFIRMED'
- `UserGender`: Type union 'Male' | 'Female'

### No Direct Service Dependencies

- Does not inject custom services
- Pure presentation and event emission component
