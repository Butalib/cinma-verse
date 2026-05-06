import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ShowtimeDetail } from '../../models/showtime-detail.model';

@Component({
  selector: 'app-showtime-schedule',
  standalone: true,
  templateUrl: './showtime-schedule.component.html',
  styleUrl: './showtime-schedule.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowtimeScheduleComponent {
  readonly showtime = input.required<ShowtimeDetail>();

  formatTimeTo12h(time: string): string {
    const [h, m] = time.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return time;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
  }
}
