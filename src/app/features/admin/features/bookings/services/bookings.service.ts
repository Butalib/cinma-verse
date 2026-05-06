import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiClientService } from '../../../../../core/http/api-client.service';
import type { Booking, BookingsQuery, UpdateBookingStatusPayload } from '../models/booking.model';

export interface BookingsApiResponse {
  items?: Booking[];
  data?: Booking[];
  results?: Booking[];
  total?: number;
  count?: number;
  stats?: {
    totalBookings?: number;
    confirmedBookings?: number;
    pendingBookings?: number;
    totalRevenue?: number;
  };
}

const MOCK_BOOKINGS: Booking[] = [
  { id: 'BKG-3001', customerName: 'Liam Carter', customerEmail: 'liam.carter@example.com', movieTitle: 'Dune: Part Two', date: '2026-05-02', time: '19:30', seats: ['A1', 'A2'], amount: 45.00, status: 'CONFIRMED', createdAt: '2026-04-24' },
  { id: 'BKG-3002', customerName: 'Nora Salem', customerEmail: 'nora.salem@example.com', movieTitle: 'Inside Out 2', date: '2026-05-03', time: '13:00', seats: ['C4', 'C5', 'C6'], amount: 36.00, status: 'PENDING', createdAt: '2026-04-25' },
  { id: 'BKG-3003', customerName: 'Adam Blake', customerEmail: 'adam.blake@example.com', movieTitle: 'Oppenheimer', date: '2026-05-04', time: '20:00', seats: ['F8'], amount: 22.50, status: 'CANCELLED', createdAt: '2026-04-25' },
  { id: 'BKG-3004', customerName: 'Maya Chen', customerEmail: 'maya.chen@example.com', movieTitle: 'The Batman', date: '2026-05-05', time: '21:00', seats: ['D1', 'D2'], amount: 33.00, status: 'CONFIRMED', createdAt: '2026-04-26' },
  { id: 'BKG-3005', customerName: 'Omar Khaled', customerEmail: 'omar.khaled@example.com', movieTitle: 'Interstellar', date: '2026-05-06', time: '18:00', seats: ['B9'], amount: 16.00, status: 'COMPLETED', createdAt: '2026-04-26' },
  { id: 'BKG-3006', customerName: 'Sofia Rossi', customerEmail: 'sofia.rossi@example.com', movieTitle: 'Barbie', date: '2026-05-06', time: '15:00', seats: ['E3', 'E4'], amount: 27.00, status: 'CONFIRMED', createdAt: '2026-04-27' },
  { id: 'BKG-3007', customerName: 'Yousef Adel', customerEmail: 'yousef.adel@example.com', movieTitle: 'Inception', date: '2026-05-07', time: '19:30', seats: ['G7'], amount: 22.50, status: 'PENDING', createdAt: '2026-04-27' },
  { id: 'BKG-3008', customerName: 'Julia Martin', customerEmail: 'julia.martin@example.com', movieTitle: 'Avatar: The Way of Water', date: '2026-05-08', time: '09:30', seats: ['H1', 'H2'], amount: 50.00, status: 'CONFIRMED', createdAt: '2026-04-28' },
];

@Injectable({ providedIn: 'root' })
export class BookingsService {
  private readonly api = inject(ApiClientService);

  getBookings(query: BookingsQuery): Observable<BookingsApiResponse> {
    return this.api.get<BookingsApiResponse>('/bookings', this.toParams(query));
  }

  updateBookingStatus(id: string, payload: UpdateBookingStatusPayload): Observable<Booking> {
    return this.api.put<Booking, UpdateBookingStatusPayload>(`/bookings/${id}/status`, payload);
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
      search: query.search,
      status: query.status,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      amountMin: query.amountMin ?? '',
      amountMax: query.amountMax ?? '',
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  private filterMock(query: BookingsQuery): Booking[] {
    const term = query.search.trim().toLowerCase();

    return MOCK_BOOKINGS.filter((booking) => {
      if (term) {
        const target = `${booking.id} ${booking.customerName} ${booking.customerEmail} ${booking.movieTitle}`.toLowerCase();
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
}
