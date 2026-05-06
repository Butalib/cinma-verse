# Component: UsersSearchToolbar

## 1. Main Operation (العملية الرئيسية)

The UsersSearchToolbarComponent provides a toolbar with a search input field and action buttons for managing the users list. It enables administrators to search users in real-time and access additional features (filter, export, add new user). All user interactions emit events to the parent component for handling.

## 2. Sub-Operations & Technical Implementation (العمليات الفرعية والتقنيات)

### Sub-Operation 1: Real-Time Search Input Handling

- **The Logic**: Captures user input from the search field and emits the search term to parent component in real-time as the user types.
- **State Management & Data Flow**: Uses event binding `(input)="onSearchInput($event)"` on the search input element. The `onSearchInput()` method extracts the input value from the DOM event target and emits it via `searchChange` output. Parent component receives the term and updates its search filter.
- **Core Code Snippet**:

```typescript
readonly searchChange = output<string>();

onSearchInput(event: Event): void {
  const target = event.target as HTMLInputElement | null;
  this.searchChange.emit(target?.value ?? '');
}
```

### Sub-Operation 2: Search Field UI with Icon

- **The Logic**: Renders a styled search input field with a search icon and placeholder text.
- **State Management & Data Flow**: Template includes a label wrapper with Material search icon and an HTML input element (type="search"). The input has a placeholder prompting users to search by name, email, or user ID. Icon is marked `aria-hidden="true"` as it's purely decorative.
- **Core Code Snippet**:

```html
<label class="users-search-toolbar__search-field" for="users-search-toolbar-input">
  <span class="material-symbols-outlined" aria-hidden="true">search</span>
  <input
    id="users-search-toolbar-input"
    type="search"
    placeholder="Search by name, email, or user ID..."
  />
</label>
```

### Sub-Operation 3: Action Buttons with Event Emission

- **The Logic**: Renders three action buttons (Filter, Export, Add User) that emit distinct events when clicked.
- **State Management & Data Flow**: Three `@Output()` emitters (`filterClicked`, `exportClicked`, `addClicked`) are triggered via click handlers on their respective buttons. Each button has an icon and label. The primary button (Add User) uses different styling than secondary buttons (Filter, Export).
- **Core Code Snippet**:

```typescript
readonly filterClicked = output<void>();
readonly exportClicked = output<void>();
readonly addClicked = output<void>();

// In template:
<button (click)="filterClicked.emit()">
  <span>Filter</span>
</button>
<button (click)="addClicked.emit()">
  <span>Add User</span>
</button>
```

### Sub-Operation 4: Button Icons & Labels

- **The Logic**: Each action button displays a Material Design icon paired with text label for clarity.
- **State Management & Data Flow**: Material icons are rendered via `material-symbols-outlined` class with icon names (tune, download, add). Icons are marked `aria-hidden="true"` as they're decorative; labels provide the semantic meaning.
- **Core Code Snippet**:

```html
<button type="button" (click)="filterClicked.emit()">
  <span class="material-symbols-outlined" aria-hidden="true">tune</span>
  <span>Filter</span>
</button>
```

## 3. Lifecycle & Angular Features (دورة الحياة وأدوات إطار العمل)

- **Standalone Component**: Does NOT explicitly declare standalone (missing `standalone: true`); imports are not specified, suggesting it may be used in a module-based setup or this is a legacy component.
- **Change Detection Strategy**: Implements `ChangeDetectionStrategy.OnPush` for optimized performance (no dependency on input/output changes).
- **Output Events**: Uses new `output()` API (non-decorator) for emitting events to parent component.
- **Event Binding**: Template uses `(input)` for real-time search input and `(click)` for button actions.
- **Material Icons**: Renders Material Design icons via `material-symbols-outlined` CSS class.
- **Accessibility**: Uses semantic HTML (label associations, aria-labels, aria-hidden for decorative icons).
- **No Input Properties**: Component has no @Input bindings; purely presentation and event emission.
- **No Lifecycle Hooks**: No implementation of OnInit, OnDestroy; all logic in event handlers.

## 4. Dependencies (الاعتماديات)

### Angular APIs

- `output()`: New API for emitting events (non-decorator based outputs)
- `ChangeDetectionStrategy.OnPush`: Performance optimization directive
- `@Component`: Decorator with OnPush strategy

### HTML/Template Features

- `(input)` event binding: For real-time search input capture
- `(click)` event binding: For button interactions
- Material Icons CSS class: For icon rendering
- Semantic HTML elements: labels, inputs, buttons
- `aria-label` attributes: For accessibility

### No Angular Modules/Services

- Does not import CommonModule or other shared modules
- No injected services
- No external dependencies

### Emitted Types

- `searchChange`: Emits string (search term)
- `filterClicked`: Emits void
- `exportClicked`: Emits void
- `addClicked`: Emits void
