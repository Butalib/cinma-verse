# Component: Pagination

## 1. Main Operation (العملية الرئيسية)

The PaginationComponent provides controls for navigating through paginated data. It displays the current range of items being viewed (e.g., "Showing 1-10 of 127 items"), provides navigation buttons (previous/next and numbered pages), and includes a dropdown to change the page size. The component uses reactive inputs for total items, page size, and current page, and emits events to the parent component when pagination state changes.

## 2. Sub-Operations & Technical Implementation (العمليات الفرعية والتقنيات)

### Sub-Operation 1: Pagination Inputs from Parent

- **The Logic**: Receives three required input signals that define the current pagination state: total item count, items per page, and current page number.
- **State Management & Data Flow**: Uses three `input.required()` signals:
  - `totalItems`: Total number of items in the filtered dataset
  - `pageSize`: Number of items displayed per page
  - `currentPage`: Current page number (1-indexed)
    All are accessed via function-call syntax in template and computed signals.
- **Core Code Snippet**:

```typescript
readonly totalItems = input.required<number>();
readonly pageSize = input.required<number>();
readonly currentPage = input.required<number>();
```

### Sub-Operation 2: Total Pages Computation

- **The Logic**: Calculates the total number of pages needed to display all items given the current page size.
- **State Management & Data Flow**: `totalPages` is a computed signal that calculates Math.ceil(totalItems() / pageSize()), with a minimum of 1 to prevent division by zero or invalid states.
- **Core Code Snippet**:

```typescript
readonly totalPages = computed(() =>
  Math.max(Math.ceil(this.totalItems() / this.pageSize()), 1)
);
```

### Sub-Operation 3: Page Number Array Generation

- **The Logic**: Generates an array of page numbers from 1 to totalPages for rendering page buttons.
- **State Management & Data Flow**: `pages` is a computed signal that uses `Array.from()` to generate an array of sequential page numbers based on `totalPages()`. This array is used in the template `@for` loop to render individual page buttons.
- **Core Code Snippet**:

```typescript
readonly pages = computed(() =>
  Array.from({ length: this.totalPages() }, (_, index) => index + 1)
);
```

### Sub-Operation 4: Item Range Calculation (Showing X-Y of Z)

- **The Logic**: Computes the "from" and "to" item numbers displayed on the current page for the "Showing X-Y of Z items" display.
- **State Management & Data Flow**: Two computed signals:
  - `showingFrom`: Calculates (currentPage() - 1) \* pageSize() + 1, returns 0 if no items
  - `showingTo`: Calculates Math.min(currentPage() \* pageSize(), totalItems())
    These values display the range of items visible on the current page.
- **Core Code Snippet**:

```typescript
readonly showingFrom = computed(() => {
  if (this.totalItems() === 0) return 0;
  return (this.currentPage() - 1) * this.pageSize() + 1;
});

readonly showingTo = computed(() =>
  Math.min(this.currentPage() * this.pageSize(), this.totalItems())
);
```

### Sub-Operation 5: Previous Page Navigation

- **The Logic**: Navigates to the previous page if the current page is greater than 1.
- **State Management & Data Flow**: `onPrev()` method calculates next = currentPage() - 1. If next >= 1, emits the page number through `pageChange` output. Button is disabled when currentPage() === 1 via `[disabled]` binding.
- **Core Code Snippet**:

```typescript
onPrev(): void {
  const next = this.currentPage() - 1;
  if (next >= 1) {
    this.pageChange.emit(next);
  }
}
```

### Sub-Operation 6: Next Page Navigation

- **The Logic**: Navigates to the next page if the current page is less than the total pages.
- **State Management & Data Flow**: `onNext()` method calculates next = currentPage() + 1. If next <= totalPages(), emits the page number through `pageChange` output. Button is disabled when currentPage() === totalPages() via `[disabled]` binding.
- **Core Code Snippet**:

```typescript
onNext(): void {
  const next = this.currentPage() + 1;
  if (next <= this.totalPages()) {
    this.pageChange.emit(next);
  }
}
```

### Sub-Operation 7: Direct Page Selection

- **The Logic**: Allows user to click a numbered page button to navigate directly to that page.
- **State Management & Data Flow**: `onSelect(page)` method checks if the selected page differs from currentPage(). If different, emits the page number via `pageChange` output. Prevents unnecessary emissions if clicking the current page.
- **Core Code Snippet**:

```typescript
onSelect(page: number): void {
  if (page !== this.currentPage()) {
    this.pageChange.emit(page);
  }
}
```

### Sub-Operation 8: Page Size Selection

- **The Logic**: Allows user to change the number of items displayed per page (10, 20, or 50 items).
- **State Management & Data Flow**: `onPageSizeChange()` extracts the selected value from the dropdown (HTML select element), parses it as an integer with default of 10, and emits the new page size via `pageSizeChange` output.
- **Core Code Snippet**:

```typescript
onPageSizeChange(event: Event): void {
  const target = event.target as HTMLSelectElement | null;
  const newSize = parseInt(target?.value ?? '10', 10);
  this.pageSizeChange.emit(newSize);
}
```

### Sub-Operation 9: Pagination Info Display

- **The Logic**: Displays human-readable text showing which items are currently displayed (e.g., "Showing 1-10 of 127 items").
- **State Management & Data Flow**: Template conditionally renders pagination info only if totalItems() > 0. Uses interpolation with computed signals `showingFrom()`, `showingTo()`, and `totalItems()` to display the range.
- **Core Code Snippet**:

```html
@if (totalItems() > 0) {
<div class="pagination-info">
  Showing <span class="pagination-info__count">{{ showingFrom() }}</span>–<span
    class="pagination-info__count"
    >{{ showingTo() }}</span
  >
  of <span class="pagination-info__count">{{ totalItems() }}</span> items
</div>
}
```

### Sub-Operation 10: Page Button Rendering with Active State

- **The Logic**: Renders numbered page buttons for each page from 1 to totalPages, highlighting the current page.
- **State Management & Data Flow**: Uses `@for (page of pages(); track page)` to loop through generated page numbers. Each button has `[class.pagination-btn--active]="page === currentPage()"` to highlight the current page and `[attr.aria-current]="page === currentPage() ? 'page' : null"` for accessibility.
- **Core Code Snippet**:

```html
@for (page of pages(); track page) {
<button
  type="button"
  class="pagination-btn"
  [class.pagination-btn--active]="page === currentPage()"
  [attr.aria-current]="page === currentPage() ? 'page' : null"
  (click)="onSelect(page)"
>
  {{ page }}
</button>
}
```

## 3. Lifecycle & Angular Features (دورة الحياة وأدوات إطار العمل)

- **Standalone Component**: Uses `standalone: true` with CommonModule import.
- **Change Detection Strategy**: Implements `ChangeDetectionStrategy.OnPush` for optimized performance.
- **Input Signals**: Uses `input.required()` for three required reactive inputs.
- **Output Signals**: Uses `output()` API for two event emitters.
- **Computed Signals**: Comprehensively uses `computed()` for derived state (totalPages, pages, showingFrom, showingTo).
- **Control Flow**: Uses new `@if` and `@for` control flow syntax.
- **Event Binding**: Template uses `(click)` for button interactions and `(change)` for select dropdown.
- **Accessibility**: Proper aria-labels, aria-current for active page, semantic nav element.
- **No Lifecycle Hooks**: No OnInit, OnDestroy implementation; all logic reactive.
- **Array Generation**: Uses Array.from() to dynamically generate page buttons without hardcoding.

## 4. Dependencies (الاعتماديات)

### Angular Modules/APIs

- `CommonModule`: For common directives
- `input.required()`: Signal API for required inputs
- `output()`: Signal API for event outputs
- `computed()`: Signal API for derived state
- `ChangeDetectionStrategy.OnPush`: Performance optimization
- `@if` and `@for`: Control flow syntax

### Emitted Events

- `pageChange`: Emits number (new page number)
- `pageSizeChange`: Emits number (new page size)

### No Direct Service Dependencies

- Pure presentation and pagination logic component
- No custom services or external dependencies
- Only uses Angular built-in APIs
