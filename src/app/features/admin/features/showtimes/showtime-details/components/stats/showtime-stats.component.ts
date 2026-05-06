import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ShowtimeStats } from '../../models/showtime-detail.model';

@Component({
  selector: 'app-showtime-stats',
  standalone: true,
  templateUrl: './showtime-stats.component.html',
  styleUrl: './showtime-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowtimeStatsComponent {
  readonly stats = input.required<ShowtimeStats>();
}
