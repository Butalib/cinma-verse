import { Injectable, inject } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { ApiClientService } from '../../../../../core/http/api-client.service';
import { AdminBookingDto, AdminPagedResponse } from '../../../admin-api.models';
import type { Booking, BookingsQuery, UpdateBookingStatusPayload } from '../models/booking.model';

export interface BookingsApiResponse {
  items?: Booking[];
  data?: Booking[];
  results?: Booking[];
  total?: number;
  count?: number;
  totalCount?: number;
  stats?: {
    totalBookings?: number;
    confirmedBookings?: number;
    pendingBookings?: number;
    totalRevenue?: number;
  };
}

const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'BKG-3001',
    customerName: 'Liam Carter',
    customerEmail: 'liam.carter@example.com',
    movieTitle: 'Dune: Part Two',
    date: '2026-05-02',
    time: '19:30',
    seats: ['A1', 'A2'],
    amount: 45.0,
    status: 'CONFIRMED',
    createdAt: '2026-04-24',
  },
  {
    id: 'BKG-3002',
    customerName: 'Nora Salem',
    customerEmail: 'nora.salem@example.com',
    movieTitle: 'Inside Out 2',
    date: '2026-05-03',
    time: '13:00',
    seats: ['C4', 'C5', 'C6'],
    amount: 36.0,
    status: 'PENDING',
    createdAt: '2026-04-25',
  },
  {
    id: 'BKG-3003',
    customerName: 'Adam Blake',
    customerEmail: 'adam.blake@example.com',
    movieTitle: 'Oppenheimer',
    date: '2026-05-04',
    time: '20:00',
    seats: ['F8'],
    amount: 22.5,
    status: 'CANCELLED',
    createdAt: '2026-04-25',
  },
  {
    id: 'BKG-3004',
    customerName: 'Maya Chen',
    customerEmail: 'maya.chen@example.com',
    movieTitle: 'The Batman',
    date: '2026-05-05',
    time: '21:00',
    seats: ['D1', 'D2'],
    amount: 33.0,
    status: 'CONFIRMED',
    createdAt: '2026-04-26',
  },
  {
    id: 'BKG-3005',
    customerName: 'Omar Khaled',
    customerEmail: 'omar.khaled@example.com',
    movieTitle: 'Interstellar',
    date: '2026-05-06',
    time: '18:00',
    seats: ['B9'],
    amount: 16.0,
    status: 'COMPLETED',
    createdAt: '2026-04-26',
  },
  {
    id: 'BKG-3006',
    customerName: 'Sofia Rossi',
    customerEmail: 'sofia.rossi@example.com',
    movieTitle: 'Barbie',
    date: '2026-05-06',
    time: '15:00',
    seats: ['E3', 'E4'],
    amount: 27.0,
    status: 'CONFIRMED',
    createdAt: '2026-04-27',
  },
  {
    id: 'BKG-3007',
    customerName: 'Yousef Adel',
    customerEmail: 'yousef.adel@example.com',
    movieTitle: 'Inception',
    date: '2026-05-07',
    time: '19:30',
    seats: ['G7'],
    amount: 22.5,
    status: 'PENDING',
    createdAt: '2026-04-27',
  },
  {
    id: 'BKG-3008',
    customerName: 'Julia Martin',
    customerEmail: 'julia.martin@example.com',
    movieTitle: 'Avatar: The Way of Water',
    date: '2026-05-08',
    time: '09:30',
    seats: ['H1', 'H2'],
    amount: 50.0,
    status: 'CONFIRMED',
    createdAt: '2026-04-28',
  },
];

@Injectable({ providedIn: 'root' })
export class BookingsService {
  private readonly api = inject(ApiClientService);

  getBookings(query: BookingsQuery): Observable<BookingsApiResponse> {
    return this.api
      .get<AdminPagedResponse<AdminBookingDto>>('/api/admin/bookings', this.toParams(query))
      .pipe(
        map((response) => {
          const items = (response.items ?? response.data ?? response.results ?? []).map((item) =>
            this.mapBooking(item),
          );
          return {
            items,
            total: response.totalCount ?? response.total ?? response.count ?? items.length,
            count: response.totalCount ?? response.total ?? response.count ?? items.length,
            stats: this.calculateStats(items),
          } satisfies BookingsApiResponse;
        }),
      );
  }

  updateBookingStatus(id: string, payload: UpdateBookingStatusPayload): Observable<void> {
    const status = this.toApiStatus(payload.status);
    return this.api
      .post<
        void,
        { status: string }
      >(`/api/admin/bookings/${this.extractNumericId(id) ?? id}/status`, { status })
      .pipe();
  }

  getFallbackBookings(query: BookingsQuery): Observable<BookingsApiResponse> {
    const filtered = this.filterMock(query);
    const start = (query.page - 1) * query.pageSize;
    const items = filtered.slice(start, start + query.pageSize);

    return of({
      items,
      total: filtered.length,
      stats: this.calculateStats(filtered),
    });
  }

  private toParams(query: BookingsQuery): Record<string, string | number | boolean> {
    return {
      SearchTerm: query.search,
      Status: query.status === 'ALL' ? '' : this.toApiStatus(query.status),
      CreatedFrom: query.dateFrom ? `${query.dateFrom}T00:00:00` : '',
      CreatedTo: query.dateTo ? `${query.dateTo}T23:59:59` : '',
      MinAmount: query.amountMin ?? '',
      MaxAmount: query.amountMax ?? '',
      Page: query.page,
      PageSize: query.pageSize,
    };
  }

  private filterMock(query: BookingsQuery): Booking[] {
    const term = query.search.trim().toLowerCase();

    return MOCK_BOOKINGS.filter((booking) => {
      if (term) {
        const target =
          `${booking.id} ${booking.customerName} ${booking.customerEmail} ${booking.movieTitle}`.toLowerCase();
        if (!target.includes(term)) {
          return false;
        }
      }

      if (query.status !== 'ALL' && booking.status !== query.status) {
        return false;
      }

      if (query.dateFrom && booking.date < query.dateFrom) {
        return false;
      }

      if (query.dateTo && booking.date > query.dateTo) {
        return false;
      }

      if (query.amountMin !== null && booking.amount < query.amountMin) {
        return false;
      }

      if (query.amountMax !== null && booking.amount > query.amountMax) {
        return false;
      }

      return true;
    });
  }

  private calculateStats(items: Booking[]): BookingsApiResponse['stats'] {
    return {
      totalBookings: items.length,
      confirmedBookings: items.filter((item) => item.status === 'CONFIRMED').length,
      pendingBookings: items.filter((item) => item.status === 'PENDING').length,
      totalRevenue: items.reduce((total, item) => total + item.amount, 0),
    };
  }

  private mapBooking(dto: AdminBookingDto): Booking {
    const created = dto.createdAt ? new Date(dto.createdAt) : new Date();
    const start = dto.showtime?.startTime ? new Date(dto.showtime.startTime) : null;

    const date =
      start && !Number.isNaN(start.getTime())
        ? start.toISOString().slice(0, 10)
        : created.toISOString().slice(0, 10);
    const time =
      start && !Number.isNaN(start.getTime())
        ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        : created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    const status = this.fromApiStatus(dto.status);

    return {
      id: dto.bookingId
        ? `BKG-${dto.bookingId}`
        : `BKG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      customerName: dto.customerName ?? 'Unknown customer',
      customerEmail: dto.customerEmail ?? '—',
      movieTitle: dto.showtime?.movieTitle ?? 'Unknown movie',
      date,
      time,
      seats: (dto.bookedSeats ?? []).map((seat) => seat.seatLabel ?? '').filter(Boolean),
      amount: dto.totalAmount ?? 0,
      status,
      createdAt: created.toISOString().slice(0, 10),
    };
  }

  private fromApiStatus(status?: string): Booking['status'] {
    const normalized = (status ?? '').toLowerCase();
    if (normalized === 'confirmed') {
      return 'CONFIRMED';
    }
    if (normalized === 'cancelled' || normalized === 'canceled') {
      return 'CANCELLED';
    }
    if (normalized === 'expired') {
      return 'COMPLETED';
    }
    return 'PENDING';
  }

  private extractNumericId(value: string): number | null {
    const match = value.match(/\d+/);
    if (!match) {
      return null;
    }

    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toApiStatus(status: string): string {
    const normalized = status.toUpperCase();
    if (normalized === 'CONFIRMED') {
      return 'Confirmed';
    }
    if (normalized === 'CANCELLED') {
      return 'Cancelled';
    }
    if (normalized === 'COMPLETED') {
      return 'Expired';
    }
    return 'Pending';
  }
}
