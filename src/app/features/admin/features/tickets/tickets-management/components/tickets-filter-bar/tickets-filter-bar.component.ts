import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketStatus, TicketsFilter } from '../../../models/ticket.models';

@Component({
  selector: 'app-tickets-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tickets-filter-bar.component.html',
  styleUrl: './tickets-filter-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketsFilterBarComponent {
  readonly applyFilters = output<TicketsFilter>();
  readonly resetFilters = output<void>();

  readonly status = signal<TicketStatus | ''>('');
  readonly bookingId = signal('');
  readonly showtimeId = signal('');
  readonly userId = signal('');
  readonly ticketNo = signal('');
  readonly startDate = signal('');
  readonly endDate = signal('');

  onApply(): void {
    const filter: TicketsFilter = {};
    const status = this.status();
    if (status) filter.status = status;
    if (this.bookingId()) filter.bookingId = this.bookingId();
    if (this.showtimeId()) filter.showtimeId = this.showtimeId();
    if (this.userId()) filter.userId = this.userId();
    if (this.ticketNo()) filter.ticketNo = this.ticketNo();
    if (this.startDate()) filter.startDate = this.startDate();
    if (this.endDate()) filter.endDate = this.endDate();
    this.applyFilters.emit(filter);
  }

  onReset(): void {
    this.status.set('');
    this.bookingId.set('');
    this.showtimeId.set('');
    this.userId.set('');
    this.ticketNo.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.resetFilters.emit();
  }
}
