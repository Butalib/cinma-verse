import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketViewData as TicketViewDataModel } from '../../../models/ticket.models';

export type TicketViewData = TicketViewDataModel;

@Component({
  selector: 'app-ticket-view-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket-view-modal.component.html',
  styleUrl: './ticket-view-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketViewModalComponent {
  readonly ticket = input.required<TicketViewData>();
  readonly closeModal = output<void>();
  readonly viewBooking = output<string>();

  getQrUrl(): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${this.ticket().ticketNumber}&bgcolor=0d1117&color=8aebff`;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('ticket-modal-overlay')) {
      this.closeModal.emit();
    }
  }
}
