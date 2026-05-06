import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ModalBodyComponent } from '../../../../../../shared/ui/modal/modal-body.component';
import { ModalContainerComponent } from '../../../../../../shared/ui/modal/modal-container.component';
import { ModalFooterComponent } from '../../../../../../shared/ui/modal/modal-footer.component';
import { ModalHeaderComponent } from '../../../../../../shared/ui/modal/modal-header.component';
import { BookingsFacade } from '../../facade/bookings.facade';
import type { BookingStatus } from '../../models/booking.model';

interface StatusOption {
  value: BookingStatus;
  label: string;
  description: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'PENDING', label: 'Pending', description: 'Awaiting confirmation from the admin.' },
  { value: 'CONFIRMED', label: 'Confirmed', description: 'Seats are locked and ready.' },
  { value: 'CANCELLED', label: 'Cancelled', description: 'Booking is void and seats reopen.' },
  { value: 'COMPLETED', label: 'Completed', description: 'Showtime has finished.' },
];

@Component({
  selector: 'app-booking-status-modal',
  imports: [
    ModalContainerComponent,
    ModalHeaderComponent,
    ModalBodyComponent,
    ModalFooterComponent,
  ],
  templateUrl: './booking-status-modal.component.html',
  styleUrl: './booking-status-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingStatusModalComponent {
  private readonly facade = inject(BookingsFacade);

  readonly statusOptions = STATUS_OPTIONS;
  readonly selectedStatus = signal<BookingStatus | null>(null);
  readonly isSaving = this.facade.statusSaving;

  readonly viewModel = computed(() => {
    const booking = this.facade.selectedBooking();
    if (!booking) {
      return null;
    }

    return {
      id: booking.id,
      customerName: booking.customerName,
      movieTitle: booking.movieTitle,
      dateTime: `${booking.date} · ${booking.time}`,
      seats: booking.seats.join(', '),
    };
  });

  readonly submitLabel = computed(() => (this.isSaving() ? 'Saving...' : 'Update Status'));
  readonly isSubmitDisabled = computed(() => this.isSaving() || !this.selectedStatus());

  constructor() {
    effect(() => {
      const booking = this.facade.selectedBooking();
      const activeModal = this.facade.activeModal();

      if (activeModal !== 'update' || !booking) {
        this.selectedStatus.set(null);
        return;
      }

      this.selectedStatus.set(booking.status);
    });
  }

  onClose(): void {
    if (this.isSaving()) {
      return;
    }

    this.facade.closeModal();
  }

  onSelectStatus(status: BookingStatus): void {
    this.selectedStatus.set(status);
  }

  onSubmit(): void {
    if (this.isSubmitDisabled()) {
      return;
    }

    const status = this.selectedStatus();
    if (!status) {
      return;
    }

    this.facade.updateStatus(status);
  }
}
