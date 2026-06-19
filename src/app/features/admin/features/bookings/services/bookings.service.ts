import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
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
