import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { UserIntelligenceTab, UserIntelligenceSelectedUser } from './user-intelligence.types';
import { UserProfileCardComponent } from './user-profile-card/user-profile-card.component';
import { UserIntelligenceHeaderComponent } from './user-intelligence-header/user-intelligence-header.component';
import { UserOverviewComponent } from './user-overview/user-overview.component';
import { UserBookingsComponent } from './user-bookings/user-bookings.component';
import { UserTicketsComponent } from './user-tickets/user-tickets.component';
import { UserPaymentsComponent } from './user-payments/user-payments.component';
import type { UserOverview } from './user-overview/user-overview.model';
import type { UserBookingRow } from './user-bookings/user-bookings.component';
import type { UserTicketRow } from './user-tickets/user-tickets.component';
import type { UserPaymentRow } from './user-payments/user-payments.component';

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

  readonly overviewOverride = input<UserOverview | null>(null);
  readonly bookingsOverride = input<UserBookingRow[] | null>(null);
  readonly ticketsOverride = input<UserTicketRow[] | null>(null);
  readonly paymentsOverride = input<UserPaymentRow[] | null>(null);

  readonly resolvedOverview = computed(() => this.overviewOverride());

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
