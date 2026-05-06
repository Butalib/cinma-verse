# Component: LayoutComponant

## 1. Main Operation (العملية الرئيسية)

The LayoutComponant is the main orchestration component for user management in the admin dashboard. It serves as a container that manages the complete user lifecycle including displaying a list of users in a table, searching and filtering users, creating new users, editing user permissions, viewing detailed user analytics, and handling pagination. The component integrates multiple child components and manages complex state for filtering, modal dialogs, and API interactions with fallback handling.

## 2. Sub-Operations & Technical Implementation (العمليات الفرعية والتقنيات)

### Sub-Operation 1: User Data Management & Mock Data Initialization

- **The Logic**: Manages the complete collection of users in memory using mock data as a default. Provides foundation for all filtering, searching, and pagination operations. Users can be added, modified, or deleted from this collection.
- **State Management & Data Flow**: Uses `allUsers` signal to store the complete user collection. Initialized with `MOCK_USERS` array containing 12 predefined user records. When users are created, edited, or deleted, the signal is updated using `.update()` method to apply immutable transformations.
- **Core Code Snippet**:

```typescript
readonly allUsers = signal<UsersTableRow[]>(MOCK_USERS);

// Example: Add new user
this.allUsers.update((users) => [newUser, ...users]);

// Example: Update user
this.allUsers.update((items) =>
  items.map((user) =>
    user.id === selected.id ? updatedUser : user
  )
);
```

### Sub-Operation 2: Search Functionality with Real-Time Filtering

- **The Logic**: Accepts search input from the search toolbar and filters users by matching against multiple fields (id, name, contact, city). Changes reset pagination to first page.
- **State Management & Data Flow**: `searchTerm` signal stores the normalized (trimmed, lowercase) search input. The `onSearchChange()` method receives the term from toolbar, updates signal, and resets `currentPage` to 1. The `filteredUsers` computed signal incorporates search logic as first filter condition.
- **Core Code Snippet**:

```typescript
readonly searchTerm = signal('');

onSearchChange(term: string) {
  this.searchTerm.set(term);
  this.currentPage.set(1);
}

// Inside filteredUsers computed:
const term = this.searchTerm().trim().toLowerCase();
if (term) {
  const searchTarget = `${user.id} ${user.name} ${user.contact} ${user.city}`.toLowerCase();
  if (!searchTarget.includes(term)) {
    return false;
  }
}
```

### Sub-Operation 3: Advanced Filtering with Multiple Filter Criteria

- **The Logic**: Allows filtering users by multiple criteria simultaneously: active status, email confirmation status, gender, city, creation date range, and date of birth range. A filter panel component provides the UI for these filters.
- **State Management & Data Flow**: `activeFilters` signal stores the current filter state as a `UsersFilter` object. The `onApplyFilters()` method receives filter object from panel component and updates signal; `onResetFilters()` clears all filters. The `filteredUsers` computed signal applies all filter conditions in sequence (active status, email confirmed, gender, city, date ranges).
- **Core Code Snippet**:

```typescript
readonly activeFilters = signal<UsersFilter>({});

onApplyFilters(filters: UsersFilter) {
  this.activeFilters.set(filters);
  this.currentPage.set(1);
}

// Inside filteredUsers computed - example gender filter:
if (filters.gender) {
  if (user.gender.toLowerCase() !== filters.gender.toLowerCase()) {
    return false;
  }
}
```

### Sub-Operation 4: Combined Search & Filter Result Computation

- **The Logic**: Computes the final filtered user list by combining search term and all active filters. Returns only users that match all criteria.
- **State Management & Data Flow**: `filteredUsers` is a computed signal that evaluates both `searchTerm()` and `activeFilters()` for each user in `allUsers()`. It implements cascade filtering where each criterion must be satisfied. Result is used as source for pagination.
- **Core Code Snippet**:

```typescript
readonly filteredUsers = computed(() => {
  const term = this.searchTerm().trim().toLowerCase();
  const filters = this.activeFilters();

  return this.allUsers().filter((user) => {
    // Search logic...
    // Gender filter logic...
    // City filter logic...
    // Date range filters...
    return true;
  });
});
```

### Sub-Operation 5: Pagination Management with Dynamic Page Sizing

- **The Logic**: Manages pagination of filtered results with configurable page size. Tracks current page number and computes total pages based on filtered count and page size.
- **State Management & Data Flow**: Three signals manage pagination: `pageSize` (default 10), `currentPage` (default 1), and `totalPages` computed from filtered users count. `pagedUsers` is a computed signal that slices filtered results based on current page and page size. `onPageChange()` and `onPageSizeChange()` methods update these signals; page size changes reset to page 1.
- **Core Code Snippet**:

```typescript
readonly pageSize = signal(10);
readonly currentPage = signal(1);

readonly totalPages = computed(() => {
  const pages = Math.ceil(this.filteredUsers().length / this.pageSize());
  return Math.max(pages, 1);
});

readonly pagedUsers = computed(() => {
  const start = (this.currentPage() - 1) * this.pageSize();
  const end = start + this.pageSize();
  return this.filteredUsers().slice(start, end);
});
```

### Sub-Operation 6: User Creation Modal & API Integration with Fallback

- **The Logic**: Opens a modal dialog for creating new users. Accepts user data from modal, attempts API call to create user on backend, and falls back to local add if API fails. Successfully created users prepend to list and reset pagination.
- **State Management & Data Flow**: `isCreateUserModalOpen` signal controls modal visibility. `onCreateUser()` method receives `CreateUserPayload` from modal component and calls `usersApi.createUser()`. On success, updates `allUsers` and closes modal. On error, generates local user with generated ID and adds to `allUsers`.
- **Core Code Snippet**:

```typescript
readonly isCreateUserModalOpen = signal(false);

onCreateUser(payload: CreateUserPayload) {
  this.usersApi.createUser(payload).subscribe({
    next: (created) => {
      this.allUsers.update((users) => [created, ...users]);
      this.currentPage.set(1);
      this.isCreateUserModalOpen.set(false);
    },
    error: (err) => {
      // Fallback: create local user
      const newUser: UsersTableRow = { /* mapped fields */ };
      this.allUsers.update((users) => [newUser, ...users]);
    }
  });
}
```

### Sub-Operation 7: User Edit Modal with Detail Fetching & Data Mapping

- **The Logic**: Opens edit modal for selected user. Fetches full user details from API, maps to edit form structure, and handles mapping errors by falling back to table row data.
- **State Management & Data Flow**: Three signals control edit flow: `isEditUserModalOpen`, `selectedUserDetails` (stores `EditUserDetails`), and `isEditSaving`. `onEditUser()` calls `usersService.getUserById()` with user ID. On success, calls `mapEditDetailsFromApi()` to merge API details with table row data. On error, falls back to `mapEditDetailsFromRow()`. Multiple private mapping methods normalize field names and types from different sources.
- **Core Code Snippet**:

```typescript
readonly isEditUserModalOpen = signal(false);
readonly selectedUserDetails = signal<EditUserDetails | null>(null);

onEditUser(user: UsersTableRow) {
  this.usersService.getUserById(user.id).subscribe({
    next: (details) => {
      this.selectedUserDetails.set(this.mapEditDetailsFromApi(user, details));
      this.isEditUserModalOpen.set(true);
    },
    error: (err) => {
      this.selectedUserDetails.set(this.mapEditDetailsFromRow(user));
      this.isEditUserModalOpen.set(true);
    }
  });
}
```

### Sub-Operation 8: User Edit Persistence with Update API & Local Fallback

- **The Logic**: Saves changes to user permissions. Calls update API, applies changes to local list on success or error, and prevents modal closure during save.
- **State Management & Data Flow**: `isEditSaving` signal tracks save operation state. `onSaveUserChanges()` receives `UpdateUserPayload` from edit modal, calls `usersService.updateUser()`, updates matching user in `allUsers` via `.update()` with `applyEditResult()` transformation, and clears modal state. `closeEditUserModal()` checks `isEditSaving` and prevents closure if saving.
- **Core Code Snippet**:

```typescript
readonly isEditSaving = signal(false);

onSaveUserChanges(payload: UpdateUserPayload) {
  this.isEditSaving.set(true);
  this.usersService.updateUser(selected.id, payload).subscribe({
    next: (updated) => {
      this.allUsers.update((items) =>
        items.map((user) =>
          user.id === selected.id ? this.applyEditResult(user, payload, updated) : user
        )
      );
      this.isEditSaving.set(false);
      this.isEditUserModalOpen.set(false);
    }
  });
}
```

### Sub-Operation 9: User Intelligence Modal (Analytics Viewer)

- **The Logic**: Opens a detailed analytics modal for a selected user. Maps table row data to intelligence-specific formats (selected user info and overview analytics).
- **State Management & Data Flow**: Two signals manage intelligence modal state: `isUserIntelligenceModalOpen` (boolean) and `intelligenceSelectedUser` (UserIntelligenceSelectedUser). A third signal `intelligenceOverview` stores analytics data. `onViewUser()` looks up user by ID, calls `mapUsersTableRowToSelectedUser()` and `mapUsersTableRowToUserOverview()` utility functions, and opens modal. `closeUserIntelligenceModal()` clears all three signals.
- **Core Code Snippet**:

```typescript
readonly isUserIntelligenceModalOpen = signal(false);
readonly intelligenceSelectedUser = signal<UserIntelligenceSelectedUser | null>(null);
readonly intelligenceOverview = signal<UserOverview | null>(null);

onViewUser(userId: string) {
  const row = this.allUsers().find((u) => u.id === userId);
  if (!row) return;
  this.intelligenceSelectedUser.set(mapUsersTableRowToSelectedUser(row));
  this.intelligenceOverview.set(mapUsersTableRowToUserOverview(row));
  this.isUserIntelligenceModalOpen.set(true);
}
```

### Sub-Operation 10: User Deletion & Pagination Adjustment

- **The Logic**: Removes user from list and adjusts pagination if the current page exceeds the new total pages count.
- **State Management & Data Flow**: `onDeleteUser()` filters out the deleted user from `allUsers` via `.update()`. If current page is now beyond total pages, resets `currentPage` to `totalPages()`.
- **Core Code Snippet**:

```typescript
onDeleteUser(userId: string) {
  this.allUsers.update((items) => items.filter((user) => user.id !== userId));
  if (this.currentPage() > this.totalPages()) {
    this.currentPage.set(this.totalPages());
  }
}
```

### Sub-Operation 11: Complex Data Mapping & Normalization Utilities

- **The Logic**: Private helper methods normalize data from different sources (API responses, table rows) to standardized internal formats. Handles null/undefined fields, role normalization (case-insensitive), date parsing, and status conversions.
- **State Management & Data Flow**: Methods like `mapEditDetailsFromApi()`, `mapEditDetailsFromRow()`, `normalizeRole()`, `normalizeIsActive()`, `normalizeEmailConfirmed()`, and `applyEditResult()` transform data between different representations. `parseDateValue()` robustly parses dates with various formats.
- **Core Code Snippet**:

```typescript
private mapEditDetailsFromApi(user: UsersTableRow, details: UserDetailsResponse): EditUserDetails {
  const fallback = this.mapEditDetailsFromRow(user);
  return {
    id: details.id ?? fallback.id,
    fullName: details.fullName ?? details.name ?? fallback.fullName,
    // Additional fields with fallback logic...
  };
}
```

### Sub-Operation 12: ID Generation for New Users

- **The Logic**: Generates the next sequential user ID when creating a new user locally (fallback scenario).
- **State Management & Data Flow**: `generateNextUserId()` finds the maximum numeric ID in current users, increments by 1, and returns formatted ID string (USR-XXXX).
- **Core Code Snippet**:

```typescript
private generateNextUserId(): string {
  const maxId = this.allUsers().reduce((max, user) => {
    const value = Number(user.id.replace('USR-', ''));
    return Number.isNaN(value) ? max : Math.max(max, value);
  }, 1000);
  return `USR-${String(maxId + 1)}`;
}
```

## 3. Lifecycle & Angular Features (دورة الحياة وأدوات إطار العمل)

- **Standalone Component**: Uses `standalone: true` with explicit imports for all child components and modules.
- **Change Detection Strategy**: Does NOT explicitly set OnPush (uses default change detection).
- **Signal-Based State Management**: Comprehensively uses Angular signals:
  - `signal()` for mutable state (pageSize, filters, modal states, user data)
  - `computed()` for derived state (filteredUsers, totalPages, pagedUsers, isWideTab)
  - `.update()` and `.set()` for state mutations
- **RxJS Observables**: Subscribes to HTTP service observables from `UsersApiService` and `UsersService` for API interactions.
- **Control Flow**: Uses `@if` and `@switch` control flow syntax for conditional rendering of modals and tab content.
- **Event Handling**: Template event bindings for toolbar search, filter panel, table actions, pagination controls.
- **No Explicit Lifecycle Hooks**: No implementation of OnInit, OnDestroy; subscriptions not unsubscribed (memory leak potential for long-lived component).
- **Components Used**: Imports and composes 8 child components (KPI, toolbar, filter panel, table, pagination, and 3 modal components).

## 4. Dependencies (الاعتماديات)

### Injected Services

- `UsersApiService`: Handles API calls for user creation; injectable via `inject()`
- `UsersService`: Handles API calls for fetching user details and updating user information; injectable via `inject()`

### Child Components

- `UserKpiComponent`: Displays key performance indicators/metrics
- `UsersSearchToolbarComponent`: Provides search input UI and add user button
- `UsersFilterPanelComponent`: Provides advanced filtering UI with multiple criteria
- `UsersTableComponent`: Displays paginated user list with view/edit/delete actions
- `PaginationComponent`: Provides pagination controls (page navigation, page size selection)
- `CreateUserModalComponent`: Modal dialog for creating new users
- `EditUserModalComponent`: Modal dialog for editing user permissions
- `UserIntelligenceModalComponent`: Modal dialog for viewing detailed user analytics

### Angular Modules/APIs

- `CommonModule`: For common directives
- `signal()`, `computed()`, `effect()`: Signal API for state management
- `inject()`: Dependency injection function
- Observables/RxJS: `.subscribe()` for API call handling

### Imported Types & Interfaces

- `UsersTableRow`: Type for user list rows with all table-displayed fields
- `UsersFilter`: Interface for filter criteria from filter panel
- `CreateUserPayload`: Interface for new user creation data
- `UpdateUserPayload`: Interface for user edit submission data
- `EditUserDetails`: Interface for user details in edit modal
- `UserDetailsResponse`: API response type for fetched user details
- `UserIntelligenceSelectedUser`: Type for intelligence modal user data
- `UserOverview`: Type for intelligence modal analytics data

### Utility Functions

- `mapUsersTableRowToSelectedUser()`: Maps table row to intelligence user format
- `mapUsersTableRowToUserOverview()`: Maps table row to intelligence overview format
- `MOCK_USER_OVERVIEW`: Default/fallback overview data constant
- `MOCK_USERS`: Array of 12 default user records for initialization

### External Dependencies

- No direct external library dependencies beyond Angular framework
