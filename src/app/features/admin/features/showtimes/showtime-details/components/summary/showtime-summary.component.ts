import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ShowtimeDetail } from '../../models/showtime-detail.model';

@Component({
  selector: 'app-showtime-summary',
  standalone: true,
  templateUrl: './showtime-summary.component.html',
  styleUrl: './showtime-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowtimeSummaryComponent {
  readonly showtime = input.required<ShowtimeDetail>();
  readonly formattedDate = input.required<string>();
  readonly formattedTime = input.required<string>();

  getStatusClass(status: string): string {
    switch (status) {
      case 'SCHEDULED':   return 'badge-scheduled';
      case 'NOW_SHOWING': return 'badge-now-showing';
      case 'COMPLETED':   return 'badge-completed';
      case 'CANCELLED':   return 'badge-cancelled';
      default:            return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'SCHEDULED':   return 'Scheduled';
      case 'NOW_SHOWING': return 'Now Showing';
      case 'COMPLETED':   return 'Completed';
      case 'CANCELLED':   return 'Cancelled';
      default:            return status;
    }
  }
}
