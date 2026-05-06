# Component: UserIntelligenceModal

## 1. Main Operation (العملية الرئيسية)

The UserIntelligenceModalComponent is a comprehensive modal dialog that displays detailed user intelligence and analytics within the admin dashboard. It presents a two-panel layout: a sidebar containing user profile information and a main panel with tabbed content (overview, bookings, tickets, payments). The component manages tab navigation, conditionally displays different child components based on the active tab, and handles modal dismissal through backdrop clicks or close button interactions.

## 2. Sub-Operations & Technical Implementation (العمليات الفرعية والتقنيات)

### Sub-Operation 1: Tab Management with Signal State

- **The Logic**: Manages the currently active tab across four possible states (overview, bookings, tickets, payments) and controls which content is displayed. Automatically resets to overview tab when a new user is selected.
- **State Management & Data Flow**: Uses Angular signal `activeTab` to store current tab state. The signal is initialized to 'overview'. An effect watches the `selectedUser()` input signal and resets `activeTab` to 'overview' whenever the user changes. Tab switching is triggered via `setActiveTab()` method which updates the signal.
- **Core Code Snippet**:

```typescript
readonly activeTab = signal<UserIntelligenceTab>('overview');

constructor() {
  effect(() => {
    if (this.selectedUser()) {
      this.activeTab.set('overview');
    }
  });
}

setActiveTab(tab: UserIntelligenceTab): void {
  this.activeTab.set(tab);
}
```

### Sub-Operation 2: Responsive Modal Sizing Based on Tab Context

- **The Logic**: Dynamically adjusts the modal container width based on the active tab. Wider tabs (bookings, tickets, payments) expand the modal to accommodate wider content, while overview remains at standard width.
- **State Management & Data Flow**: Uses Angular `computed()` signal to derive a boolean flag `isWideTab` that checks if the active tab is one of the data-intensive tabs. This computed value is bound to a host class binding `[class.modal-wide]` that applies CSS width adjustments via the `:host.modal-wide` selector.
- **Core Code Snippet**:

```typescript
readonly isWideTab = computed(() => ['bookings', 'tickets', 'payments'].includes(this.activeTab()));

host: {
  '[class.modal-wide]': 'isWideTab()',
}
```

### Sub-Operation 3: User Data Display via Input Signal

- **The Logic**: Receives and displays user information through a reactive input signal. The component also supports an optional overview data override for displaying specific user analytics.
- **State Management & Data Flow**: Uses Angular `input()` API to declare two signals: `selectedUser` (UserIntelligenceSelectedUser object, defaults to null) and `overviewOverride` (UserOverview object, defaults to null). These are accessed via function-call syntax in templates and computed values. A third computed signal `resolvedOverview` provides fallback logic: uses the override if provided, otherwise defaults to mock data (MOCK_USER_OVERVIEW).
- **Core Code Snippet**:

```typescript
readonly selectedUser = input<UserIntelligenceSelectedUser | null>(null);
readonly overviewOverride = input<UserOverview | null>(null);
readonly resolvedOverview = computed(() => this.overviewOverride() ?? MOCK_USER_OVERVIEW);
```

### Sub-Operation 4: Conditional Content Rendering via Switch Control Flow

- **The Logic**: Renders different child components based on the active tab using Angular's switch control flow. Each case corresponds to a tab and displays the appropriate component with relevant data.
- **State Management & Data Flow**: Uses `@switch (activeTab())` control flow in the template to conditionally render components:
  - 'overview' case: renders `UserOverviewComponent` with resolved overview data
  - 'bookings', 'tickets', 'payments' cases: render respective components passing the selected user signal and exposing a `closeRequested` output event
- **Core Code Snippet**:

```html
@switch (activeTab()) { @case ('overview') {
<app-user-overview [overview]="resolvedOverview()" />
} @case ('bookings') {
<app-user-bookings [user]="selectedUser()" (closeRequested)="onCloseClick()" />
} @case ('tickets') {
<app-user-tickets [user]="selectedUser()" (closeRequested)="onCloseClick()" />
} @case ('payments') {
<app-user-payments [user]="selectedUser()" (closeRequested)="onCloseClick()" />
} }
```

### Sub-Operation 5: Modal Dismissal with Backdrop Detection

- **The Logic**: Closes the modal via backdrop click (clicking outside the modal content) or via the close button in the header. Uses event target comparison to distinguish between backdrop clicks and accidental content clicks.
- **State Management & Data Flow**: Two methods emit through the `backdropDismiss` output:
  - `onBackdropClick(event)`: Only emits if the click target is the backdrop element itself (prevents closure on child element clicks)
  - `onCloseClick()`: Always emits when the close button is clicked or when child components request closure
- **Core Code Snippet**:

```typescript
onBackdropClick(event: MouseEvent): void {
  if (event.target === event.currentTarget) {
    this.backdropDismiss.emit();
  }
}

onCloseClick(): void {
  this.backdropDismiss.emit();
}
```

### Sub-Operation 6: Header Component Integration

- **The Logic**: The UserIntelligenceHeaderComponent is integrated to display the active tab and provide tab navigation buttons. It communicates tab changes back to the parent via event emitters.
- **State Management & Data Flow**: Header component receives the `activeTab()` signal via property binding. It emits `tabChange` events when user clicks a tab button, which are captured by `setActiveTab($event)` handler. It also emits `closeClick` events which are handled by the modal's `onCloseClick()` method.
- **Core Code Snippet**:

```html
<app-user-intelligence-header
  [activeTab]="activeTab()"
  (tabChange)="setActiveTab($event)"
  (closeClick)="onCloseClick()"
/>
```

## 3. Lifecycle & Angular Features (دورة الحياة وأدوات إطار العمل)

- **Standalone Component**: Uses `standalone: true` configuration with explicit imports for all child components.
- **Change Detection Strategy**: Implements `ChangeDetectionStrategy.OnPush` for optimized performance.
- **Signal-Based Reactivity**: Uses Angular signals API comprehensively:
  - `signal()` for mutable state (activeTab)
  - `input()` for reactive component inputs
  - `computed()` for derived state (isWideTab, resolvedOverview)
  - `effect()` for reactive side-effects (tab reset on user change)
- **Control Flow Syntax**: Uses `@switch/@case` control flow for conditional rendering instead of ngSwitch.
- **Child Component Composition**: Imports and uses five child components (UserProfileCardComponent, UserIntelligenceHeaderComponent, UserOverviewComponent, UserBookingsComponent, UserTicketsComponent, UserPaymentsComponent).
- **Host Binding**: Uses `host` metadata to dynamically bind CSS classes based on computed signals.
- **Type Exports**: Re-exports types (`UserIntelligenceTab`, `UserIntelligenceSelectedUser`) for use in consuming components.
- **No Lifecycle Hooks**: No implementation of OnInit, OnDestroy, or other traditional lifecycle hooks; all initialization and reactivity handled via signals and effects.

## 4. Dependencies (الاعتماديات)

### Child Components

- `UserProfileCardComponent`: Displays user profile information in sidebar
- `UserIntelligenceHeaderComponent`: Renders tab navigation and close button
- `UserOverviewComponent`: Displays user overview/analytics data
- `UserBookingsComponent`: Shows user booking history
- `UserTicketsComponent`: Shows user tickets/events
- `UserPaymentsComponent`: Shows user payment history

### Angular APIs & Modules

- `CommonModule`: For common Angular directives
- `signal()`: For mutable state management
- `input()`: For reactive component inputs
- `computed()`: For derived reactive values
- `effect()`: For reactive side-effects
- `output()`: For emitting events to parent components

### Imported Models & Types

- `UserIntelligenceTab`: Type union for tab names ('overview' | 'bookings' | 'tickets' | 'payments')
- `UserIntelligenceSelectedUser`: Interface for user data passed via input signal
- `UserOverview`: Type for overview data from user-overview model
- `MOCK_USER_OVERVIEW`: Default/fallback data constant when no override is provided

### No Direct Service Dependencies

- Does not inject any custom services; uses child component composition and signal-based state management
- Uses mock data for overview content when not overridden

### Exported Types

- `UserIntelligenceTab`: Re-exported from user-intelligence.types
- `UserIntelligenceSelectedUser`: Re-exported from user-intelligence.types
