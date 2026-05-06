import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BookingCreateFormComponent } from '../../components/booking-create-form/booking-create-form.component';
import { BookingSummaryComponent } from '../../components/booking-summary/booking-summary.component';
import { BookingCreateFacade } from '../../facade/booking-create.facade';

@Component({
  selector: 'app-create-booking-page',
  imports: [BookingCreateFormComponent, BookingSummaryComponent],
  providers: [BookingCreateFacade],
  templateUrl: './create-booking-page.component.html',
  styleUrl: './create-booking-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateBookingPageComponent {
  readonly overlayMode = input(false);
  readonly closeRequested = output<void>();
}
