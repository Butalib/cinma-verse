import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiClientService } from '../../../../../core/http/api-client.service';
import { AdminBookingDto, AdminPagedResponse, AdminShowtimeDto } from '../../../admin-api.models';
import type { Booking } from '../models/booking.model';
import type { BookingShowtimeOption, CreateBookingPayload } from '../models/booking-create.model';

const MOCK_SHOWTIMES: BookingShowtimeOption[] = [
  {
    id: 'SHW-2001',
    movieTitle: 'Dune: Part Two',
    branchName: 'Eastgate Mall Cinema',
    hallName: 'Screen 3',
    date: '2026-05-02',
    startTime: '19:30',
    price: 18.0,
    availableSeats: 42,
  },
  {
    id: 'SHW-2002',
    movieTitle: 'Inside Out 2',
    branchName: 'Downtown Cinema',
    hallName: 'Hall A',
    date: '2026-05-03',
    startTime: '13:00',
    price: 12.0,
    availableSeats: 58,
  },
  {
    id: 'SHW-2003',
    movieTitle: 'Oppenheimer',
    branchName: 'Westside Plex',
    hallName: 'IMAX 1',
    date: '2026-05-04',
    startTime: '20:00',
    price: 22.5,
    availableSeats: 20,
  },
  {
    id: 'SHW-2004',
    movieTitle: 'The Batman',
    branchName: 'Eastgate Mall Cinema',
    hallName: 'Screen 1',
    date: '2026-05-05',
    startTime: '21:00',
    price: 16.5,
    availableSeats: 75,
  },
  {
    id: 'SHW-2005',
    movieTitle: 'Barbie',
    branchName: 'Downtown Cinema',
    hallName: 'Hall B',
    date: '2026-05-06',
    startTime: '15:00',
    price: 13.5,
    availableSeats: 34,
  },
  {
    id: 'SHW-2006',
    movieTitle: 'Avatar: The Way of Water',
    branchName: 'Westside Plex',
    hallName: 'Hall C',
    date: '2026-05-08',
    startTime: '09:30',
    price: 25.0,
    availableSeats: 16,
  },
];

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

  getFallbackShowtimes(): Observable<BookingShowtimeOption[]> {
    return new Observable<BookingShowtimeOption[]>((subscriber) => {
      subscriber.next(MOCK_SHOWTIMES);
      subscriber.complete();
    });
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
      branchName: dto.branchName ?? '—',
      hallName: dto.hallNumber ? `Hall ${dto.hallNumber}` : '—',
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
