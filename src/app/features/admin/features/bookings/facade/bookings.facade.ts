import { computed, inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  finalize,
  map,
  merge,
  of,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import type {
  Booking,
  BookingsFilters,
  BookingsPagination,
  BookingsQuery,
  BookingsStats,
  BookingStatus,
} from '../models/booking.model';
import { BookingsApiResponse, BookingsService } from '../services/bookings.service';

const DEFAULT_FILTERS: BookingsFilters = {
  search: '',
  status: 'ALL',
  dateFrom: '',
  dateTo: '',
  amountMin: null,
  amountMax: null,
};

const DEFAULT_STATS: BookingsStats = {
  totalBookings: 0,
  confirmedBookings: 0,
  pendingBookings: 0,
  totalRevenue: 0,
};

interface BookingStatusUpdateRequest {
  id: string;
  status: BookingStatus;
}

type BookingModal = 'view' | 'update' | null;

@Injectable({ providedIn: 'root' })
export class BookingsFacade {
  private readonly bookingsService = inject(BookingsService);
  private readonly statusUpdateRequests = new Subject<BookingStatusUpdateRequest>();

  readonly filters = signal<BookingsFilters>(DEFAULT_FILTERS);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly total = signal(0);
  readonly pagination = computed<BookingsPagination>(() => ({
    page: this.page(),
    pageSize: this.pageSize(),
    total: this.total(),
  }));
  readonly loading = signal(false);
  readonly stats = signal<BookingsStats>(DEFAULT_STATS);

  readonly selectedBooking = signal<Booking | null>(null);
  readonly activeModal = signal<BookingModal>(null);
  readonly statusSaving = signal(false);

  private readonly query = computed<BookingsQuery>(() => {
    const filters = this.filters();

    return {
      ...filters,
      page: this.page(),
      pageSize: this.pageSize(),
    };
  });

  private readonly query$ = toObservable(this.query).pipe(debounceTime(350));

  private readonly statusRefresh$ = this.statusUpdateRequests.pipe(
    tap(() => this.statusSaving.set(true)),
    switchMap((request) =>
      this.bookingsService.updateBookingStatus(request.id, { status: request.status }).pipe(
        tap(() => {
          this.closeModal();
        }),
        catchError(() => of(null)),
        finalize(() => this.statusSaving.set(false)),
      ),
    ),
    map(() => this.query()),
  );

  readonly bookings$ = merge(this.query$, this.statusRefresh$).pipe(
    startWith(this.query()),
    tap(() => this.loading.set(true)),
    switchMap((query) =>
      this.bookingsService.getBookings(query).pipe(
        catchError(() =>
          of({
            items: [],
            total: 0,
            stats: DEFAULT_STATS,
          }),
        ),
        finalize(() => this.loading.set(false)),
      ),
    ),
    map((response) => this.normalizeResponse(response)),
    tap((result) => {
      this.total.set(result.total);
      this.stats.set(result.stats);
    }),
    map((result) => result.items),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  setSearch(query: string): void {
    this.filters.update((filters) => ({ ...filters, search: query }));
    this.resetPage();
  }

  setFilters(filters: Partial<BookingsFilters>): void {
    this.filters.update((current) => ({ ...current, ...filters }));
    this.resetPage();
  }

  clearFilters(): void {
    this.filters.set(DEFAULT_FILTERS);
    this.resetPage();
  }

  setPage(page: number): void {
    this.page.set(page);
  }

  setPageSize(pageSize: number): void {
    this.page.set(1);
    this.pageSize.set(pageSize);
  }

  openModal(modal: Exclude<BookingModal, null>, booking?: Booking): void {
    if (booking) {
      this.selectedBooking.set(booking);
    }

    if (!this.selectedBooking()) {
      return;
    }

    this.activeModal.set(modal);
  }

  closeModal(): void {
    this.activeModal.set(null);
    this.selectedBooking.set(null);
  }

  updateStatus(status: BookingStatus): void {
    const booking = this.selectedBooking();
    if (!booking || this.statusSaving()) {
      return;
    }

    this.statusUpdateRequests.next({ id: booking.id, status });
  }

  private resetPage(): void {
    this.page.set(1);
  }

  private normalizeResponse(response: BookingsApiResponse): {
    items: Booking[];
    total: number;
    stats: BookingsStats;
  } {
    const items = response.items ?? response.data ?? response.results ?? [];
    const total = response.total ?? response.count ?? items.length;

    return {
      items,
      total,
      stats: {
        totalBookings: response.stats?.totalBookings ?? total,
        confirmedBookings: response.stats?.confirmedBookings ?? 0,
        pendingBookings: response.stats?.pendingBookings ?? 0,
        totalRevenue: response.stats?.totalRevenue ?? 0,
      },
    };
  }
}
