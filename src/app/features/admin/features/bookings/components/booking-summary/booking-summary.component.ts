import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BookingCreateFacade } from '../../facade/booking-create.facade';

@Component({
  selector: 'app-booking-summary',
  imports: [],
  templateUrl: './booking-summary.component.html',
  styleUrl: './booking-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingSummaryComponent {
  protected readonly facade = inject(BookingCreateFacade);
}
