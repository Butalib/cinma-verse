import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { Booking, BookingStatus } from '../../models/booking.model';

const STATUS_META: Record<BookingStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'badge--status-pending' },
  CONFIRMED: { label: 'Confirmed', className: 'badge--status-confirmed' },
  CANCELLED: { label: 'Cancelled', className: 'badge--status-cancelled' },
  COMPLETED: { label: 'Completed', className: 'badge--status-completed' },
};

@Component({
  selector: 'app-booking-row',
  imports: [],
  templateUrl: './booking-row.component.html',
  styleUrl: './booking-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'bookings-table__row',
    role: 'row',
  },
})
export class BookingRowComponent {
  readonly booking = input.required<Booking>();

  readonly viewClicked = output<Booking>();
  readonly updateStatusClicked = output<Booking>();
  readonly deleteClicked = output<Booking>();

  readonly viewModel = computed(() => {
    const booking = this.booking();
    const statusMeta = STATUS_META[booking.status];

    return {
      id: booking.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      movieTitle: booking.movieTitle,
      dateTime: `${booking.date} · ${booking.time}`,
      seats: booking.seats.join(', '),
      amount: `$${booking.amount.toFixed(2)}`,
      statusLabel: statusMeta.label,
      statusClass: statusMeta.className,
      booking,
    };
  });
}
