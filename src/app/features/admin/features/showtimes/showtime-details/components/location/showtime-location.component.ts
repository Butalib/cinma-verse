import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ShowtimeDetail } from '../../models/showtime-detail.model';

@Component({
  selector: 'app-showtime-location',
  standalone: true,
  templateUrl: './showtime-location.component.html',
  styleUrl: './showtime-location.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowtimeLocationComponent {
  readonly showtime = input.required<ShowtimeDetail>();
}
