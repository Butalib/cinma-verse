import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { UserOverview } from '../user-overview/user-overview.model';

@Component({
  selector: 'app-user-id-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-detail-panel">
      <header class="user-detail-panel__head">
        <div class="user-detail-panel__icon" aria-hidden="true">🪪</div>
        <h3 class="user-detail-panel__title">User Identifier</h3>
        <p class="user-detail-panel__subtitle">System-generated unique ID</p>
      </header>
      <div class="user-detail-panel__grid">
        <div>
          <span class="user-detail-panel__label">User id</span>
          <span class="user-detail-panel__value user-detail-panel__value--mono user-detail-panel__value--cyan">{{ data().id }}</span>
        </div>
        <div>
          <span class="user-detail-panel__label">Member since</span>
          <span class="user-detail-panel__value">{{ data().accountInfo.createdAt }}</span>
        </div>
        <div>
          <span class="user-detail-panel__label">Internal slug</span>
          <span class="user-detail-panel__value user-detail-panel__value--mono user-detail-panel__value--muted">{{ data().internalSlug ?? '/api/admin/users/jane-doe' }}</span>
        </div>
        <div>
          <span class="user-detail-panel__label">Profile type</span>
          <span class="user-detail-panel__value">{{ data().role }} Account</span>
        </div>
      </div>
    </div>
  `,
  styleUrl: './user-detail-views.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserIdDetailComponent {
  readonly data = input.required<UserOverview>();
}

@Component({
  selector: 'app-account-status-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-detail-panel">
      <header class="user-detail-panel__head">
        <div class="user-detail-panel__icon" aria-hidden="true">🔒</div>
        <h3 class="user-detail-panel__title">Account Status</h3>
        <p class="user-detail-panel__subtitle">Access control and account state</p>
      </header>
      <div class="user-detail-panel__grid">
        <div>
          <span class="user-detail-panel__label">Current status</span>
          <span
            class="user-detail-panel__value"
            [class.user-detail-panel__value--green]="data().accountStatus === 'Active'"
            [class.user-detail-panel__value--red]="data().accountStatus === 'Suspended'"
            [class.user-detail-panel__value--muted]="data().accountStatus === 'Pending'"
          >
            ● {{ data().accountStatus }}
          </span>
        </div>
        <div>
          <span class="user-detail-panel__label">Last login</span>
          <span class="user-detail-panel__value">24 Mar 2024, 09:41</span>
        </div>
        <div>
          <span class="user-detail-panel__label">Failed login attempts</span>
          <span class="user-detail-panel__value">0</span>
        </div>
        <div>
          <span class="user-detail-panel__label">Suspension history</span>
          <span class="user-detail-panel__value">Never suspended</span>
        </div>
        <div class="user-detail-panel__item--full">
          <span class="user-detail-panel__label">Permissions</span>
          <div class="user-detail-panel__tags">
            <span class="user-detail-panel__tag">read:users</span>
            <span class="user-detail-panel__tag">write:bookings</span>
            <span class="user-detail-panel__tag">read:payments</span>
            <span class="user-detail-panel__tag user-detail-panel__tag--accent">admin:full</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './user-detail-views.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountStatusDetailComponent {
  readonly data = input.required<UserOverview>();
}

@Component({
  selector: 'app-role-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-detail-panel">
      <header class="user-detail-panel__head">
        <div class="user-detail-panel__icon" aria-hidden="true">👑</div>
        <h3 class="user-detail-panel__title">Role & Permissions</h3>
        <p class="user-detail-panel__subtitle">Access level and capabilities</p>
      </header>
      <div class="user-detail-panel__grid">
        <div>
          <span class="user-detail-panel__label">Assigned role</span>
          <span class="user-detail-panel__value user-detail-panel__value--cyan">{{ data().role }}</span>
        </div>
        <div>
          <span class="user-detail-panel__label">Role level</span>
          <span class="user-detail-panel__value">Level 3 — Full Access</span>
        </div>
        <div class="user-detail-panel__item--full">
          <span class="user-detail-panel__label">Capabilities</span>
          <div class="user-detail-panel__rows">
            @for (row of capRows; track row.name) {
              <div class="user-detail-panel__cap-row">
                <span
                  class="user-detail-panel__cap-dot"
                  [class.user-detail-panel__cap-dot--ok]="row.allowed"
                  [class.user-detail-panel__cap-dot--no]="!row.allowed"
                ></span>
                <span class="user-detail-panel__cap-name">{{ row.name }}</span>
                <span
                  class="user-detail-panel__cap-state"
                  [class.user-detail-panel__cap-state--ok]="row.allowed"
                  [class.user-detail-panel__cap-state--no]="!row.allowed"
                >
                  {{ row.allowed ? 'Allowed' : 'Denied' }}
                </span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './user-detail-views.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleDetailComponent {
  readonly data = input.required<UserOverview>();

  readonly capRows = [
    { name: 'Manage Users', allowed: true },
    { name: 'View Payments', allowed: true },
    { name: 'Edit Showtimes', allowed: true },
    { name: 'Delete Records', allowed: true },
    { name: 'Export Reports', allowed: true },
    { name: 'System Settings', allowed: false },
  ] as const;
}

@Component({
  selector: 'app-email-confirmed-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-detail-panel">
      <header class="user-detail-panel__head">
        <div class="user-detail-panel__icon" aria-hidden="true">✉️</div>
        <h3 class="user-detail-panel__title">Email Verification</h3>
        <p class="user-detail-panel__subtitle">Email identity and verification status</p>
      </header>
      <div class="user-detail-panel__grid">
        <div>
          <span class="user-detail-panel__label">Email address</span>
          <span class="user-detail-panel__value user-detail-panel__value--mono">{{ data().basicInfo.email }}</span>
        </div>
        <div>
          <span class="user-detail-panel__label">Verified</span>
          @if (data().emailConfirmed) {
            <span class="user-detail-panel__value user-detail-panel__value--green">✓ Confirmed</span>
          } @else {
            <span class="user-detail-panel__value user-detail-panel__value--red">Not verified</span>
          }
        </div>
        <div>
          <span class="user-detail-panel__label">Verified on</span>
          <span class="user-detail-panel__value">Oct 12, 2023</span>
        </div>
        <div>
          <span class="user-detail-panel__label">Method</span>
          <span class="user-detail-panel__value">Email link</span>
        </div>
        <div>
          <span class="user-detail-panel__label">2FA enabled</span>
          <span class="user-detail-panel__value user-detail-panel__value--red">Not Enabled</span>
        </div>
        <div>
          <span class="user-detail-panel__label">Last email sent</span>
          <span class="user-detail-panel__value">22 Mar 2024</span>
        </div>
      </div>
    </div>
  `,
  styleUrl: './user-detail-views.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailConfirmedDetailComponent {
  readonly data = input.required<UserOverview>();
}
