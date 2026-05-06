import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BookingCreateFacade } from '../../facade/booking-create.facade';

@Component({
  selector: 'app-booking-create-form',
  imports: [AsyncPipe],
  templateUrl: './booking-create-form.component.html',
  styleUrl: './booking-create-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingCreateFormComponent {
  protected readonly facade = inject(BookingCreateFacade);

  onCustomerNameInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.facade.setCustomerName(target?.value ?? '');
  }

  onCustomerEmailInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.facade.setCustomerEmail(target?.value ?? '');
  }

  onShowtimeChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.facade.selectShowtime(target?.value ?? '');
  }

  onSeatToggle(seat: string): void {
    this.facade.toggleSeat(seat);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.facade.submit();
  }
}
