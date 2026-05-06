import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BookingRowComponent } from '../booking-row/booking-row.component';
import type { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-bookings-table',
  imports: [BookingRowComponent],
  templateUrl: './bookings-table.component.html',
  styleUrl: './bookings-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingsTableComponent {
  readonly bookings = input.required<Booking[]>();
  readonly loading = input(false);

  readonly viewBooking = output<Booking>();
  readonly updateStatus = output<Booking>();
  readonly deleteBooking = output<Booking>();

  trackByBookingId(_: number, booking: Booking): string {
    return booking.id;
  }
}
