import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModalBodyComponent } from '../../../../../../shared/ui/modal/modal-body.component';
import { ModalContainerComponent } from '../../../../../../shared/ui/modal/modal-container.component';
import { ModalFooterComponent } from '../../../../../../shared/ui/modal/modal-footer.component';
import { ModalHeaderComponent } from '../../../../../../shared/ui/modal/modal-header.component';
import { BookingsFacade } from '../../facade/bookings.facade';
import type { BookingStatus } from '../../models/booking.model';

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'booking-status-badge booking-status-badge--pending' },
  CONFIRMED: {
    label: 'Confirmed',
    className: 'booking-status-badge booking-status-badge--confirmed',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'booking-status-badge booking-status-badge--cancelled',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'booking-status-badge booking-status-badge--completed',
  },
};

@Component({
  selector: 'app-booking-view-modal',
  imports: [
    ModalContainerComponent,
    ModalHeaderComponent,
    ModalBodyComponent,
    ModalFooterComponent,
  ],
  templateUrl: './booking-view-modal.component.html',
  styleUrl: './booking-view-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingViewModalComponent {
  private readonly facade = inject(BookingsFacade);

  readonly viewModel = computed(() => {
    const booking = this.facade.selectedBooking();
    if (!booking) {
      return null;
    }

    const statusConfig = STATUS_CONFIG[booking.status];

    return {
      id: booking.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      movieTitle: booking.movieTitle,
      dateTime: `${booking.date} · ${booking.time}`,
      seats: booking.seats.join(', '),
      amount: `$${booking.amount.toFixed(2)}`,
      statusLabel: statusConfig.label,
      statusClass: statusConfig.className,
      createdAt: booking.createdAt,
    };
  });

  onClose(): void {
    this.facade.closeModal();
  }

  onUpdateStatus(): void {
    this.facade.openModal('update');
  }
}
