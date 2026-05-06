import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { UserIntelligenceTab, UserIntelligenceSelectedUser } from './user-intelligence.types';
import { UserProfileCardComponent } from './user-profile-card/user-profile-card.component';
import { UserIntelligenceHeaderComponent } from './user-intelligence-header/user-intelligence-header.component';
import { UserOverviewComponent } from './user-overview/user-overview.component';
import { UserBookingsComponent } from './user-bookings/user-bookings.component';
import { UserTicketsComponent } from './user-tickets/user-tickets.component';
import { UserPaymentsComponent } from './user-payments/user-payments.component';
import { MOCK_USER_OVERVIEW, type UserOverview } from './user-overview/user-overview.model';

export type { UserIntelligenceTab, UserIntelligenceSelectedUser } from './user-intelligence.types';

@Component({
  selector: 'app-user-intelligence-modal',
  standalone: true,
  imports: [
    CommonModule,
    UserProfileCardComponent,
    UserIntelligenceHeaderComponent,
    UserOverviewComponent,
    UserBookingsComponent,
    UserTicketsComponent,
    UserPaymentsComponent,
  ],
  templateUrl: './user-intelligence-modal.component.html',
  styleUrl: './user-intelligence-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.modal-wide]': 'isWideTab()',
  },
})
export class UserIntelligenceModalComponent {
  readonly activeTab = signal<UserIntelligenceTab>('overview');

  readonly selectedUser = input<UserIntelligenceSelectedUser | null>(null);

  /** When set (e.g. from users table), overview tab reflects this row; otherwise mock Jane Doe. */
  readonly overviewOverride = input<UserOverview | null>(null);

  readonly resolvedOverview = computed(() => this.overviewOverride() ?? MOCK_USER_OVERVIEW);

  readonly isWideTab = computed(() => ['bookings', 'tickets', 'payments'].includes(this.activeTab()));

  readonly backdropDismiss = output<void>();

  constructor() {
    effect(() => {
      if (this.selectedUser()) {
        this.activeTab.set('overview');
      }
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.backdropDismiss.emit();
    }
  }

  onCloseClick(): void {
    this.backdropDismiss.emit();
  }

  setActiveTab(tab: UserIntelligenceTab): void {
    this.activeTab.set(tab);
  }
}
