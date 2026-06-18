import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { UserIntelligenceSelectedUser } from '../user-intelligence.types';
import { PaginationComponent } from '../../users-managemen/componants/pagination/pagination.component';
import { MOCK_PAYMENTS, type UserPaymentRow } from './user-payments.mock';

@Component({
  selector: 'app-user-payments',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  templateUrl: './user-payments.component.html',
  styleUrl: './user-payments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserPaymentsComponent {
  readonly user = input<UserIntelligenceSelectedUser | null>(null);
  readonly itemsOverride = input<UserPaymentRow[] | null>(null);

  readonly closeRequested = output<void>();
  readonly exportCsvRequested = output<void>();

  readonly allItems = computed(() => this.itemsOverride() ?? MOCK_PAYMENTS);

  readonly searchPlaceholder = 'Search by Payment ID or Booking ID...';
  readonly itemLabel = 'payments';
  readonly columnCount = 6;

  readonly searchTerm = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = 5;

  readonly filteredItems = computed(() => {
    const s = this.searchTerm().toLowerCase().trim();
    if (!s) {
      return this.allItems();
    }
    return this.allItems().filter((item) =>
      Object.values(item).some((v) => typeof v === 'string' && v.toLowerCase().includes(s)),
    );
  });

  readonly pagedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredItems().slice(start, start + this.pageSize);
  });

  constructor() {
    effect(() => {
      this.searchTerm();
      untracked(() => this.currentPage.set(1));
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }
}
