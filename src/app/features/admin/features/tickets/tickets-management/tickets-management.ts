import { Component, computed, inject, signal } from '@angular/core';
import { TicketsTableRow, QrTicketResult, TicketsFilter } from '../models/ticket.models';
import { TicketsApiService } from '../services/tickets-api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketsTableComponent } from './components/tickets-table/tickets-table.component';
import { TicketsFilterBarComponent } from './components/tickets-filter-bar/tickets-filter-bar.component';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';
import {
  TicketViewModalComponent,
  TicketViewData,
} from './components/ticket-view-modal/ticket-view-modal.component';
import { TicketCheckInModalComponent } from './components/ticket-check-in-modal/ticket-check-in-modal.component';
import { AdminTicketListItemDto } from '../../../admin-api.models';

@Component({
  selector: 'app-tickets-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TicketsTableComponent,
    TicketsFilterBarComponent,
    PaginationComponent,
    TicketViewModalComponent,
    TicketCheckInModalComponent,
  ],
  templateUrl: './tickets-management.html',
  styleUrl: './tickets-management.css',
})
export class TicketsManagementComponent {
  private readonly ticketsApi = inject(TicketsApiService);

  readonly pageSize = signal(10);
  readonly currentPage = signal(1);
  readonly activeFilters = signal<TicketsFilter>({});
  readonly allTickets = signal<TicketsTableRow[]>([]);
  readonly selectedTicket = signal<TicketViewData | null>(null);
  readonly isFilterOpen = signal(false);
  readonly searchQuery = signal('');
  readonly isCheckInModalOpen = signal(false);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly kpiTotalTickets = computed(() => this.allTickets().length.toLocaleString());
  readonly kpiActiveTickets = computed(() =>
    this.allTickets()
      .filter((t) => t.status === 'ACTIVE')
      .length.toLocaleString(),
  );
  readonly kpiUsedTickets = computed(() =>
    this.allTickets()
      .filter((t) => t.status === 'USED')
      .length.toLocaleString(),
  );
  readonly kpiTotalRevenue = computed(() => {
    const total = this.allTickets().reduce((sum, t) => {
      const price = parseFloat(t.price.replace('$', '').replace(',', ''));
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
    return (
      '$' + total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  });

  readonly filteredTickets = computed(() => {
    const filters = this.activeFilters();
    const query = this.searchQuery().toLowerCase().trim();
    return this.allTickets().filter((ticket) => {
      if (query) {
        const haystack = [
          ticket.id,
          ticket.ticketNumber,
          ticket.movie,
          ticket.customerName,
          ticket.branch,
          ticket.status,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      if (filters.status && ticket.status !== filters.status) return false;
      if (
        filters.bookingId &&
        !ticket.ticketNumber.toLowerCase().includes(filters.bookingId.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.ticketNo &&
        !ticket.ticketNumber.toLowerCase().includes(filters.ticketNo.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(Math.ceil(this.filteredTickets().length / this.pageSize()), 1),
  );

  readonly pagedTickets = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredTickets().slice(start, start + this.pageSize());
  });

  constructor() {
    this.loadTicketsFromApi();
  }

  onApplyFilters(filters: TicketsFilter): void {
    this.activeFilters.set(filters);
    this.currentPage.set(1);
  }

  onResetFilters(): void {
    this.activeFilters.set({});
    this.currentPage.set(1);
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  toggleFilter(): void {
    this.isFilterOpen.update((v) => !v);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  onViewTicket(id: string): void {
    const row = this.allTickets().find((t) => t.id === id);
    if (row) {
      this.selectedTicket.set(this.mapToViewData(row));
    }
  }

  closeViewModal(): void {
    this.selectedTicket.set(null);
  }

  private mapToViewData(row: TicketsTableRow): TicketViewData {
    return {
      id: row.id,
      ticketNumber: row.ticketNumber,
      movie: row.movie,
      showtime: row.showtime,
      location: `${row.branch}, Hall 04`,
      format: 'TwoD',
      seat: 'G12',
      rating: 'PG-13',
      duration: '142 min',
      price: row.price,
      bookingId: '#' + Math.floor(90000 + Math.random() * 9999),
      bookingStatus: row.status === 'CANCELLED' ? 'CANCELLED' : 'PENDING',
      ticketStatus: row.status,
      customerName: row.customerName,
      customerInitials: row.customerInitials,
      userId: '#' + Math.floor(1000 + Math.random() * 8999),
      email: `${row.customerName.toLowerCase().replace(' ', '.')}@example.com`,
      checkInStatus: row.status === 'USED' ? 'CHECKED_IN' : 'NOT_USED',
    };
  }

  onDeleteTicket(id: string): void {
    const numericId = this.extractNumericId(id);
    if (!numericId) {
      return;
    }

    this.ticketsApi.deleteTicket(numericId).subscribe({
      next: () => this.loadTicketsFromApi(),
      error: (err) => {
        console.error('Delete ticket API failed', err);
      },
    });
  }

  onExportCsv(): void {
    console.log('Export CSV');
  }

  onQuickCheckIn(): void {
    this.isCheckInModalOpen.set(true);
  }

  onCheckInModalClose(): void {
    this.isCheckInModalOpen.set(false);
  }

  onCheckInConfirmed(_: QrTicketResult): void {
    this.isCheckInModalOpen.set(false);
    this.loadTicketsFromApi();
  }

  private loadTicketsFromApi(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.ticketsApi.getTickets({ page: 1, pageSize: 100 }).subscribe({
      next: (response) => {
        const items = (response.items ?? response.data ?? response.results ?? []).map(
          (item, index) => this.mapApiTicket(item, index),
        );

        this.allTickets.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set('Failed to load tickets from API.');
        console.error('Failed to load tickets from API', err);
      },
    });
  }

  private mapApiTicket(item: AdminTicketListItemDto, index: number): TicketsTableRow {
    const ticketId = item.ticketId ?? index + 1;
    const customerName = item.userFullName?.trim() || 'Unknown User';
    const customerInitials = this.getInitials(customerName);

    return {
      id: `#T-${ticketId}`,
      ticketNumber: item.ticketNumber ?? `CV-TK-${String(10000 + ticketId).slice(-5)}`,
      movie: item.movieName ?? 'Unknown movie',
      showtime: this.formatShowtime(item.showStartTime),
      price: `$${Number(item.price ?? 0).toFixed(2)}`,
      branch: item.branchName ?? 'â€”',
      customerInitials,
      customerName,
      status: this.mapStatus(item.status),
    };
  }

  private formatShowtime(value?: string): string {
    if (!value) {
      return 'â€”';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'â€”';
    }

    return date.toLocaleString([], {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private mapStatus(status?: string): TicketsTableRow['status'] {
    const normalized = (status ?? '').toLowerCase();

    if (normalized === 'used') {
      return 'USED';
    }

    if (normalized === 'cancelled' || normalized === 'canceled') {
      return 'CANCELLED';
    }

    return 'ACTIVE';
  }

  private getInitials(name: string): string {
    const parts = name
      .split(' ')
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      return 'NA';
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  private extractNumericId(value: string): number | null {
    const match = value.match(/\d+/);
    if (!match) {
      return null;
    }

    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
