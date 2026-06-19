import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { UserIntelligenceSelectedUser } from '../user-intelligence.types';
import { PaginationComponent } from '../../users-managemen/componants/pagination/pagination.component';

export interface UserTicketRow {
  id: string;
  ticketId: string;
  ticketNumber: string;
  movieTitle: string;
  showtime: string;
  showtimeId: string;
  bookingIdRef: string;
  seat: string;
  hall: string;
  branch: string;
  amount: number;
  status: 'active' | 'used' | 'cancelled';
}

@Component({
  selector: 'app-user-tickets',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  templateUrl: './user-tickets.component.html',
  styleUrl: './user-tickets.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserTicketsComponent {
  readonly user = input<UserIntelligenceSelectedUser | null>(null);
  readonly itemsOverride = input<UserTicketRow[] | null>(null);

  readonly closeRequested = output<void>();
  readonly exportCsvRequested = output<void>();

  readonly allItems = computed(() => this.itemsOverride() ?? []);

  readonly searchPlaceholder = 'Search by Ticket Number or Movie Name...';
  readonly itemLabel = 'tickets';
  readonly columnCount = 10;

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
