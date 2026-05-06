import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiClientService } from '../../../../../core/http/api-client.service';
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
    return this.api.get<BookingShowtimeOption[]>('/showtimes');
  }

  getFallbackShowtimes(): Observable<BookingShowtimeOption[]> {
    return of(MOCK_SHOWTIMES);
  }

  createBooking(payload: CreateBookingPayload): Observable<Booking> {
    return this.api.post<Booking, CreateBookingPayload>('/bookings', payload);
  }
}
