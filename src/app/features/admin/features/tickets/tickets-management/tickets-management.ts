import { Component, computed, signal } from '@angular/core';
import { TicketsTableRow, QrTicketResult, TicketsFilter } from '../models/ticket.models';
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

const MOCK_TICKETS: TicketsTableRow[] = [
  {
    id: '#T-1042',
    ticketNumber: 'CV-TK-88291',
    movie: 'Dune: Part Two',
    showtime: 'Apr 12, 2026 • 7:30 PM',
    price: '$18.50',
    branch: 'Downtown Plaza',
    customerInitials: 'MK',
    customerName: 'Marcus Kane',
    status: 'ACTIVE',
  },
  {
    id: '#T-1043',
    ticketNumber: 'CV-TK-99102',
    movie: 'Civil War',
    showtime: 'Apr 13, 2026 • 9:15 PM',
    price: '$15.00',
    branch: 'Westside Mall',
    customerInitials: 'SJ',
    customerName: 'Sarah Jenkins',
    status: 'USED',
  },
  {
    id: '#T-1044',
    ticketNumber: 'CV-TK-77213',
    movie: 'The Batman',
    showtime: 'Apr 12, 2026 • 10:45 PM',
    price: '$22.00',
    branch: 'IMAX Theater',
    customerInitials: 'DR',
    customerName: 'David Ross',
    status: 'CANCELLED',
  },
  {
    id: '#T-1045',
    ticketNumber: 'CV-TK-66129',
    movie: 'Challengers',
    showtime: 'Apr 14, 2026 • 6:00 PM',
    price: '$16.50',
    branch: 'Downtown Plaza',
    customerInitials: 'EL',
    customerName: 'Emily Long',
    status: 'ACTIVE',
  },
  {
    id: '#T-1046',
    ticketNumber: 'CV-TK-33441',
    movie: 'Kingdom of the Planet of the Apes',
    showtime: 'Apr 15, 2026 • 8:45 PM',
    price: '$19.00',
    branch: 'Eastwood Center',
    customerInitials: 'TA',
    customerName: 'Tom Atkins',
    status: 'ACTIVE',
  },
  {
    id: '#T-1047',
    ticketNumber: 'CV-TK-55019',
    movie: 'Oppenheimer',
    showtime: 'Apr 16, 2026 • 5:00 PM',
    price: '$24.00',
    branch: 'IMAX Theater',
    customerInitials: 'LW',
    customerName: 'Laura White',
    status: 'USED',
  },
  {
    id: '#T-1048',
    ticketNumber: 'CV-TK-44382',
    movie: 'Barbie',
    showtime: 'Apr 17, 2026 • 3:30 PM',
    price: '$14.00',
    branch: 'Westside Mall',
    customerInitials: 'HB',
    customerName: 'Hannah Brown',
    status: 'ACTIVE',
  },
  {
    id: '#T-1049',
    ticketNumber: 'CV-TK-22174',
    movie: 'Poor Things',
    showtime: 'Apr 18, 2026 • 8:00 PM',
    price: '$17.50',
    branch: 'Downtown Plaza',
    customerInitials: 'RN',
    customerName: 'Ryan Nash',
    status: 'CANCELLED',
  },
  {
    id: '#T-1050',
    ticketNumber: 'CV-TK-11920',
    movie: 'Dune: Part Two',
    showtime: 'Apr 19, 2026 • 7:00 PM',
    price: '$18.50',
    branch: 'Eastwood Center',
    customerInitials: 'AM',
    customerName: 'Ava Mitchell',
    status: 'ACTIVE',
  },
  {
    id: '#T-1051',
    ticketNumber: 'CV-TK-10833',
    movie: 'Godzilla x Kong',
    showtime: 'Apr 20, 2026 • 9:00 PM',
    price: '$21.00',
    branch: 'IMAX Theater',
    customerInitials: 'JC',
    customerName: 'James Carter',
    status: 'USED',
  },
  {
    id: '#T-1052',
    ticketNumber: 'CV-TK-09761',
    movie: 'Civil War',
    showtime: 'Apr 21, 2026 • 4:15 PM',
    price: '$15.00',
    branch: 'Westside Mall',
    customerInitials: 'NO',
    customerName: 'Nadia Omar',
    status: 'ACTIVE',
  },
  {
    id: '#T-1053',
    ticketNumber: 'CV-TK-08540',
    movie: 'The Beekeeper',
    showtime: 'Apr 22, 2026 • 6:45 PM',
    price: '$13.50',
    branch: 'Downtown Plaza',
    customerInitials: 'KP',
    customerName: 'Karim Patel',
    status: 'CANCELLED',
  },
];

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
  readonly pageSize = signal(10);
  readonly currentPage = signal(1);
  readonly activeFilters = signal<TicketsFilter>({});
  readonly allTickets = signal<TicketsTableRow[]>(MOCK_TICKETS);
  readonly selectedTicket = signal<TicketViewData | null>(null);
  readonly isFilterOpen = signal(false);
  readonly searchQuery = signal('');
  readonly isCheckInModalOpen = signal(false);

  // ── KPI computeds ─────────────────────────────────
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
      // Global search
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
      // Panel filters
      if (filters.status && ticket.status !== filters.status) return false;
      if (
        filters.bookingId &&
        !ticket.ticketNumber.toLowerCase().includes(filters.bookingId.toLowerCase())
      )
        return false;
      if (
        filters.ticketNo &&
        !ticket.ticketNumber.toLowerCase().includes(filters.ticketNo.toLowerCase())
      )
        return false;
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
    this.allTickets.update((items) => items.filter((t) => t.id !== id));
    if (this.currentPage() > this.totalPages()) {
      this.currentPage.set(this.totalPages());
    }
  }

  onExportCsv(): void {
    console.log('Export CSV');
  }

  /**
   * Open the Quick Check-In modal
   * Allows staff to check in tickets without navigating away from the management page
   */
  onQuickCheckIn(): void {
    this.isCheckInModalOpen.set(true);
  }

  /**
   * Handle check-in modal close
   */
  onCheckInModalClose(): void {
    this.isCheckInModalOpen.set(false);
  }

  /**
   * Handle successful check-in
   * Update the ticket in the table to reflect USED status
   */
  onCheckInConfirmed(updatedTicket: QrTicketResult): void {
    // Update the ticket in our local data
    // The modal will only emit with status 'USED' on successful check-in
    this.allTickets.update((tickets) =>
      tickets.map((t) =>
        t.ticketNumber === updatedTicket.ticketNumber ? { ...t, status: 'USED' as const } : t,
      ),
    );
    // Close modal
    this.isCheckInModalOpen.set(false);
  }
}
