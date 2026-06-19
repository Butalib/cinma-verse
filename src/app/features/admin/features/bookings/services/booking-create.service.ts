import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiClientService } from '../../../../../core/http/api-client.service';
import { AdminBookingDto, AdminPagedResponse, AdminShowtimeDto } from '../../../admin-api.models';
import type { Booking } from '../models/booking.model';
import type { BookingShowtimeOption, CreateBookingPayload } from '../models/booking-create.model';

@Injectable({ providedIn: 'root' })
export class BookingCreateService {
  private readonly api = inject(ApiClientService);

  getShowtimes(): Observable<BookingShowtimeOption[]> {
    return this.api
      .get<AdminPagedResponse<AdminShowtimeDto>>('/api/admin/showtimes', { Page: 1, PageSize: 100 })
      .pipe(
        map((response) => this.extractShowtimes(response).map((item) => this.mapShowtime(item))),
      );
  }

  createBooking(payload: CreateBookingPayload): Observable<Booking> {
    const movieShowTimeId = this.extractNumericId(payload.showtimeId) ?? 0;
    const seatIds = payload.seats
      .map((seat) => this.extractNumericId(seat))
      .filter((value): value is number => typeof value === 'number' && value > 0);

    return this.api
      .post<AdminBookingDto, { userId: number; movieShowTimeId: number; seatIds: number[] }>(
        '/api/admin/bookings',
        {
          userId: 1,
          movieShowTimeId,
          seatIds,
        },
      )
      .pipe(map((dto) => this.mapBooking(dto, payload)));
  }

  private extractShowtimes(response: AdminPagedResponse<AdminShowtimeDto>): AdminShowtimeDto[] {
    return response.items ?? response.data ?? response.results ?? [];
  }

  private mapShowtime(dto: AdminShowtimeDto): BookingShowtimeOption {
    const start = dto.showStartTime ? new Date(dto.showStartTime) : null;
    const date = start && !Number.isNaN(start.getTime()) ? start.toISOString().slice(0, 10) : '';
    const startTime =
      start && !Number.isNaN(start.getTime())
        ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        : '';

    return {
      id: dto.id ? `SHW-${dto.id}` : `SHW-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      movieTitle: dto.movieName ?? dto.movieTitle ?? 'Unknown movie',
      branchName: dto.branchName ?? 'â€”',
      hallName: dto.hallNumber ? `Hall ${dto.hallNumber}` : 'â€”',
      date,
      startTime,
      price: dto.price ?? 0,
      availableSeats: dto.availableSeats ?? 0,
    };
  }

  private mapBooking(dto: AdminBookingDto, payload: CreateBookingPayload): Booking {
    const created = dto.createdAt ? new Date(dto.createdAt) : new Date();
    const start = dto.showtime?.startTime ? new Date(dto.showtime.startTime) : null;

    return {
      id: dto.bookingId
        ? `BKG-${dto.bookingId}`
        : `BKG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      customerName: dto.customerName ?? payload.customerName,
      customerEmail: dto.customerEmail ?? payload.customerEmail,
      movieTitle: dto.showtime?.movieTitle ?? 'Unknown movie',
      date:
        start && !Number.isNaN(start.getTime())
          ? start.toISOString().slice(0, 10)
          : created.toISOString().slice(0, 10),
      time:
        start && !Number.isNaN(start.getTime())
          ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
          : created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      seats: (dto.bookedSeats ?? []).map((seat) => seat.seatLabel ?? '').filter(Boolean),
      amount: dto.totalAmount ?? 0,
      status: 'PENDING',
      createdAt: created.toISOString().slice(0, 10),
    };
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
