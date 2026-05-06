import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { BookingsStats } from '../../models/booking.model';

@Component({
  selector: 'app-bookings-stats',
  imports: [],
  templateUrl: './bookings-stats.component.html',
  styleUrl: './bookings-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingsStatsComponent {
  readonly stats = input.required<BookingsStats>();
}
