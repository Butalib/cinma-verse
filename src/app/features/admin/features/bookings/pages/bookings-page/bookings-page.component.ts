import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination.component';
import { BookingStatusModalComponent } from '../../components/booking-status-modal/booking-status-modal.component';
import { BookingViewModalComponent } from '../../components/booking-view-modal/booking-view-modal.component';
import { BookingsFiltersComponent } from '../../components/bookings-filters/bookings-filters.component';
import { BookingsHeaderComponent } from '../../components/bookings-header/bookings-header.component';
import { BookingsStatsComponent } from '../../components/bookings-stats/bookings-stats.component';
import { BookingsTableComponent } from '../../components/bookings-table/bookings-table.component';
import { BookingsFacade } from '../../facade/bookings.facade';
import type { Booking, BookingsFilters } from '../../models/booking.model';
import { CreateBookingPageComponent } from '../create-booking-page/create-booking-page.component';

@Component({
  selector: 'app-bookings-page',
  imports: [
    AsyncPipe,
    BookingsHeaderComponent,
    BookingsStatsComponent,
    BookingsFiltersComponent,
    BookingsTableComponent,
    PaginationComponent,
    BookingViewModalComponent,
    BookingStatusModalComponent,
    CreateBookingPageComponent,
  ],
  templateUrl: './bookings-page.component.html',
  styleUrl: './bookings-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingsPageComponent {
  protected readonly facade = inject(BookingsFacade);
  readonly isFilterOpen = signal(false);
  readonly isCreateBookingOpen = signal(false);

  onSearchChange(query: string): void {
    this.facade.setSearch(query);
  }

  toggleFilters(): void {
    this.isFilterOpen.update((value) => !value);
  }

  onExport(): void {
    console.log('Export bookings');
  }

  openCreateBookingModal(): void {
    this.isCreateBookingOpen.set(true);
  }

  closeCreateBookingModal(): void {
    this.isCreateBookingOpen.set(false);
  }

  onFiltersChange(filters: Partial<BookingsFilters>): void {
    this.facade.setFilters(filters);
  }

  onClearFilters(): void {
    this.facade.clearFilters();
  }

  onPageChange(page: number): void {
    this.facade.setPage(page);
  }

  onPageSizeChange(pageSize: number): void {
    this.facade.setPageSize(pageSize);
  }

  onViewBooking(booking: Booking): void {
    this.facade.openModal('view', booking);
  }

  onUpdateStatus(booking: Booking): void {
    this.facade.openModal('update', booking);
  }
}
